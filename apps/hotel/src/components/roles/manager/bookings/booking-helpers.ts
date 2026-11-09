import { format } from "date-fns";
import type { PillTone } from "@hospio/ui/shared/status-pill";
import type {
	BookingRow,
	PaymentPlan,
	PriceKind,
} from "@hospio/api/data/types";

// The local (Lagos) calendar date, not UTC.
export const today = () => format(new Date(), "yyyy-MM-dd");

export function bookingStatus(b: BookingRow): {
	label: string;
	tone: PillTone;
} {
	const t = today();
	switch (b.status) {
		case "CHECKED_IN":
			return b.checkOutDate === t
				? { label: "Due out today", tone: "warning" }
				: b.checkOutDate < t
					? { label: "Overstay", tone: "danger" }
					: { label: "Checked in", tone: "success" };
		case "CHECKED_OUT":
			return { label: "Checked out", tone: "grey" };
		case "CANCELLED":
			return { label: "Cancelled", tone: "grey" };
		case "NO_SHOW":
			return { label: "No-show", tone: "danger" };
		default:
			return b.checkInDate === t
				? { label: `Arriving ${b.eta ?? "today"}`, tone: "info" }
				: b.checkInDate < t
					? { label: "Missed arrival", tone: "danger" }
					: { label: "Reserved", tone: "info" };
	}
}

export function paymentStatus(b: BookingRow): {
	label: string;
	tone: PillTone;
} {
	if (b.priceKind === "COMPLIMENTARY")
		return { label: "Complimentary", tone: "brand" };
	if (b.paymentPlan === "ORGANIZATION")
		return { label: "On account", tone: "info" };
	const due = b.totalAmount - b.paid;
	if (due <= 0) return { label: "Paid", tone: "success" };
	if (b.paid > 0) return { label: "Part-paid", tone: "warning" };
	return { label: "Unpaid", tone: "danger" };
}

export const planLabels: Record<PaymentPlan, string> = {
	PAY_IN_FULL: "Pay in full",
	DEPOSIT_50: "50% deposit",
	PAY_AT_CHECKOUT: "Pay at check-out",
	ORGANIZATION: "Organization account",
};
export const priceKindLabels: Record<PriceKind, string> = {
	NORMAL: "Normal price",
	SPECIAL: "Special price",
	COMPLIMENTARY: "Complimentary",
};

export const balance = (b: BookingRow) => Math.max(0, b.totalAmount - b.paid);

/** Whether an action from the URL (?action=) still applies to the booking: a stale link must not open check-in on a stay that is in house or cancelled. */
export function actionAllowed(b: BookingRow, action: string | null): boolean {
	switch (action) {
		case null:
			return false;
		case "check-in":
			return b.status === "BOOKED";
		case "check-out":
			return b.status === "CHECKED_IN";
		case "dates":
			return b.status === "BOOKED" || b.status === "CHECKED_IN";
		case "cancel":
			return b.status === "BOOKED";
		case "payment":
			return b.status !== "CANCELLED" && b.status !== "NO_SHOW";
		default:
			return true;
	}
}
