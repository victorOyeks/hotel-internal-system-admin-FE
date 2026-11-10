"use client";

import {
	DeleteIcon,
	LockIcon,
	MailIcon,
	SearchIcon,
	XIcon,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { unlockWithPin } from "@hospio/api/actions/devices";
import type {
	LockScreen as LockScreenData,
	LockScreenPerson,
} from "@hospio/api/api/routes-devices";
import { isHotelRole, roleLabels } from "@hospio/api/roles";
import { initials } from "@hospio/ui/shared/format";
import { cn } from "@hospio/ui/utils";
import { BigButton } from "@/components/roles/shared-staff/tablet";

const roleText = (roles: string[]) =>
	roles.map((r) => (isHotelRole(r) ? roleLabels[r] : r)).join(" · ");

function minutesLeft(until: string) {
	return Math.max(
		1,
		Math.ceil((new Date(until).getTime() - Date.now()) / 60_000),
	);
}

/**
 * The lock screen of a shared device (docs/shared-devices.md in hospio-backend): the hotel and device, a tile per person who
 * can use it, search, and the PIN pad. A tile with no PIN yet opens the normal sign-in page with that person's email.
 */
export function LockScreen({
	device,
	reason,
}: {
	device: LockScreenData;
	reason?: string;
}) {
	const [q, setQ] = useState("");
	const [person, setPerson] = useState<LockScreenPerson | null>(null);
	const [now, setNow] = useState<Date | null>(null);
	useEffect(() => {
		setNow(new Date());
		const t = window.setInterval(() => setNow(new Date()), 30_000);
		return () => window.clearInterval(t);
	}, []);
	const people = useMemo(() => {
		const s = q.trim().toLowerCase();
		return s
			? device.people.filter(
					(p) =>
						p.fullName.toLowerCase().includes(s) ||
						roleText(p.roles).toLowerCase().includes(s),
				)
			: device.people;
	}, [q, device.people]);

	const open = (p: LockScreenPerson) => {
		if (!p.hasPin) {
			window.location.assign(
				`/auth?shared=1${p.email ? `&email=${encodeURIComponent(p.email)}` : ""}`,
			);
			return;
		}
		setPerson(p);
	};

	return (
		<main className="flex min-h-svh flex-col bg-page">
			<header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-card px-4 py-4 sm:px-8">
				<div className="min-w-0">
					<p className="truncate text-xl font-bold text-ink sm:text-2xl">
						{device.hotelName ?? "Your hotel"}
					</p>
					<p className="mt-1 flex items-center gap-2 text-sm text-ink-2">
						<LockIcon className="size-4" /> {device.name} ·{" "}
						{roleText(device.roles)}
					</p>
				</div>
				{now && (
					<p
						className="text-2xl font-semibold tabular-nums text-ink"
						suppressHydrationWarning
					>
						{now.toLocaleTimeString("en-NG", {
							hour: "numeric",
							minute: "2-digit",
						})}
					</p>
				)}
			</header>

			<section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
				{reason === "idle" && (
					<p className="rounded-[10px] bg-info-soft px-4 py-3 text-[13px] text-info">
						Locked after {device.autoLockMinutes}{" "}
						{device.autoLockMinutes === 1 ? "minute" : "minutes"} without use.
					</p>
				)}
				<div>
					<h1 className="text-lg font-bold text-ink">
						Who's using this device?
					</h1>
					<p className="text-sm text-ink-3">
						Tap your name and enter your PIN.
					</p>
				</div>
				<label className="flex h-12 items-center gap-3 rounded-control border border-line bg-card px-4">
					<SearchIcon className="size-5 text-ink-3" />
					<input
						type="search"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Find your name"
						aria-label="Find your name"
						className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
					/>
				</label>

				{device.people.length === 0 ? (
					<p className="rounded-card border border-line bg-card p-6 text-center text-sm text-ink-2">
						Nobody can use this device yet. Staff with a{" "}
						{roleText(device.roles)} role at this hotel appear here.
					</p>
				) : people.length === 0 ? (
					<p className="p-6 text-center text-sm text-ink-2">
						No one called “{q}”.
					</p>
				) : (
					<ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{people.map((p) => (
							<li key={p.userId}>
								<button
									type="button"
									onClick={() => open(p)}
									className="flex min-h-[88px] w-full items-center gap-3 rounded-card border border-line bg-card p-4 text-left transition-colors hover:border-brand/50 hover:bg-brand-soft/30 focus-visible:outline-2 focus-visible:outline-brand"
								>
									<span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-base font-bold text-white">
										{initials(p.fullName)}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-[15px] font-semibold text-ink">
											{p.fullName}
										</span>
										<span className="block truncate text-xs text-ink-3">
											{p.jobTitle || roleText(p.roles)}
										</span>
										{!p.hasPin ? (
											<span className="mt-1 inline-block rounded-pill bg-subtle px-2 py-[2px] text-[11px] font-semibold text-ink-2">
												No PIN yet · sign in
											</span>
										) : p.lockedUntil ? (
											<span className="mt-1 inline-block rounded-pill bg-danger-soft px-2 py-[2px] text-[11px] font-semibold text-danger">
												PIN locked · {minutesLeft(p.lockedUntil)} min
											</span>
										) : null}
									</span>
								</button>
							</li>
						))}
					</ul>
				)}

				<div className="mt-auto flex justify-center pt-6">
					<a
						href="/auth?shared=1"
						className="flex h-12 items-center gap-2 rounded-control px-4 text-[15px] font-semibold text-brand hover:bg-brand-soft/40"
					>
						<MailIcon className="size-5" /> Sign in with email instead
					</a>
				</div>
			</section>

			{person && <PinPad person={person} onClose={() => setPerson(null)} />}
		</main>
	);
}

/** Big keys for touch, and the keyboard (digits, Backspace, Enter, Escape) on a tablet with one. */
function PinPad({
	person,
	onClose,
}: {
	person: LockScreenPerson;
	onClose: () => void;
}) {
	const [pin, setPin] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, start] = useTransition();

	const submit = useCallback(
		(value: string) => {
			if (value.length < 4) return setError("Your PIN is 4 to 6 digits");
			start(async () => {
				const result = await unlockWithPin({
					userId: person.userId,
					pin: value,
				});
				if (!result.ok) {
					setError(result.error);
					setPin("");
					return;
				}
				window.location.assign("/dashboard");
			});
		},
		[person.userId],
	);
	const press = useCallback(
		(key: string) => {
			if (pending) return;
			setError(null);
			if (key === "back") setPin((p) => p.slice(0, -1));
			else if (key === "clear") setPin("");
			else setPin((p) => (p.length < 6 ? p + key : p));
		},
		[pending],
	);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (/^\d$/.test(e.key)) press(e.key);
			else if (e.key === "Backspace") press("back");
			else if (e.key === "Enter") submit(pin);
			else if (e.key === "Escape") onClose();
			else return;
			e.preventDefault();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [press, submit, pin, onClose]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
			role="dialog"
			aria-modal="true"
			aria-label={`Enter ${person.fullName}'s PIN`}
		>
			<div className="flex w-full max-w-sm flex-col gap-4 rounded-t-card bg-card p-5 sm:rounded-card">
				<div className="flex items-center gap-3">
					<span className="flex size-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
						{initials(person.fullName)}
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-[15px] font-semibold text-ink">
							{person.fullName}
						</p>
						<p className="text-xs text-ink-3">Enter your PIN</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Back to names"
						className="flex size-11 items-center justify-center rounded-xl text-ink-2 hover:bg-subtle"
					>
						<XIcon className="size-5" />
					</button>
				</div>
				<output
					className="flex justify-center gap-3 py-2"
					aria-label={`${pin.length} digits entered`}
				>
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<span
							key={i}
							className={cn(
								"size-4 rounded-full border-2",
								i < pin.length ? "border-brand bg-brand" : "border-line-strong",
								i >= 4 && i >= pin.length && "opacity-40",
							)}
						/>
					))}
				</output>
				{error && (
					<p
						role="alert"
						className="rounded-[10px] bg-danger-soft px-3 py-2 text-center text-[13px] text-danger"
					>
						{error}
					</p>
				)}
				<div className="grid grid-cols-3 gap-2">
					{["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
						<BigButton
							key={d}
							tone="secondary"
							className="h-14 text-xl"
							onClick={() => press(d)}
							aria-label={d}
						>
							{d}
						</BigButton>
					))}
					<BigButton
						tone="ghost"
						className="h-14"
						onClick={() => press("clear")}
						aria-label="Clear"
					>
						Clear
					</BigButton>
					<BigButton
						tone="secondary"
						className="h-14 text-xl"
						onClick={() => press("0")}
						aria-label="0"
					>
						0
					</BigButton>
					<BigButton
						tone="ghost"
						className="h-14"
						onClick={() => press("back")}
						aria-label="Delete last digit"
					>
						<DeleteIcon className="size-5" />
					</BigButton>
				</div>
				<BigButton
					pending={pending}
					disabled={pin.length < 4}
					onClick={() => submit(pin)}
				>
					Unlock
				</BigButton>
			</div>
		</div>
	);
}
