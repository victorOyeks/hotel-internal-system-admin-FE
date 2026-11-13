"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Note } from "@hospio/ui/shared/detail-list";
import { useHotelActions } from "@hospio/api/actions/hotel-scope";
import type {
	BookingRow,
	FolioSummary,
	RoomRow,
	TerminalRow,
} from "@hospio/api/data/types";
import { type TakenPayment, usePaymentSteps } from "./take-payment";

/** What a guest still owes before the key: nothing on a company account, pay-at-check-out or complimentary stays; otherwise the whole balance. */
export function dueAtCheckIn(
	b: Pick<BookingRow, "paymentPlan" | "priceKind" | "totalAmount" | "paid">,
): number {
	if (
		b.paymentPlan === "PAY_AT_CHECKOUT" ||
		b.paymentPlan === "ORGANIZATION" ||
		b.priceKind === "COMPLIMENTARY"
	)
		return 0;
	return Math.max(0, b.totalAmount - b.paid);
}

export type WalkIn = { room: RoomRow; idSeen: boolean };
type CheckInState = "idle" | "running" | "ok" | "failed";

/**
 * The part of New booking after the form is saved, shared by the front office and manager panels.
 * One panel the whole way: the form saves, then the same panel shows the payment steps (when money is
 * due), then, for a walk-in, makes the check-in call, and finishes on the booking summary.
 */
export function useSaveFlow({
	terminals,
	folios,
	onCreated,
	onPaid,
	onCheckedIn,
	onFinish,
	onClose,
}: {
	terminals: TerminalRow[];
	folios: FolioSummary[];
	onCreated: (b: BookingRow) => void;
	onPaid: (bookingId: string, payment: TakenPayment) => void;
	onCheckedIn: (bookingId: string, changes: Partial<BookingRow>) => void;
	/** The booking is saved and the flow is over: close the panel and open the booking summary. */
	onFinish: (bookingId: string) => void;
	/** Closed before anything was saved. */
	onClose: () => void;
}) {
	const { checkIn } = useHotelActions();
	const [phase, setPhase] = useState<"form" | "pay">("form");
	const [saved, setSaved] = useState<BookingRow | null>(null);
	const [walk, setWalk] = useState<WalkIn | null>(null);
	const [ci, setCi] = useState<CheckInState>("idle");
	const [heldForPos, setHeldForPos] = useState(false);
	const [busy, setBusy] = useState(false);

	async function doCheckIn(b: BookingRow, w: WalkIn): Promise<boolean> {
		setCi("running");
		try {
			const r = await checkIn(
				b,
				{ roomId: w.room.id, withoutPayment: false, idChecked: w.idSeen },
				{
					status: "CHECKED_IN",
					checkedInAt: new Date().toISOString(),
					roomNumber: w.room.number,
					roomId: w.room.id,
					paid: b.paid,
				},
			);
			if (!r.ok) {
				toast.error(r.error, { duration: 8000 });
				setCi("failed");
				return false;
			}
			onCheckedIn(b.id, r.data);
			setCi("ok");
			toast.success(`${b.guestName} checked in to ${w.room.number}`);
			return true;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Check-in failed", {
				duration: 8000,
			});
			setCi("failed");
			return false;
		}
	}

	const finish = () => (saved ? onFinish(saved.id) : onClose());

	const pay = usePaymentSteps(
		{
			terminals,
			folios,
			onDone: (p) => {
				if (!saved) return;
				onPaid(saved.id, p);
				if (!walk) return;
				if (p.status === "APPROVED")
					void doCheckIn({ ...saved, paid: saved.paid + p.amount }, walk);
				else setHeldForPos(true);
			},
			onFinish: finish,
			onBack: finish,
			doneLabel: "Open booking",
			doneBusy: ci === "running",
			doneExtra: walk ? (
				ci === "ok" ? (
					<Note tone="success">
						Checked in to {walk.room.number}. The booking summary shows the stay
						as in house.
					</Note>
				) : ci === "failed" ? (
					<Note tone="warning">
						The payment is taken, but the check-in did not go through. Open the
						booking and check the guest in from there.
					</Note>
				) : heldForPos ? (
					<Note tone="info">
						The payment is still with the POS. Check the guest in from the
						booking once it is confirmed.
					</Note>
				) : (
					<Note tone="info">Checking the guest in…</Note>
				)
			) : undefined,
		},
		false,
	);

	/** The booking was just saved: move on to the payment steps, the check-in, or the summary. */
	async function start(b: BookingRow, o: { take: number; walkIn?: WalkIn }) {
		onCreated(b);
		setSaved(b);
		setWalk(o.walkIn ?? null);
		setCi("idle");
		setHeldForPos(false);
		if (o.take > 0) {
			setPhase("pay");
			pay.begin({
				guestName: b.guestName,
				roomNumber: o.walkIn?.room.number ?? b.roomNumber,
				bookingId: b.id,
				guestPhone: b.guestPhone,
				guestEmail: b.guestEmail,
				amountDue: o.take,
				description: o.walkIn
					? `Check-in · ${b.reference}`
					: `${b.paymentPlan === "DEPOSIT_50" ? "Deposit" : "Payment"} · ${b.reference}`,
			});
			return;
		}
		if (o.walkIn) {
			setBusy(true);
			await doCheckIn(b, o.walkIn);
			setBusy(false);
		}
		onFinish(b.id);
	}

	const reset = useCallback(() => {
		setPhase("form");
		setSaved(null);
		setWalk(null);
		setCi("idle");
		setHeldForPos(false);
		setBusy(false);
	}, []);

	return { phase, view: pay.view, busy, start, reset, close: finish };
}
