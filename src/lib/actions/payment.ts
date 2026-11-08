"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions";
import { api, errorMessage } from "@/lib/api/client";
import { withSession } from "@/lib/api/server";
import { live } from "@/lib/data/live";
import type { PaymentMethod, PaymentStatus } from "@/lib/data/types";
import { demoDelay } from "@/lib/demo/mode";

export type RecordPaymentInput = {
	method: PaymentMethod;
	amount: number;
	bookingId?: string;
	folioId?: string;
	guestName: string;
	guestPhone?: string;
	guestEmail?: string;
	description?: string;
	receipt?: "WHATSAPP" | "EMAIL" | "NONE";
};

export type RecordedPayment = { id: string; status: PaymentStatus; amount: number; method: PaymentMethod };

/**
 * Take a payment (payment-service). Cash is approved on the spot; card and transfer go to the role's
 * POS and come back as PROCESSING until the provider confirms. Given a booking without a folio id, the
 * stay's folio is looked up so the payment lands on it.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<ActionResult<RecordedPayment>> {
	if (!live("payment")) {
		await demoDelay(500);
		return { ok: true, data: { id: `pay-${Date.now()}`, status: input.method === "CASH" ? "APPROVED" : "PROCESSING", amount: input.amount, method: input.method } };
	}
	const s = await withSession();
	let folioId = input.folioId;
	if (!folioId && input.bookingId && live("folio")) {
		const folio = await api("@get/folio/folios/by-booking/:bookingId", { ...s, params: { bookingId: input.bookingId } }).catch(() => null);
		folioId = folio?.data?.data.id;
	}
	const { data, error } = await api("@post/payment/payments", {
		...s,
		body: {
			method: input.method,
			amount: input.amount,
			folioId: folioId ?? null,
			bookingId: input.bookingId ?? null,
			guestName: input.guestName,
			guestPhone: input.guestPhone ?? null,
			guestEmail: input.guestEmail ?? null,
			description: input.description ?? "Room charges",
			receiptPreference: input.receipt ?? "WHATSAPP",
		},
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The payment could not be recorded") };
	for (const p of ["/manager/bookings", "/manager/folios", "/manager/payments", "/front-desk", "/front-desk/bookings", "/front-desk/folios", "/front-desk/payments", "/manager"]) revalidatePath(p);
	return { ok: true, data: { id: data.data.id, status: data.data.status, amount: Number(data.data.amount), method: data.data.method as PaymentMethod } };
}

/** Ask for a refund on a payment; the manager approves it in Payments → Refunds. */
export async function requestRefund(paymentId: string, amount: number, reason: string): Promise<ActionResult<{ id: string; status: string }>> {
	if (!live("payment")) {
		await demoDelay(400);
		return { ok: true, data: { id: `rf-${Date.now()}`, status: "PENDING_APPROVAL" } };
	}
	const s = await withSession();
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/payments/${paymentId}/refunds`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...(s.auth ? { Authorization: `Bearer ${s.auth.token}` } : {}), ...(s.headers ?? {}) },
		body: JSON.stringify({ amount, reason }),
	});
	const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: { id: string; status: string } } | null;
	if (!res.ok || !json?.status || !json.data) return { ok: false, error: json?.message ?? "The refund could not be requested" };
	revalidatePath("/manager/payments");
	revalidatePath("/front-desk/payments");
	return { ok: true, data: { id: json.data.id, status: json.data.status } };
}
