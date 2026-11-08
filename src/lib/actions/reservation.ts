"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions";
import { api, errorMessage } from "@/lib/api/client";
import { withSession } from "@/lib/api/server";
import { live } from "@/lib/data/live";
import { toBookingRow, toGuestRow } from "@/lib/data/mappers/reservation";
import type { BookingRow, GuestRow, PaymentMethod, PaymentPlan, PriceKind } from "@/lib/data/types";
import { demoDelay } from "@/lib/demo/mode";
import { recordPayment } from "./payment";

const BOOKING_PATHS = ["/manager", "/manager/bookings", "/manager/folios", "/manager/rooms", "/front-desk", "/front-desk/bookings", "/front-desk/rooms", "/front-desk/folios", "/hotel-owner/bookings"];
function revalidateBookings() {
	for (const p of BOOKING_PATHS) revalidatePath(p);
}

const guestMap = (g?: GuestRow) => new Map(g ? [[g.id, g]] : []);

export type CreateBookingInput = {
	guestId?: string;
	guest?: { fullName: string; phone: string; email?: string };
	roomTypeId: string;
	checkInDate: string;
	checkOutDate: string;
	adults: number;
	children: number;
	priceKind: PriceKind;
	specialRate?: number;
	paymentPlan: PaymentPlan;
	organizationId?: string;
	source?: string;
	notes?: string;
};

/** New booking (reservation-service). The guest is created in the same call when not an existing one. */
export async function createBooking(input: CreateBookingInput, fallback: BookingRow): Promise<ActionResult<BookingRow>> {
	if (!live("reservation")) {
		await demoDelay(500);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api("@post/reservation/bookings", {
		...(await withSession()),
		body: {
			guestId: input.guestId ?? null,
			guest: input.guest ? { fullName: input.guest.fullName, phone: input.guest.phone, email: input.guest.email ?? null } : null,
			roomTypeId: input.roomTypeId,
			checkInDate: input.checkInDate,
			checkOutDate: input.checkOutDate,
			adults: input.adults,
			children: input.children,
			priceKind: input.priceKind,
			specialRate: input.specialRate ?? null,
			paymentPlan: input.paymentPlan,
			organizationId: input.organizationId ?? null,
			source: input.source ?? "Front desk",
			notes: input.notes ?? null,
		},
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The booking could not be saved") };
	revalidateBookings();
	const row = toBookingRow(data.data, new Map(), new Map());
	return { ok: true, data: { ...row, guestPhone: row.guestPhone || input.guest?.phone || fallback.guestPhone, guestEmail: row.guestEmail ?? input.guest?.email ?? fallback.guestEmail, organizationName: fallback.organizationName, eta: fallback.eta } };
}

export type CheckInInput = {
	roomId?: string;
	withoutPayment?: boolean;
	idChecked?: boolean;
	collect?: { method: PaymentMethod; amount: number };
};

/** Check in: assigns the room, opens the folio; optionally records the payment collected at the desk. */
export async function checkIn(b: BookingRow, input: CheckInInput, fallback: Partial<BookingRow>): Promise<ActionResult<Partial<BookingRow>>> {
	if (!live("reservation")) {
		await demoDelay(500);
		return { ok: true, data: fallback };
	}
	const s = await withSession();
	const { data, error } = await api("@post/reservation/bookings/:id/check-in", {
		...s,
		params: { id: b.id },
		body: { roomId: input.roomId ?? null, guestPhone: b.guestPhone || null, guestEmail: b.guestEmail ?? null, withoutPayment: input.withoutPayment ?? false, idType: input.idChecked ? "SEEN" : null },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "Check-in failed") };
	let paid = b.paid;
	if (input.collect && input.collect.amount > 0) {
		const payment = await recordPayment({ method: input.collect.method, amount: input.collect.amount, bookingId: b.id, guestName: b.guestName, guestPhone: b.guestPhone, guestEmail: b.guestEmail, description: `Room charges · ${b.reference}` });
		if (!payment.ok) return { ok: false, error: `Checked in, but the payment failed: ${payment.error}` };
		if (payment.data.status === "APPROVED") paid += input.collect.amount;
	}
	revalidateBookings();
	const row = toBookingRow(data.data, guestMap(), new Map());
	return { ok: true, data: { status: row.status, roomId: row.roomId, roomNumber: row.roomNumber, checkedInAt: row.checkedInAt, paid } };
}

export type CheckOutInput = {
	folioBalance: number;
	allowPendingPayment?: boolean;
	summaryChannels?: string[];
	collect?: { method: PaymentMethod; amount: number; folioId?: string };
	lateCheckoutFee?: number;
};

/** Check out: settles the balance first when the desk collects it, then closes the stay. */
export async function checkOut(b: BookingRow, input: CheckOutInput, fallback: Partial<BookingRow>): Promise<ActionResult<Partial<BookingRow>>> {
	if (!live("reservation")) {
		await demoDelay(500);
		return { ok: true, data: fallback };
	}
	const s = await withSession();
	let paid = b.paid;
	let balance = input.folioBalance;
	if (input.collect && input.collect.amount > 0) {
		const payment = await recordPayment({ method: input.collect.method, amount: input.collect.amount, bookingId: b.id, folioId: input.collect.folioId, guestName: b.guestName, guestPhone: b.guestPhone, guestEmail: b.guestEmail, description: `Balance at check-out · ${b.reference}` });
		if (!payment.ok) return { ok: false, error: payment.error };
		if (payment.data.status === "APPROVED") {
			paid += input.collect.amount;
			balance = Math.max(0, balance - input.collect.amount);
		}
	}
	const { data, error } = await api("@post/reservation/bookings/:id/check-out", {
		...s,
		params: { id: b.id },
		body: { folioBalance: balance, allowPendingPayment: input.allowPendingPayment ?? balance > 0, summaryChannels: input.summaryChannels ?? (b.guestEmail ? ["WHATSAPP", "EMAIL"] : ["WHATSAPP"]) },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "Check-out failed") };
	revalidateBookings();
	const row = toBookingRow(data.data, guestMap(), new Map());
	return { ok: true, data: { status: row.status, checkedOutAt: row.checkedOutAt, paid } };
}

export async function changeBookingDates(b: BookingRow, checkInDate: string, checkOutDate: string, fallback: Partial<BookingRow>): Promise<ActionResult<Partial<BookingRow>>> {
	if (!live("reservation")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api("@put/reservation/bookings/:id", { ...(await withSession()), params: { id: b.id }, body: { checkInDate, checkOutDate, reason: "Dates changed at the desk" } });
	if (error || !data) return { ok: false, error: errorMessage(error, "The dates could not be changed") };
	revalidateBookings();
	const row = toBookingRow(data.data, guestMap(), new Map());
	return { ok: true, data: { checkInDate: row.checkInDate, checkOutDate: row.checkOutDate, nights: row.nights, totalAmount: row.totalAmount, nightlyRate: row.nightlyRate, roomId: row.roomId, roomNumber: row.roomNumber } };
}

export async function cancelBooking(b: BookingRow, reason: string, refundable: boolean, fallback: Partial<BookingRow>): Promise<ActionResult<Partial<BookingRow>>> {
	if (!live("reservation")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api("@post/reservation/bookings/:id/cancel", { ...(await withSession()), params: { id: b.id }, body: { reason, refundable } });
	if (error || !data) return { ok: false, error: errorMessage(error, "The booking could not be cancelled") };
	revalidateBookings();
	const row = toBookingRow(data.data, guestMap(), new Map());
	return { ok: true, data: { status: row.status, cancelReason: row.cancelReason ?? reason, roomId: undefined, roomNumber: undefined } };
}

export async function searchGuests(q: string): Promise<GuestRow[]> {
	if (!live("reservation")) return [];
	const { data } = await api("@get/reservation/guests", { ...(await withSession()), query: { q } });
	return (data?.data ?? []).map(toGuestRow);
}
