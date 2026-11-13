"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type {
	CommInvoice,
	CommLine,
	CommMessage,
	CommPlan,
	CommPrices,
} from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";

/**
 * Guest messages as a paid service (hospio-backend docs/guest-message-billing.md): the hotel's plan, usage and invoices
 * (Hotel setup → Guest messages), paying through Paystack, and Hospio360's prices, plans and invoices (admin portal).
 */

export type CommPlanView = z.infer<typeof CommPlan>;
export type CommInvoiceRow = z.infer<typeof CommInvoice>;
export type CommLineRow = z.infer<typeof CommLine>;
export type CommMessageRow = z.infer<typeof CommMessage>;
export type CommPriceSet = z.infer<typeof CommPrices>;
export type Paged<T> = {
	content: T[];
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
};

const PATHS = ["/manager/hotel-setup", "/hotel-owner/hotel-setup"];
const refresh = () => {
	for (const p of PATHS) revalidatePath(p, "layout");
};

// ---- the hotel's own ------------------------------------------------------------------------------------------------

export async function getGuestMessagePlan(): Promise<
	ActionResult<CommPlanView>
> {
	const { data, error } = await api(
		"@get/messaging/billing/messages",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Guest messages could not be loaded"),
		};
	return { ok: true, data: data.data };
}

export async function setGuestMessages(
	enabled: boolean,
): Promise<ActionResult<CommPlanView>> {
	const { data, error } = await api("@put/messaging/billing/messages", {
		...(await withSession()),
		body: { enabled },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Could not change guest messages"),
		};
	refresh();
	return { ok: true, data: data.data };
}

export async function thisMonthMessages(
	page = 0,
	size = 25,
): Promise<ActionResult<Paged<CommMessageRow>>> {
	const { data, error } = await api(
		"@get/messaging/billing/messages/this-month",
		{ ...(await withSession()), query: { page, size } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "This month's messages could not be loaded"),
		};
	return { ok: true, data: data.data };
}

export async function guestMessageInvoices(
	page = 0,
	size = 12,
): Promise<ActionResult<Paged<CommInvoiceRow>>> {
	const { data, error } = await api(
		"@get/messaging/billing/messages/invoices",
		{ ...(await withSession()), query: { page, size } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Invoices could not be loaded"),
		};
	return { ok: true, data: data.data };
}

export async function guestMessageInvoice(
	id: string,
): Promise<ActionResult<{ invoice: CommInvoiceRow; lines: CommLineRow[] }>> {
	const { data, error } = await api(
		"@get/messaging/billing/messages/invoices/:id",
		{ ...(await withSession()), params: { id } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The invoice could not be loaded"),
		};
	return { ok: true, data: data.data };
}

export async function guestMessageInvoiceMessages(
	id: string,
	page = 0,
	size = 25,
): Promise<ActionResult<Paged<CommMessageRow>>> {
	const { data, error } = await api(
		"@get/messaging/billing/messages/invoices/:id/messages",
		{
			...(await withSession()),
			params: { id },
			query: { page, size },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The invoice's messages could not be loaded"),
		};
	return { ok: true, data: data.data };
}

/** Starts Paystack's checkout; the browser goes to `authorizationUrl` and comes back to `returnUrl`. */
export async function payGuestMessageInvoice(
	id: string,
	returnUrl: string,
): Promise<ActionResult<{ authorizationUrl: string; reference: string }>> {
	const { data, error } = await api(
		"@post/messaging/billing/messages/invoices/:id/pay",
		{
			...(await withSession()),
			params: { id },
			body: { returnUrl },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Payment could not be started"),
		};
	return { ok: true, data: data.data };
}

export async function confirmGuestMessagePayment(
	reference: string,
): Promise<ActionResult<CommInvoiceRow>> {
	const { data, error } = await api(
		"@post/messaging/billing/messages/payments/:reference/confirm",
		{
			...(await withSession()),
			params: { reference },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The payment could not be confirmed yet"),
		};
	refresh();
	return { ok: true, data: data.data };
}

// ---- Hospio360's side (admin portal) -------------------------------------------------------------------------------

export async function getDefaultMessagePrices(): Promise<
	ActionResult<CommPriceSet>
> {
	const { data, error } = await api(
		"@get/messaging/billing/messages/admin/prices",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Prices could not be loaded"),
		};
	return { ok: true, data: data.data };
}

export async function setDefaultMessagePrices(prices: {
	email: number;
	sms: number;
	whatsapp: number;
}): Promise<ActionResult<CommPriceSet>> {
	const { data, error } = await api(
		"@put/messaging/billing/messages/admin/prices",
		{ ...(await withSession()), body: prices },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Prices could not be saved"),
		};
	return { ok: true, data: data.data };
}

export async function hotelMessagePlans(
	hotelIds: string[],
): Promise<ActionResult<CommPlanView[]>> {
	if (hotelIds.length === 0) return { ok: true, data: [] };
	const { data, error } = await api(
		"@get/messaging/billing/messages/admin/plans",
		{
			...(await withSession()),
			query: { hotelIds: hotelIds.join(",") },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Guest-message plans could not be loaded"),
		};
	return { ok: true, data: data.data };
}

export async function setHotelMessagePlan(
	hotelId: string,
	plan: {
		businessId: string;
		enabled?: boolean;
		email?: number | null;
		sms?: number | null;
		whatsapp?: number | null;
		useDefaults?: boolean;
	},
): Promise<ActionResult<CommPlanView>> {
	const { data, error } = await api(
		"@put/messaging/billing/messages/admin/plans/:hotelId",
		{
			...(await withSession()),
			params: { hotelId },
			body: plan,
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The plan could not be saved"),
		};
	return { ok: true, data: data.data };
}

export async function setHotelMessageSuspension(
	hotelId: string,
	suspended: boolean,
	reason?: string,
): Promise<ActionResult<CommPlanView>> {
	const { data, error } = await api(
		"@post/messaging/billing/messages/admin/plans/:hotelId/suspension",
		{
			...(await withSession()),
			params: { hotelId },
			body: { suspended, reason },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Could not change the suspension"),
		};
	return { ok: true, data: data.data };
}

export async function allMessageInvoices(q: {
	status?: string;
	month?: string;
	hotelId?: string;
	page?: number;
	size?: number;
}): Promise<ActionResult<Paged<CommInvoiceRow>>> {
	const { data, error } = await api(
		"@get/messaging/billing/messages/admin/invoices",
		{ ...(await withSession()), query: q },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Invoices could not be loaded"),
		};
	return { ok: true, data: data.data };
}

export async function issueMessageInvoices(
	month?: string,
	hotelId?: string,
	businessId?: string,
): Promise<ActionResult<CommInvoiceRow[]>> {
	const { data, error } = await api(
		"@post/messaging/billing/messages/admin/invoices/issue",
		{
			...(await withSession()),
			body: { month, hotelId, businessId },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Invoices could not be issued"),
		};
	return { ok: true, data: data.data };
}

export async function markMessageInvoicePaid(
	id: string,
	reference?: string,
	note?: string,
): Promise<ActionResult<CommInvoiceRow>> {
	const { data, error } = await api(
		"@post/messaging/billing/messages/admin/invoices/:id/mark-paid",
		{
			...(await withSession()),
			params: { id },
			body: { reference, note },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The invoice could not be marked paid"),
		};
	return { ok: true, data: data.data };
}
