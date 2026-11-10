"use client";

import { KeyRoundIcon, LockIcon, TabletSmartphoneIcon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	checkDevice,
	dismissPinPrompt,
	lockDevice,
	setupDevice,
} from "@hospio/api/actions/devices";
import { setMyPin } from "@hospio/api/actions/identity";
import { type HotelRole, isHotelRole, roleLabels } from "@hospio/api/roles";
import { Button } from "@hospio/ui/primitives/button";
import { Field, SelectField, TextField } from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import { btn, input as inputCls } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Shared devices in the dashboard (docs/shared-devices.md in hospio-backend): "Use this device as a shared device" from the
 * account menu, the Lock button, the idle lock with its 30-second warning, and the prompt to set a PIN after signing in.
 */

import { DEVICE_ROLES, SHARED_DESK_ROLES } from "./shared-device-roles";

export { DEVICE_ROLES, SHARED_DESK_ROLES };

export type DeviceSetupHotel = { id: string; name: string; roles: string[] };

const label = (r: string) => (isHotelRole(r) ? roleLabels[r] : r);

/** A 4-6 digit PIN field: only digits are kept. */
function PinInput({
	label: text,
	value,
	onChange,
	error,
	autoFocus,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	error?: string;
	autoFocus?: boolean;
}) {
	return (
		<Field label={text} error={error}>
			<input
				type="password"
				inputMode="numeric"
				autoComplete="off"
				// biome-ignore lint/a11y/noAutofocus: the only field of a short prompt
				autoFocus={autoFocus}
				maxLength={6}
				value={value}
				onChange={(e) =>
					onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
				}
				className={cn(
					inputCls,
					"text-center text-lg tracking-[0.5em]",
					error && "border-danger",
				)}
				aria-label={text}
			/>
		</Field>
	);
}

/** The new PIN twice, checked on the device before the server applies the rest of the rules. */
function usePinPair() {
	const [next, setNext] = useState("");
	const [again, setAgain] = useState("");
	const [error, setError] = useState<string | undefined>();
	const check = () => {
		if (!/^\d{4,6}$/.test(next)) return "A PIN is 4 to 6 digits";
		if (next !== again) return "The two PINs don't match";
		return undefined;
	};
	return {
		next,
		setNext,
		again,
		setAgain,
		error,
		setError,
		check,
		reset: () => {
			setNext("");
			setAgain("");
			setError(undefined);
		},
	};
}

/** Account menu → "Use this device as a shared device": name, hotel, roles and auto-lock; then the lock screen opens. */
export function SetupDeviceModal({
	open,
	onOpenChange,
	hotels,
	activeHotelId,
	activeRole,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	hotels: DeviceSetupHotel[];
	activeHotelId?: string;
	activeRole?: string;
}) {
	const first = hotels.find((h) => h.id === activeHotelId) ?? hotels[0];
	const [name, setName] = useState("");
	const [hotelId, setHotelId] = useState(first?.id ?? "");
	const allowed = hotels.find((h) => h.id === hotelId)?.roles ?? [];
	const [roles, setRoles] = useState<string[]>(
		activeRole && first?.roles.includes(activeRole) ? [activeRole] : [],
	);
	const [minutes, setMinutes] = useState("5");
	const [error, setError] = useState<string | undefined>();
	const [pending, start] = useTransition();

	const submit = () => {
		setError(undefined);
		if (name.trim().length < 2)
			return setError("Name the device, for example Bar tablet");
		const picked = roles.filter((r) => allowed.includes(r));
		if (picked.length === 0)
			return setError("Pick at least one role for the device");
		start(async () => {
			const result = await setupDevice({
				name: name.trim(),
				hotelId,
				roles: picked,
				autoLockMinutes: Number(minutes),
			});
			if (!result.ok) return setError(result.error);
			toast.success(`${result.data.name} is a shared device`, {
				description: "Staff unlock it with their PIN.",
			});
			window.location.assign("/lock");
		});
	};

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Use this device as a shared device"
			subtitle="Staff switch in with their PIN. You are signed out here when it's set up"
			icon={TabletSmartphoneIcon}
			size="form"
			footer={
				<>
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button className={btn.primary} disabled={pending} onClick={submit}>
						Set up device
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Device name"
					value={name}
					onChange={setName}
					placeholder="Bar tablet"
					hint="What staff and managers see"
				/>
				{hotels.length > 1 && (
					<SelectField
						label="Hotel"
						value={hotelId}
						onChange={(v) => {
							setHotelId(v);
							setRoles([]);
						}}
						options={hotels.map((h) => ({ value: h.id, label: h.name }))}
					/>
				)}
				<Field
					label="Who uses it"
					hint="People with one of these roles at the hotel can unlock it"
				>
					<div className="flex flex-wrap gap-2">
						{allowed.map((r) => {
							const on = roles.includes(r);
							return (
								<button
									key={r}
									type="button"
									aria-pressed={on}
									onClick={() =>
										setRoles((all) =>
											on ? all.filter((x) => x !== r) : [...all, r],
										)
									}
									className={cn(
										"min-h-11 rounded-control border px-4 text-[13px] font-semibold transition-colors",
										on
											? "border-brand bg-brand-soft text-brand"
											: "border-line bg-card text-ink-2 hover:bg-subtle",
									)}
								>
									{label(r)}
								</button>
							);
						})}
					</div>
				</Field>
				<SelectField
					label="Lock after"
					value={minutes}
					onChange={setMinutes}
					options={["1", "2", "5", "10", "15", "30", "60"].map((m) => ({
						value: m,
						label: `${m} ${m === "1" ? "minute" : "minutes"} without use`,
					}))}
					hint="Locking ends the person's session on this device"
				/>
				{error && (
					<p className="rounded-[10px] bg-danger-soft px-4 py-3 text-[13px] text-danger">
						{error}
					</p>
				)}
			</div>
		</Modal>
	);
}

/** The header's "Lock" on a shared device: this person's session here ends and the lock screen opens. */
export function LockButton({ deviceName }: { deviceName: string }) {
	const [pending, start] = useTransition();
	return (
		<button
			type="button"
			disabled={pending}
			onClick={() =>
				start(async () => {
					await lockDevice("button");
					window.location.assign("/lock");
				})
			}
			className="flex h-[42px] items-center gap-2 rounded-xl border border-line bg-card px-3 text-[13px] font-semibold text-ink hover:bg-subtle disabled:opacity-60"
			title={`Lock ${deviceName} so the next person can switch in`}
		>
			<LockIcon className="size-4" />
			<span className="hidden sm:inline">Lock · Switch person</span>
			<span className="sm:hidden">Lock</span>
		</button>
	);
}

/**
 * Locks the device after `minutes` without a tap, key or scroll, with a warning toast 30 seconds before. Also asks every
 * minute whether the device was removed in Hotel setup; then it goes to the normal sign-in page.
 */
export function IdleLock({ minutes }: { minutes: number }) {
	const last = useRef(Date.now());
	const warned = useRef(false);
	const locking = useRef(false);
	useEffect(() => {
		const limit = Math.max(1, minutes) * 60_000;
		const activity = () => {
			last.current = Date.now();
			if (warned.current) {
				warned.current = false;
				toast.dismiss("idle-lock");
			}
		};
		const events = [
			"pointerdown",
			"keydown",
			"touchstart",
			"wheel",
			"scroll",
		] as const;
		for (const e of events)
			window.addEventListener(e, activity, { passive: true, capture: true });
		const tick = window.setInterval(() => {
			if (locking.current) return;
			const left = limit - (Date.now() - last.current);
			if (left <= 0) {
				locking.current = true;
				toast.dismiss("idle-lock");
				void lockDevice("idle").finally(() =>
					window.location.assign("/lock?reason=idle"),
				);
			} else if (left <= 30_000 && !warned.current) {
				warned.current = true;
				toast.warning("Locking in 30 seconds", {
					id: "idle-lock",
					description:
						"Tap anywhere to stay signed in. Unsaved changes are lost when it locks.",
					duration: 35_000,
				});
			}
		}, 1000);
		const poll = window.setInterval(() => {
			void checkDevice()
				.then((r) => {
					if (r.removed) window.location.assign("/auth?reason=device-removed");
				})
				.catch(() => undefined);
		}, 60_000);
		return () => {
			for (const e of events)
				window.removeEventListener(e, activity, { capture: true });
			window.clearInterval(tick);
			window.clearInterval(poll);
		};
	}, [minutes]);
	return null;
}

/**
 * After a normal sign-in on a shared device (or a first sign-in on a shared desk) with no PIN: set one now, no second password,
 * or "Not now", which comes back at the next sign-in on a shared device.
 */
export function PinPrompt({ onDevice }: { onDevice: boolean }) {
	const [open, setOpen] = useState(true);
	const pin = usePinPair();
	const [pending, start] = useTransition();
	const later = () =>
		start(async () => {
			await dismissPinPrompt();
			setOpen(false);
		});
	const save = () => {
		const problem = pin.check();
		if (problem) return pin.setError(problem);
		start(async () => {
			const result = await setMyPin(pin.next);
			if (!result.ok) return pin.setError(result.error);
			toast.success("PIN set", {
				description: onDevice
					? "Tap your name on the lock screen next time."
					: "Use it to switch in on the hotel's shared tablets.",
			});
			setOpen(false);
		});
	};
	return (
		<Modal
			open={open}
			onOpenChange={(o) => {
				if (!o) later();
			}}
			title={
				onDevice
					? "Set a PIN so you can switch in quickly on this device"
					: "Set a PIN for the shared tablets"
			}
			subtitle="4 to 6 digits. Not 1111, 1234 or the end of your phone number"
			icon={KeyRoundIcon}
			size="form"
			footer={
				<>
					<Button
						variant="outline"
						className={btn.secondary}
						disabled={pending}
						onClick={later}
					>
						Not now
					</Button>
					<Button className={btn.primary} disabled={pending} onClick={save}>
						Set PIN
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<PinInput
					label="New PIN"
					value={pin.next}
					onChange={pin.setNext}
					autoFocus
				/>
				<PinInput
					label="New PIN again"
					value={pin.again}
					onChange={pin.setAgain}
					error={pin.error}
				/>
				<p className="text-xs text-ink-3">
					Your PIN only works on shared devices at your hotel. Managers can
					reset it, never see it.
				</p>
			</div>
		</Modal>
	);
}

/** Profile → Security: set or change one's PIN; always with the password here. */
export function PinSection({ hasPin }: { hasPin: boolean }) {
	const [open, setOpen] = useState(false);
	const [set, setSet] = useState(hasPin);
	const pin = usePinPair();
	const [password, setPassword] = useState("");
	const [pending, start] = useTransition();
	const save = () => {
		const problem = pin.check();
		if (problem) return pin.setError(problem);
		if (!password) return pin.setError("Enter your password");
		start(async () => {
			const result = await setMyPin(pin.next, password);
			if (!result.ok) return pin.setError(result.error);
			toast.success(set ? "PIN changed" : "PIN set");
			setSet(true);
			setOpen(false);
			pin.reset();
			setPassword("");
		});
	};
	return (
		<>
			<p className="text-[13px] text-ink-2">
				{set ? "Your PIN is set. " : "No PIN yet. "}Use it to switch in on the
				hotel's shared tablets. 4 to 6 digits; your manager can reset it but
				never sees it.
			</p>
			<Button
				variant="outline"
				className={`${btn.secondary} w-fit`}
				onClick={() => setOpen(true)}
			>
				<KeyRoundIcon className="size-4" /> {set ? "Change PIN" : "Set PIN"}
			</Button>
			<Modal
				open={open}
				onOpenChange={setOpen}
				title={set ? "Change your PIN" : "Set your PIN"}
				subtitle="Not 1111, 1234, your old PIN or the end of your phone number"
				icon={KeyRoundIcon}
				size="form"
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button className={btn.primary} disabled={pending} onClick={save}>
							{set ? "Change PIN" : "Set PIN"}
						</Button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<PinInput label="New PIN" value={pin.next} onChange={pin.setNext} />
					<PinInput
						label="New PIN again"
						value={pin.again}
						onChange={pin.setAgain}
					/>
					<TextField
						label="Your password"
						type="password"
						value={password}
						onChange={setPassword}
						error={pin.error}
					/>
				</div>
			</Modal>
		</>
	);
}
