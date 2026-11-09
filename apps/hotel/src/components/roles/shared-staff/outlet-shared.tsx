"use client";

import { useEffect, useState } from "react";
import { TextareaField } from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import type { OrderLineInput } from "@hospio/api/actions/fnb";
import type {
	HappyHourRow,
	OrderRow,
	OutletSettingsRow,
} from "@hospio/api/data/types";
import type { CartLine } from "./menu-picker";
import { unitPrice } from "./menu-picker";
import { BigButton } from "./tablet";

/** Pieces the kitchen and bar screens share: the order rows, cart to order lines, tax, a reason box. */

/**
 * The orders a screen shows. They follow the server's rows whenever those change (after a save the page
 * is refreshed); `apply` puts an answered order in place, or, when the action answered nothing (demo),
 * patches the row locally so the demo behaves the same.
 */
export function useOrderRows(initial: OrderRow[]) {
	const [rows, setRows] = useState(initial);
	// The server's rows win; an order this screen already holds that the refreshed board no longer has (it was
	// just paid, charged to a room or cancelled, so it left the open board) is kept, so the Sale done panel
	// and Recent sales still have it.
	useEffect(
		() =>
			setRows((prev) => [
				...initial,
				...prev.filter((p) => !initial.some((i) => i.id === p.id)),
			]),
		[initial],
	);
	const put = (o: OrderRow) =>
		setRows((r) =>
			r.some((x) => x.id === o.id)
				? r.map((x) => (x.id === o.id ? o : x))
				: [o, ...r],
		);
	const apply = (
		id: string,
		answered: OrderRow | null | undefined,
		patch: (o: OrderRow) => OrderRow,
	) => {
		if (answered) put(answered);
		else setRows((r) => r.map((x) => (x.id === id ? patch(x) : x)));
	};
	return { rows, setRows, put, apply };
}

export const liveLines = (o: OrderRow) =>
	o.lines.filter((l) => l.status !== "CANCELLED");

export function toLineInputs(
	lines: CartLine[],
	discountPct = 0,
): OrderLineInput[] {
	return lines.map((l) => ({
		menuItemId: l.item.id,
		name: l.item.name,
		price: unitPrice(l, discountPct),
		quantity: l.qty,
		options: l.option,
		notes: l.note,
	}));
}

/** What the guest pays for a cart before the server has priced it: tax inside the prices, or added on top. */
export function estimate(
	subtotal: number,
	s: Pick<OutletSettingsRow, "vatPct" | "pricesIncludeTax">,
) {
	const included = s.pricesIncludeTax;
	const tax = included
		? Math.round((subtotal * s.vatPct) / (100 + s.vatPct))
		: Math.round((subtotal * s.vatPct) / 100);
	return { tax, total: included ? subtotal : subtotal + tax };
}

export const lineTone = (
	status: string,
): "success" | "info" | "grey" | "danger" =>
	status === "READY" || status === "SERVED"
		? "success"
		: status === "SENT"
			? "info"
			: status === "CANCELLED"
				? "danger"
				: "grey";
export const lineLabel = (status: string) =>
	status === "SENT"
		? "cooking"
		: status === "NEW"
			? "new"
			: status.toLowerCase();

/** The room label for a booking: "A207 · Emeka Nwosu". */
export const roomLabel = (b: { roomNumber?: string; guestName: string }) =>
	`${b.roomNumber ?? "—"} · ${b.guestName}`;

/** Asks for a reason before something is cancelled; the reason is kept with the order. */
export function ReasonModal({
	open,
	onOpenChange,
	title,
	subtitle,
	confirmLabel,
	pending,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	title: string;
	subtitle?: string;
	confirmLabel: string;
	pending?: boolean;
	onConfirm: (reason: string) => void;
}) {
	const [reason, setReason] = useState("");
	useEffect(() => {
		if (open) setReason("");
	}, [open]);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			subtitle={subtitle}
			size="confirm"
			tone="danger"
			footer={
				<>
					<BigButton tone="secondary" onClick={() => onOpenChange(false)}>
						Keep it
					</BigButton>
					<BigButton
						tone="danger"
						pending={pending}
						disabled={!reason.trim()}
						onClick={() => onConfirm(reason.trim())}
					>
						{confirmLabel}
					</BigButton>
				</>
			}
		>
			<TextareaField
				label="Reason"
				value={reason}
				onChange={setReason}
				placeholder="e.g. guest changed their mind, kitchen ran out"
				rows={2}
			/>
		</Modal>
	);
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** The happy hour running now in Lagos, if any (the service applies the same rule to each line it adds). */
export function activeHappyHour(
	list: HappyHourRow[],
	now: Date = new Date(),
): HappyHourRow | null {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Africa/Lagos",
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(now);
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
	const day = get("weekday").slice(0, 3).toUpperCase();
	const time = `${get("hour").replace("24", "00")}:${get("minute")}`;
	return (
		list.find(
			(h) =>
				h.active &&
				h.days
					.toUpperCase()
					.split(",")
					.map((d) => d.trim())
					.includes(DAYS.includes(day) ? day : "") &&
				(h.from <= h.to
					? time >= h.from && time < h.to
					: time >= h.from || time < h.to),
		) ?? null
	);
}

/** "Mon – Fri", "Every day" or the day list, for a happy hour's days. */
export function daysLabel(days: string) {
	const set = days
		.toUpperCase()
		.split(",")
		.map((d) => d.trim())
		.filter(Boolean);
	const names = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
	if (set.length === 7) return "Every day";
	const idx = names
		.map((n, i) => (set.includes(n) ? i : -1))
		.filter((i) => i >= 0);
	const run =
		idx.length > 1 && idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
	const cap = (n: string) => n.charAt(0) + n.slice(1).toLowerCase();
	return run
		? `${cap(names[idx[0]])} – ${cap(names[idx[idx.length - 1]])}`
		: set.map(cap).join(", ");
}

/** A tab or order sits at a table when it names it; used for the seats grid and for moving a tab. */
export const sitsAt = (o: OrderRow, t: { id: string; number: string }) =>
	o.tableId === t.id || (!o.tableId && o.tableNo === t.number);
