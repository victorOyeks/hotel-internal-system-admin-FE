"use client";

import { CheckCircle2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
}: {
	draft: OwnerOnboardingData;
	business?: Business | null;
	user?: Me | null;
}) {
	const router = useRouter();
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
	const [result, setResult] = useState<{
		created: number;
		skipped: string[];
		types: number;
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

	function submit() {
		setError(null);
		for (const r of fresh) {
			if (!r.name.trim()) return setError("Every room type needs a name");
			if (!(Number.parseFloat(r.price) > 0))
				return setError(
					`Enter a price per night for ${r.name.trim() || "each type"}`,
				);
			if (!(Number.parseInt(r.count, 10) > 0))
				return setError(`How many ${r.name.trim() || ""} rooms are there?`);
			if (numberForMe && !r.start.trim())
				return setError(`Enter the first room number for ${r.name.trim()}`);
		}
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
				return {
					ok: true as const,
					data: {
						created:
							toCreate.length > 0 ? created - (draft.rooms?.created ?? 0) : 0,
						skipped,
						types: fresh.length,
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
							first booking. Numbers follow the first room you give each type:
							A101 → A101, A102, …
						</p>
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
										placeholder="Regular"
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
										placeholder="46"
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
											placeholder="46,000"
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

				<div className="flex items-center gap-2 rounded-xl bg-success-soft/60 px-4 py-3 text-[13px] text-success">
					<CheckCircle2Icon className="size-4" />
					<span className="flex-1 font-semibold">
						{total > 0
							? `${plural(total, "room")} across ${plural(rows.length, "type")}`
							: "Add at least one room type"}
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
						{plural(result.created, "room")} created for {hotelName}.
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
