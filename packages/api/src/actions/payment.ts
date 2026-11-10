"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions";
import { api, errorMessage } from "@hospio/api/api/client";
import type { Delivery } from "@hospio/api/api/routes-admin";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import type { PaymentMethod, PaymentStatus } from "@hospio/api/data/types";
import { demoDelay } from "@hospio/api/demo/mode";

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
	/** The kitchen or bar order this payment settles; the order closes itself when the payment is approved. */
	orderId?: string;
	/** The desk taking the payment (KITCHEN, BAR, …): must be one of the caller's roles. */
	role?: string;
};

export type RecordedPayment = {
	id: string;
	status: PaymentStatus;
	amount: number;
	method: PaymentMethod;
};

/**
 * Take a payment (payment-service). Cash is approved on the spot; card and transfer go to the role's
 * POS and come back as PROCESSING until the provider confirms. Given a booking without a folio id, the
 * stay's folio is looked up so the payment lands on it.
 */
export async function recordPayment(
	input: RecordPaymentInput,
): Promise<ActionResult<RecordedPayment>> {
	if (!live("payment")) {
		await demoDelay(500);
		return {
			ok: true,
			data: {
				id: `pay-${Date.now()}`,
				status: input.method === "CASH" ? "APPROVED" : "PROCESSING",
				amount: input.amount,
				method: input.method,
			},
		};
	}
	const s = await withSession();
	let folioId = input.folioId;
	if (!folioId && input.bookingId && live("folio")) {
		const folio = await api("@get/folio/folios/by-booking/:bookingId", {
			...s,
			params: { bookingId: input.bookingId },
		}).catch(() => null);
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
			// Email when the guest has one (sent for real); "NONE" sends nothing. WhatsApp is coming soon.
			receiptPreference: input.receipt ?? "EMAIL",
			orderId: input.orderId ?? null,
			role: input.role ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The payment could not be recorded"),
		};
	for (const p of [
		"/kitchen",
		"/kitchen/payments",
		"/bar",
		"/bar/tabs",
		"/bar/payments",
		"/manager/bookings",
		"/manager/folios",
		"/manager/payments",
		"/front-desk",
		"/front-desk/bookings",
		"/front-desk/folios",
		"/front-desk/payments",
		"/manager",
	])
		revalidatePath(p);
	return {
		ok: true,
		data: {
			id: data.data.id,
			status: data.data.status,
			amount: Number(data.data.amount),
			method: data.data.method as PaymentMethod,
		},
	};
}

/** Ask for a refund on a payment; the manager approves it in Payments → Refunds. */
export async function requestRefund(
	paymentId: string,
	amount: number,
	reason: string,
): Promise<ActionResult<{ id: string; status: string }>> {
	if (!live("payment")) {
		await demoDelay(400);
		return {
			ok: true,
			data: { id: `rf-${Date.now()}`, status: "PENDING_APPROVAL" },
		};
	}
	const s = await withSession();
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}/payment/payments/${paymentId}/refunds`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(s.auth ? { Authorization: `Bearer ${s.auth.token}` } : {}),
				...(s.headers ?? {}),
			},
			body: JSON.stringify({ amount, reason }),
		},
	);
	const json = (await res.json().catch(() => null)) as {
		status?: boolean;
		message?: string;
		data?: { id: string; status: string };
	} | null;
	if (!res.ok || !json?.status || !json.data)
		return {
			ok: false,
			error: json?.message ?? "The refund could not be requested",
		};
	revalidatePath("/manager/payments");
	revalidatePath("/front-desk/payments");
	return { ok: true, data: { id: json.data.id, status: json.data.status } };
}

function refreshPayments() {
	for (const p of [
		"/manager/payments",
		"/front-desk/payments",
		"/manager/folios",
		"/manager",
	])
		revalidatePath(p);
}

/** Manager approves a pending refund; payment-service sends it back through the provider or till. */
export async function approveRefund(
	refundId: string,
): Promise<ActionResult<{ id: string; status: string }>> {
	if (!live("payment")) {
		await demoDelay(400);
		return { ok: true, data: { id: refundId, status: "APPROVED" } };
	}
	const { data, error } = await api(
		"@post/payment/payments/refunds/:refundId/approve",
		{ ...(await withSession()), params: { refundId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The refund could not be approved"),
		};
	refreshPayments();
	return { ok: true, data: { id: data.data.id, status: data.data.status } };
}

/** Manager declines a pending refund. */
export async function declineRefund(
	refundId: string,
): Promise<ActionResult<{ id: string; status: string }>> {
	if (!live("payment")) {
		await demoDelay(400);
		return { ok: true, data: { id: refundId, status: "DECLINED" } };
	}
	const { data, error } = await api(
		"@post/payment/payments/refunds/:refundId/decline",
		{ ...(await withSession()), params: { refundId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The refund could not be declined"),
		};
	refreshPayments();
	return { ok: true, data: { id: data.data.id, status: data.data.status } };
}

/** Open a dispute on a payment (the guest says it was charged wrongly). */
export async function openDispute(
	paymentId: string,
	reason: string,
): Promise<ActionResult<{ id: string; status: string }>> {
	if (!live("payment")) {
		await demoDelay(400);
		return { ok: true, data: { id: `dp-${Date.now()}`, status: "OPEN" } };
	}
	const { data, error } = await api("@post/payment/payments/:id/disputes", {
		...(await withSession()),
		params: { id: paymentId },
		body: { reason },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The dispute could not be opened"),
		};
	refreshPayments();
	return { ok: true, data: { id: data.data.id, status: data.data.status } };
}

/** Close a dispute with what was found. */
export async function resolveDispute(
	disputeId: string,
	resolution: string,
): Promise<ActionResult<{ id: string; status: string }>> {
	if (!live("payment")) {
		await demoDelay(400);
		return { ok: true, data: { id: disputeId, status: "RESOLVED" } };
	}
	const { data, error } = await api(
		"@post/payment/payments/disputes/:disputeId/resolve",
		{ ...(await withSession()), params: { disputeId }, body: { resolution } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The dispute could not be resolved"),
		};
	refreshPayments();
	return { ok: true, data: { id: data.data.id, status: data.data.status } };
}

/** Ask the provider where a payment stands (payment-service verify). */
export async function verifyPayment(
	paymentId: string,
): Promise<ActionResult<{ id: string; status: PaymentStatus }>> {
	if (!live("payment")) {
		await demoDelay(400);
		return { ok: true, data: { id: paymentId, status: "APPROVED" } };
	}
	const { data, error } = await api("@post/payment/payments/:id/verify", {
		...(await withSession()),
		params: { id: paymentId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The provider could not be reached"),
		};
	refreshPayments();
	return { ok: true, data: { id: data.data.id, status: data.data.status } };
}

export type TerminalRole = "FRONT_OFFICE" | "BAR" | "KITCHEN" | "LAUNDRY";

function refreshTerminals() {
	for (const p of [
		"/manager/payments",
		"/front-desk/payments",
		"/hotel-owner/settings",
	])
		revalidatePath(p);
}

/** Link a POS: create the terminal, then give it to a desk role (a role has exactly one POS). */
export async function linkTerminal(input: {
	name: string;
	provider: string;
	terminalRef: string;
	role: TerminalRole;
}): Promise<ActionResult<{ id: string }>> {
	if (!live("payment")) {
		await demoDelay(400);
		return { ok: true, data: { id: `t-${Date.now()}` } };
	}
	const s = await withSession();
	const { data, error } = await api("@post/payment/terminals", {
		...s,
		body: {
			name: input.name,
			provider: input.provider,
			terminalRef: input.terminalRef,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The terminal could not be linked"),
		};
	const assigned = await api("@post/payment/terminals/:id/assign", {
		...s,
		params: { id: data.data.id },
		body: { role: input.role },
	});
	refreshTerminals();
	if (assigned.error)
		return {
			ok: false,
			error: `Terminal linked, but it could not be given to ${input.role}: ${errorMessage(assigned.error)}`,
		};
	return { ok: true, data: { id: data.data.id } };
}

/** Rename a terminal (the backend takes the whole record, so provider and ref are sent back as they are). */
export async function renameTerminal(
	t: { id: string; provider: string; ref: string },
	name: string,
): Promise<ActionResult<{ id: string }>> {
	if (!live("payment")) {
		await demoDelay(300);
		return { ok: true, data: { id: t.id } };
	}
	const { data, error } = await api("@put/payment/terminals/:id", {
		...(await withSession()),
		params: { id: t.id },
		body: { name, provider: t.provider, terminalRef: t.ref },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The terminal could not be renamed"),
		};
	refreshTerminals();
	return { ok: true, data: { id: data.data.id } };
}

export async function setTerminalStatus(
	id: string,
	status: "ONLINE" | "OFFLINE" | "RETIRED",
): Promise<ActionResult<{ id: string; status: string }>> {
	if (!live("payment")) {
		await demoDelay(300);
		return { ok: true, data: { id, status } };
	}
	const { data, error } = await api("@put/payment/terminals/:id/status", {
		...(await withSession()),
		params: { id },
		query: { status },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The status could not be changed"),
		};
	refreshTerminals();
	return { ok: true, data: { id: data.data.id, status: data.data.status } };
}

export async function removeTerminal(
	id: string,
): Promise<ActionResult<{ id: string }>> {
	if (!live("payment")) {
		await demoDelay(300);
		return { ok: true, data: { id } };
	}
	const { error } = await api("@delete/payment/terminals/:id", {
		...(await withSession()),
		params: { id },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The terminal could not be removed"),
		};
	refreshTerminals();
	return { ok: true, data: { id } };
}

/** Give a desk role this terminal (moves it from whichever POS it used before). */
export async function reassignTerminal(
	id: string,
	role: TerminalRole,
): Promise<ActionResult<{ id: string; role: string }>> {
	if (!live("payment")) {
		await demoDelay(300);
		return { ok: true, data: { id, role } };
	}
	const { data, error } = await api("@post/payment/terminals/:id/assign", {
		...(await withSession()),
		params: { id },
		body: { role },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The role could not be assigned"),
		};
	refreshTerminals();
	return { ok: true, data: { id, role: data.data.role } };
}

/** Ask H.M.S for a provider account: opens a real support ticket for the hotel's business. */
export async function requestProviderAccount(
	provider: string,
	note: string,
): Promise<ActionResult<{ reference: string }>> {
	if (!live("platform")) {
		await demoDelay(400);
		return { ok: true, data: { reference: "TKT-DEMO01" } };
	}
	const { data, error } = await api("@post/platform/support/tickets", {
		...(await withSession()),
		body: {
			subject: `POS provider account request${provider ? `: ${provider}` : ""}`,
			body:
				note || "We need a payment provider account to link a POS terminal.",
			priority: "NORMAL",
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The ticket could not be opened"),
		};
	return {
		ok: true,
		data: { reference: `T-${data.data.id.slice(0, 6).toUpperCase()}` },
	};
}

/** Help · Contact support: opens a real H.M.S support ticket for the hotel's business. */
export async function openSupportTicket(input: {
	subject: string;
	body: string;
	priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}): Promise<ActionResult<{ reference: string }>> {
	if (!live("platform"))
		return {
			ok: false,
			error: "Support tickets are not connected in demo mode",
		};
	const { data, error } = await api("@post/platform/support/tickets", {
		...(await withSession()),
		body: {
			subject: input.subject.trim(),
			body: input.body.trim(),
			priority: input.priority,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The ticket could not be opened"),
		};
	return {
		ok: true,
		data: { reference: `T-${data.data.id.slice(0, 6).toUpperCase()}` },
	};
}

/**
 * Resend receipt: payment-service sends the approved payment's receipt to the guest again (WhatsApp when
 * the payment has a phone, otherwise email). On staging the delivery comes back for the deliveries panel.
 */
export async function resendReceipt(paymentId: string): Promise<
	ActionResult<{
		receiptNumber: string;
		sentTo: string;
		sentVia: string;
		deliveries?: Delivery[] | null;
	}>
> {
	if (!live("payment"))
		return { ok: false, error: "Receipts are not connected in demo mode" };
	const { data, error } = await api(
		"@post/payment/payments/:id/receipt/resend",
		{ ...(await withSession()), params: { id: paymentId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The receipt could not be sent"),
		};
	refreshPayments();
	return { ok: true, data: data.data };
}

/**
 * Retry on POS: a declined (or unanswered) card payment is sent again as a new request for the same
 * amount, guest and booking, to the POS of the desk that took it. The first one stays in the history.
 */
export async function retryPayment(
	paymentId: string,
): Promise<ActionResult<{ id: string; status: PaymentStatus }>> {
	if (!live("payment"))
		return { ok: false, error: "The POS is not connected in demo mode" };
	const { data, error } = await api("@post/payment/payments/:id/retry", {
		...(await withSession()),
		params: { id: paymentId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The payment could not be sent to the POS"),
		};
	refreshPayments();
	return { ok: true, data: { id: data.data.id, status: data.data.status } };
}
