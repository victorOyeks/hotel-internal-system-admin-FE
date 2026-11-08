import type { PillTone } from "@hospio/ui/shared/status-pill";
import type { BookingRow, PaymentPlan, PriceKind } from "@hospio/api/data/types";

export const today = () => new Date().toISOString().slice(0, 10);

export function bookingStatus(b: BookingRow): { label: string; tone: PillTone } {
	const t = today();
	switch (b.status) {
		case "CHECKED_IN":
			return b.checkOutDate === t ? { label: "Due out today", tone: "warning" } : b.checkOutDate < t ? { label: "Overstay", tone: "danger" } : { label: "Checked in", tone: "success" };
		case "CHECKED_OUT":
			return { label: "Checked out", tone: "grey" };
		case "CANCELLED":
			return { label: "Cancelled", tone: "grey" };
		case "NO_SHOW":
			return { label: "No-show", tone: "danger" };
		default:
			return b.checkInDate === t ? { label: `Arriving ${b.eta ?? "today"}`, tone: "info" } : b.checkInDate < t ? { label: "Missed arrival", tone: "danger" } : { label: "Reserved", tone: "info" };
	}
}

export function paymentStatus(b: BookingRow): { label: string; tone: PillTone } {
	if (b.priceKind === "COMPLIMENTARY") return { label: "Complimentary", tone: "brand" };
	if (b.paymentPlan === "ORGANIZATION") return { label: "On account", tone: "info" };
	const due = b.totalAmount - b.paid;
	if (due <= 0) return { label: "Paid", tone: "success" };
	if (b.paid > 0) return { label: "Part-paid", tone: "warning" };
	return { label: "Unpaid", tone: "danger" };
}

export const planLabels: Record<PaymentPlan, string> = { PAY_IN_FULL: "Pay in full", DEPOSIT_50: "50% deposit", PAY_AT_CHECKOUT: "Pay at check-out", ORGANIZATION: "Organization account" };
export const priceKindLabels: Record<PriceKind, string> = { NORMAL: "Normal price", SPECIAL: "Special price", COMPLIMENTARY: "Complimentary" };

export const balance = (b: BookingRow) => Math.max(0, b.totalAmount - b.paid);
