"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { toBatchRow, toGuestLaundryRow, toPriceRow } from "@hospio/api/data/lm";
import type {
	GuestLaundryRow,
	LaundryPriceRow,
	LinenBatchRow,
} from "@hospio/api/data/types";
import { revalidateOps } from "./ops-helpers";

/**
 * Guest laundry, the price list and hotel linen batches (docs/laundry-maintenance.md in hospio-backend). Every write
 * goes to housekeeping-service; nothing here pretends to succeed when it isn't live.
 */

const NOT_LIVE: ActionResult<never> = {
	ok: false,
	error: "Laundry isn't connected in demo mode",
};

type Answer<T> = { data: { data: T } | null; error: unknown };

async function order(
	promise: Promise<Answer<Parameters<typeof toGuestLaundryRow>[0]>>,
	fallback: string,
): Promise<ActionResult<GuestLaundryRow>> {
	const { data, error } = await promise;
	if (error || !data)
		return { ok: false, error: errorMessage(error, fallback) };
	revalidateOps();
	return { ok: true, data: toGuestLaundryRow(data.data) };
}

async function batch(
	promise: Promise<Answer<Parameters<typeof toBatchRow>[0]>>,
	fallback: string,
): Promise<ActionResult<LinenBatchRow>> {
	const { data, error } = await promise;
	if (error || !data)
		return { ok: false, error: errorMessage(error, fallback) };
	revalidateOps();
	return { ok: true, data: toBatchRow(data.data) };
}

export async function saveLaundryPrice(input: {
	id?: string;
	name: string;
	category: string;
	price: number;
	expressPrice?: number | null;
	active?: boolean;
}): Promise<ActionResult<LaundryPriceRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	const s = await withSession();
	const body = {
		name: input.name.trim(),
		category: input.category,
		price: input.price,
		expressPrice: input.expressPrice ?? null,
		active: input.active ?? null,
	};
	const { data, error } = input.id
		? await api("@put/housekeeping/laundry/prices/:id", {
				...s,
				params: { id: input.id },
				body,
			})
		: await api("@post/housekeeping/laundry/prices", { ...s, body });
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The price could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: toPriceRow(data.data) };
}

export async function takeLaundryOrder(input: {
	roomId: string;
	lines: { priceId: string; quantity: number }[];
	express: boolean;
	promisedAt?: string | null;
	note?: string | null;
	chargeToRoom?: boolean;
}): Promise<ActionResult<GuestLaundryRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return order(
		api("@post/housekeeping/laundry/orders", {
			...(await withSession()),
			body: {
				roomId: input.roomId,
				lines: input.lines,
				express: input.express,
				promisedAt: input.promisedAt || null,
				note: input.note?.trim() || null,
				chargeToRoom: input.chargeToRoom ?? false,
			},
		}),
		"The order could not be taken",
	);
}

export async function moveLaundryOrder(
	id: string,
	status: string,
): Promise<ActionResult<GuestLaundryRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return order(
		api("@post/housekeeping/laundry/orders/:id/status", {
			...(await withSession()),
			params: { id },
			body: { status },
		}),
		"The order could not be moved on",
	);
}

export async function chargeLaundryToRoom(
	id: string,
): Promise<ActionResult<GuestLaundryRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return order(
		api("@post/housekeeping/laundry/orders/:id/charge-to-room", {
			...(await withSession()),
			params: { id },
		}),
		"The order could not be charged to the room",
	);
}

export async function laundryPaid(
	id: string,
	paymentId: string,
): Promise<ActionResult<GuestLaundryRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return order(
		api("@post/housekeeping/laundry/orders/:id/paid", {
			...(await withSession()),
			params: { id },
			body: { paymentId },
		}),
		"The payment could not be recorded on the order",
	);
}

export async function cancelLaundryOrder(
	id: string,
	reason: string,
): Promise<ActionResult<GuestLaundryRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return order(
		api("@post/housekeeping/laundry/orders/:id/cancel", {
			...(await withSession()),
			params: { id },
			body: { reason: reason.trim() },
		}),
		"The order could not be cancelled",
	);
}

export async function laundryPocketNote(
	id: string,
	note: string,
): Promise<ActionResult<GuestLaundryRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return order(
		api("@post/housekeeping/laundry/orders/:id/pocket-note", {
			...(await withSession()),
			params: { id },
			body: { note: note.trim() },
		}),
		"The note could not be saved",
	);
}

export async function sendLinen(input: {
	lines: { itemId: string; quantity: number }[];
	note?: string | null;
}): Promise<ActionResult<LinenBatchRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return batch(
		api("@post/housekeeping/laundry/linen-batches", {
			...(await withSession()),
			body: { lines: input.lines, note: input.note?.trim() || null },
		}),
		"The linen could not be sent",
	);
}

export async function receiveLinen(
	id: string,
	lines: { itemId: string; quantity: number }[],
): Promise<ActionResult<LinenBatchRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return batch(
		api("@post/housekeeping/laundry/linen-batches/:id/receive", {
			...(await withSession()),
			params: { id },
			body: { lines },
		}),
		"The batch could not be received",
	);
}

export async function returnLinen(
	id: string,
	lines: { itemId: string; returned: number; condemned: number }[],
	reason?: string | null,
): Promise<ActionResult<LinenBatchRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return batch(
		api("@post/housekeeping/laundry/linen-batches/:id/return", {
			...(await withSession()),
			params: { id },
			body: { lines, reason: reason?.trim() || null },
		}),
		"The linen could not be returned",
	);
}

export async function closeLinenBatch(
	id: string,
	reason: string,
): Promise<ActionResult<LinenBatchRow>> {
	if (!live("housekeeping")) return NOT_LIVE;
	return batch(
		api("@post/housekeeping/laundry/linen-batches/:id/close", {
			...(await withSession()),
			params: { id },
			body: { reason: reason.trim() },
		}),
		"The batch could not be closed",
	);
}
