"use client";

import { CheckCircle2Icon, InfoIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveMyOnboardingStep } from "@hospio/api/actions/onboarding";
import { createRoomsBulk, createRoomType } from "@hospio/api/actions/property";
import { useAction } from "@hospio/api/actions/use-action";
import type { Business, Me } from "@hospio/api/api/schema";
import type { OwnerOnboardingData } from "@hospio/api/types";
import { Note } from "@hospio/ui/shared/detail-list";
import { ToggleField } from "@hospio/ui/shared/field";
import { naira, plural } from "@hospio/ui/shared/format";
import { btn, input as inputCls } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { SideCard, StepCard, StepFooter, StepPage, gridHead } from "./common";
import { useFreshOnOpen } from "./persist";
import { stepHref } from "./steps";

type Row = {
	key: string;
	name: string;
	guests: string;
	count: string;
	price: string;
	start: string;
	roomTypeId?: string;
};

const DEFAULTS: Omit<Row, "key">[] = [
	{ name: "Regular", guests: "2", count: "", price: "", start: "101" },
	{ name: "Deluxe", guests: "3", count: "", price: "", start: "201" },
];

let seq = 0;
const newRow = (i: number, patch: Partial<Row> = {}): Row => ({
	key: `r${++seq}`,
	name: "",
	guests: "2",
	count: "",
	price: "",
	start: `${(i + 1) * 100 + 1}`,
	...patch,
});

/** "A101" + 46 → A101…A146; "101" + 3 → 101, 102, 103; "B" + 2 → B1, B2. */
export function roomNumbers(start: string, count: number): string[] {
	const m = start.trim().match(/^(.*?)(\d+)$/);
	if (!m)
		return Array.from({ length: count }, (_, i) => `${start.trim()}${i + 1}`);
	const [, prefix, digits] = m;
	const from = Number.parseInt(digits, 10);
	return Array.from(
		{ length: count },
		(_, i) => `${prefix}${String(from + i).padStart(digits.length, "0")}`,
	);
}

/** ["101","102","103","201"] → "101–103, 201" */
export function ranges(numbers: string[]): string {
	const out: string[] = [];
	let i = 0;
	while (i < numbers.length) {
		let j = i;
		const num = (s: string) =>
			Number.parseInt(s.match(/(\d+)$/)?.[1] ?? "", 10);
		const pre = (s: string) => s.replace(/\d+$/, "");
		while (
			j + 1 < numbers.length &&
			pre(numbers[j + 1]) === pre(numbers[i]) &&
			num(numbers[j + 1]) === num(numbers[j]) + 1
		)
			j++;
		out.push(j > i ? `${numbers[i]}–${numbers[j]}` : numbers[i]);
		i = j + 1;
	}
	return out.length > 6 ? `${out.slice(0, 6).join(", ")} …` : out.join(", ");
}

/** The floor a number sits on, when it reads like 101/A204: the hundreds. */
function floorOf(number: string): string | undefined {
	const m = number.match(/(\d+)$/);
	if (!m) return undefined;
	const n = Number.parseInt(m[1], 10);
	return n >= 100 ? `Floor ${Math.floor(n / 100)}` : undefined;
}

/** Step 3 · Rooms & prices (Figma 3164:16373): room types → POST /property/room-types, rooms → POST /property/rooms/bulk, both with the new hotel's id. */
export function RoomsStep({
	draft,
	user,
}: {
	draft: OwnerOnboardingData;
	business?: Business | null;
	user?: Me | null;
}) {
	const router = useRouter();
	useFreshOnOpen();
	const hotel = draft.hotel;
	const saved = draft.rooms?.roomTypes ?? [];

	const [rows, setRows] = useState<Row[]>(() => {
		const existing = saved.map((t, i) =>
			newRow(i, {
				name: t.name,
				count: String(t.count),
				price: String(t.price),
				roomTypeId: t.roomTypeId,
				start: "—",
				guests: "—",
			}),
		);
		return existing.length ? existing : DEFAULTS.map((d, i) => newRow(i, d));
	});
	const [numberForMe, setNumberForMe] = useState(true);
	// Rows typed but not created yet are kept in this browser, so Back / Save and finish later lose nothing.
	const storeKey = `hospio:onboarding:${user?.id ?? "me"}:rooms`;
	const restored = useRef(false);
	useEffect(() => {
		try {
			const raw = localStorage.getItem(storeKey);
			if (raw) {
				const kept = JSON.parse(raw) as Row[];
				if (kept.length)
					setRows((rs) => [
						...rs.filter((r) => r.roomTypeId),
						...kept.map((r, i) => ({ ...r, key: `k${i}${r.key}` })),
					]);
			}
		} catch {
			// ignore
		}
		restored.current = true;
	}, [storeKey]);
	useEffect(() => {
		if (!restored.current) return;
		try {
			const fresh = rows.filter((r) => !r.roomTypeId);
			if (fresh.some((r) => r.count || r.price || r.name))
				localStorage.setItem(storeKey, JSON.stringify(fresh));
		} catch {
			// ignore
		}
	}, [rows, storeKey]);
	const [result, setResult] = useState<{
		created: number;
		skipped: string[];
		types: number;
		numbers: string[];
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { run, pending } = useAction();

	const update = (key: string, patch: Partial<Row>) =>
		setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
	const remove = (key: string) =>
		setRows((rs) => rs.filter((r) => r.key !== key));
	const fresh = rows.filter((r) => !r.roomTypeId);
	const total = rows.reduce(
		(s, r) => s + (Number.parseInt(r.count, 10) || 0),
		0,
	);
	const hotelName = hotel?.name ?? "your hotel";

	if (!hotel?.hotelId) {
		return (
			<StepPage>
				<StepCard
					step="rooms"
					title="Rooms & prices"
					intro="Add your first hotel before its rooms."
				>
					<Note tone="info">
						Step 2 has not been saved yet. Create the hotel first; its rooms
						come right after.
					</Note>
					<StepFooter back={stepHref("hotel")} />
					<Link href={stepHref("hotel")} className={cn(btn.primary, "w-fit")}>
						Go to Your first hotel
					</Link>
				</StepCard>
			</StepPage>
		);
	}

	/** Every problem with the rows, or null. Numbers must not repeat inside a type or across types. */
	function problem(): string | null {
		if (rows.length === 0) return "Add at least one room type";
		const names = new Set(saved.map((t) => t.name.trim().toLowerCase()));
		const taken = new Map<string, string>();
		for (const r of fresh) {
			const name = r.name.trim();
			if (name.length < 2 || name.replace(/[^\p{L}]/gu, "").length < 2)
				return "Every room type needs a name with letters, like Regular or Deluxe";
			if (name.length > 60)
				return `Keep "${name.slice(0, 20)}…" under 60 characters`;
			if (names.has(name.toLowerCase()))
				return `There is already a room type called ${name}`;
			names.add(name.toLowerCase());
			const guests = Number.parseInt(r.guests, 10);
			if (!(guests >= 1 && guests <= 20))
				return `Guests for ${name} must be between 1 and 20`;
			const count = Number.parseInt(r.count, 10);
			if (!(count >= 1))
				return `How many ${name} rooms are there? Enter 1 or more`;
			if (count > 500) return `${name}: at most 500 rooms per type here`;
			const price = Number.parseFloat(r.price);
			if (!(price >= 100))
				return `Enter a price per night for ${name} (at least ₦100)`;
			if (price > 100_000_000) return `The price for ${name} looks too high`;
			if (numberForMe) {
				const start = r.start.trim();
				if (!start) return `Enter the first room number for ${name}`;
				if (!/^[A-Za-z]{0,3}\d{1,5}$/.test(start))
					return `First room number for ${name} should look like 101 or A101`;
				for (const n of roomNumbers(start, count)) {
					const other = taken.get(n.toUpperCase());
					if (other)
						return other === name
							? `${name}'s numbers repeat`
							: `${name} and ${other} would both have room ${n}. Give ${name} a different first room number`;
					taken.set(n.toUpperCase(), name);
				}
			}
		}
		return null;
	}

	function submit() {
		setError(null);
		const p = problem();
		if (p) return setError(p);
		if (fresh.length === 0) {
			router.push(stepHref("manager"));
			return;
		}
		run(
			async () => {
				const made: {
					roomTypeId: string;
					name: string;
					price: number;
					count: number;
				}[] = saved.map((t) => ({ ...t }));
				const toCreate: {
					number: string;
					roomTypeId: string;
					floor?: string;
				}[] = [];
				for (const r of fresh) {
					const count = Number.parseInt(r.count, 10);
					const price = Number.parseFloat(r.price);
					const t = await createRoomType(
						{
							name: r.name.trim(),
							basePrice: price,
							capacityAdults: Number.parseInt(r.guests, 10) || 2,
							capacityChildren: 0,
							facilities: [],
						},
						hotel?.hotelId,
					);
					if (!t.ok) return t;
					made.push({
						roomTypeId: t.data.id,
						name: r.name.trim(),
						price,
						count,
					});
					if (numberForMe)
						for (const number of roomNumbers(r.start, count))
							toCreate.push({
								number,
								roomTypeId: t.data.id,
								floor: floorOf(number),
							});
				}
				let created = draft.rooms?.created ?? 0;
				let skipped: string[] = [];
				if (toCreate.length > 0) {
					const bulk = await createRoomsBulk(toCreate, hotel?.hotelId);
					if (!bulk.ok) return bulk;
					created += bulk.data.created;
					skipped = bulk.data.skipped;
				}
				const step = await saveMyOnboardingStep("rooms", {
					roomTypes: made,
					created,
				});
				if (!step.ok) return step;
				try {
					localStorage.removeItem(storeKey);
				} catch {
					// ignore
				}
				const skippedSet = new Set(skipped);
				return {
					ok: true as const,
					data: {
						created:
							toCreate.length > 0 ? created - (draft.rooms?.created ?? 0) : 0,
						skipped,
						types: fresh.length,
						numbers: toCreate
							.map((t) => t.number)
							.filter((n) => !skippedSet.has(n)),
					},
				};
			},
			"Rooms saved",
			(r) => {
				setResult(r);
				setRows((rs) =>
					rs.map((row) =>
						row.roomTypeId ? row : { ...row, roomTypeId: "new" },
					),
				);
			},
		);
	}

	return (
		<StepPage
			aside={
				<>
					<SideCard title="Not sure yet?">
						<p>
							Put your usual prices. Discounts, weekend rates, promo codes and
							organization rates can all be added later in Rooms → Room types &
							prices.
						</p>
					</SideCard>
					<SideCard title="What you'll see after">
						<p>
							A room board with{" "}
							{total > 0 ? `all ${total} rooms` : "every room"}, ready for the
							first booking.
							{numberForMe
								? " Each type counts up from its first room number: 101 → 101, 102, 103 …"
								: " You add each room's number yourself in Rooms."}
						</p>
						{numberForMe &&
							rows.some(
								(r) => !r.roomTypeId && Number.parseInt(r.count, 10) > 0,
							) && (
								<ul className="flex flex-col gap-1">
									{rows
										.filter(
											(r) => !r.roomTypeId && Number.parseInt(r.count, 10) > 0,
										)
										.map((r) => {
											const nums = roomNumbers(
												r.start,
												Math.min(Number.parseInt(r.count, 10), 500),
											);
											return (
												<li key={r.key} className="flex justify-between gap-2">
													<span className="truncate">
														{r.name.trim() || "Room type"}
													</span>
													<span className="font-semibold text-ink">
														{r.start.trim() ? ranges(nums) : "first number?"}
													</span>
												</li>
											);
										})}
								</ul>
							)}
					</SideCard>
				</>
			}
		>
			<StepCard
				step="rooms"
				title={`Rooms & prices for ${hotelName}`}
				intro="Add each type of room, how many you have, and the price per night."
			>
				<div className="overflow-hidden rounded-xl border border-line">
					<div
						className={cn(
							"grid grid-cols-[1.6fr_0.7fr_0.7fr_1fr_0.9fr_36px] gap-2 border-b border-line bg-subtle/70 px-3 py-2",
							gridHead,
						)}
					>
						<span>Room type</span>
						<span>Guests</span>
						<span>How many</span>
						<span>Price / night</span>
						<span>First room no.</span>
						<span />
					</div>
					<div className="flex flex-col gap-2 p-3">
						{rows.map((r) => {
							const locked = !!r.roomTypeId;
							return (
								<div
									key={r.key}
									className="grid grid-cols-[1.6fr_0.7fr_0.7fr_1fr_0.9fr_36px] items-center gap-2"
								>
									<input
										aria-label="Room type"
										value={r.name}
										onChange={(e) => update(r.key, { name: e.target.value })}
										disabled={locked}
										placeholder="e.g. Regular"
										className={cn(inputCls, "py-2")}
									/>
									<input
										aria-label="Guests"
										value={r.guests}
										onChange={(e) =>
											update(r.key, {
												guests: e.target.value.replace(/\D/g, ""),
											})
										}
										disabled={locked}
										inputMode="numeric"
										className={cn(inputCls, "py-2")}
									/>
									<input
										aria-label="How many"
										value={r.count}
										onChange={(e) =>
											update(r.key, {
												count: e.target.value.replace(/\D/g, ""),
											})
										}
										disabled={locked}
										inputMode="numeric"
										placeholder="e.g. 20"
										className={cn(inputCls, "py-2")}
									/>
									<div className="relative">
										<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">
											₦
										</span>
										<input
											aria-label="Price per night"
											value={
												locked
													? Number(r.price).toLocaleString("en-NG")
													: r.price
											}
											onChange={(e) =>
												update(r.key, {
													price: e.target.value.replace(/[^\d.]/g, ""),
												})
											}
											disabled={locked}
											inputMode="decimal"
											placeholder="e.g. 45000"
											className={cn(inputCls, "py-2 pl-7")}
										/>
									</div>
									<input
										aria-label="First room number"
										value={r.start}
										onChange={(e) => update(r.key, { start: e.target.value })}
										disabled={locked || !numberForMe}
										placeholder="101"
										className={cn(inputCls, "py-2")}
									/>
									<button
										type="button"
										aria-label="Remove room type"
										disabled={locked || rows.length === 1}
										onClick={() => remove(r.key)}
										className="flex size-9 items-center justify-center rounded-lg text-ink-3 hover:bg-danger-soft hover:text-danger disabled:opacity-30"
									>
										<Trash2Icon className="size-4" />
									</button>
								</div>
							);
						})}
						<button
							type="button"
							onClick={() => setRows((rs) => [...rs, newRow(rs.length)])}
							className="flex w-fit items-center gap-1 px-1 py-1 text-[13px] font-semibold text-brand hover:underline"
						>
							<PlusIcon className="size-4" /> Add a room type
						</button>
					</div>
				</div>

				<div
					className={cn(
						"flex items-center gap-2 rounded-xl px-4 py-3 text-[13px]",
						total > 0
							? "bg-success-soft/60 text-success"
							: "bg-subtle text-ink-2",
					)}
				>
					{total > 0 ? (
						<CheckCircle2Icon className="size-4" />
					) : (
						<InfoIcon className="size-4" />
					)}
					<span className="flex-1 font-semibold">
						{total > 0
							? `${plural(total, "room")} across ${plural(rows.length, "type")}`
							: "Add at least one room type with how many rooms and the price"}
					</span>
					<span className="text-xs">
						{rows.some((r) => r.price)
							? `from ${naira(Math.min(...rows.map((r) => Number.parseFloat(r.price) || Number.POSITIVE_INFINITY)))} / night`
							: ""}
					</span>
				</div>
				<ToggleField
					label="Number the rooms for me"
					hint="Each type counts up from its first room number (101 → 101, 102 …). You can rename any room later."
					checked={numberForMe}
					onChange={setNumberForMe}
				/>
				{error && <Note tone="danger">{error}</Note>}
				{result && (
					<Note tone="success">
						{plural(result.types, "room type")} and{" "}
						{plural(result.created, "room")} created for {hotelName}
						{result.numbers.length > 0 && `: ${ranges(result.numbers)}`}.
						{result.skipped.length > 0 &&
							` ${result.skipped.length} already existed and were kept: ${result.skipped.slice(0, 8).join(", ")}${result.skipped.length > 8 ? "…" : ""}.`}
					</Note>
				)}
				<StepFooter
					back={stepHref("hotel")}
					label={fresh.length === 0 ? "Continue" : "Create rooms & continue"}
					pending={pending}
					onContinue={
						fresh.length === 0 ? () => router.push(stepHref("manager")) : submit
					}
					info={
						saved.length > 0
							? `${plural(saved.length, "type")} already created · add more here or in Hotel setup`
							: "Rooms are created in your hotel now"
					}
				/>
			</StepCard>
		</StepPage>
	);
}
