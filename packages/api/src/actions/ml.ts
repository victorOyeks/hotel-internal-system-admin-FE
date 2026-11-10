"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { Delivery } from "@hospio/api/api/routes-admin";
import { atHotel, withSession } from "@hospio/api/api/server";
import { env } from "@hospio/api/env";
import { live } from "@hospio/api/data/live";
import { toLostFoundRow } from "@hospio/api/data/mappers/housekeeping";
import { mlData, toBillRow } from "@hospio/api/data/ml";
import type { BillRow } from "@hospio/api/data/ml-types";
import type { ActivityRow, LostFoundRow } from "@hospio/api/data/types";
import { deliveriesOf, revalidateOps } from "./ops-helpers";

/**
 * Manager leftovers, housekeeping leftovers and receipts (hospio-backend/docs/manager-leftovers.md): activity export,
 * Email me for a report, lost & found, expense categories, budgets, bills and receipts by email.
 */

const NOT_LIVE = {
	ok: false as const,
	error: "Not connected yet · nothing was saved or sent",
};
const fail = (error: unknown, what: string) => ({
	ok: false as const,
	error: errorMessage(error, what),
});

// ---- activity log ---------------------------------------------------------------------------------------

/** The activity log's largest page (platform-service answers 1 to 200). */
const ACTIVITY_PAGE = 200;

/**
 * Every entry matching the screen's filters, read 200 at a time, for the CSV export: the whole filtered range, not the page
 * on screen. Stops at `limit` rows (`truncated` says so); `total` is the service's count for the same filters.
 */
export async function exportActivity(
	query: { q?: string; department?: string; from?: string; to?: string },
	limit = 20_000,
): Promise<
	ActionResult<{ rows: ActivityRow[]; total: number; truncated: boolean }>
> {
	const rows: ActivityRow[] = [];
	let total = 0;
	for (let page = 0; ; page++) {
		const r = await mlData.activity.page({
			...query,
			page,
			size: ACTIVITY_PAGE,
		});
		if (!r.ok) return { ok: false, error: r.error };
		total = r.data.total;
		rows.push(...r.data.content);
		if (page + 1 >= r.data.totalPages || rows.length >= limit) break;
	}
	return {
		ok: true,
		data: { rows: rows.slice(0, limit), total, truncated: total > limit },
	};
}

// ---- reports --------------------------------------------------------------------------------------------

/** Email me: a link to this report (kind, period, hotel) goes to the caller's own email. */
export async function emailReport(input: {
	kind: string;
	from: string;
	to: string;
	hotelId?: string;
}): Promise<ActionResult<{ to: string; deliveries?: Delivery[] | null }>> {
	if (!live("platform")) return NOT_LIVE;
	const { data, error } = await atHotel(input.hotelId ?? null, async () =>
		api("@post/platform/reports/email", {
			...(await withSession()),
			body: {
				kind: input.kind,
				from: input.from,
				to: input.to,
				...(input.hotelId ? { hotelId: input.hotelId } : {}),
			},
		}),
	);
	if (error || !data) return fail(error, "The report could not be emailed");
	return {
		ok: true,
		data: { to: data.data.to, deliveries: deliveriesOf(data) },
	};
}

// ---- lost & found ---------------------------------------------------------------------------------------

type LF = ActionResult<LostFoundRow>;

export async function logFoundItem(input: {
	description: string;
	details?: string;
	roomId?: string;
	roomNumber?: string;
	foundWhere?: string;
	foundById?: string;
	foundByName?: string;
	tellFrontOffice: boolean;
}): Promise<LF> {
	if (!live("housekeeping")) return NOT_LIVE;
	const { data, error } = await api("@post/housekeeping/lost-found", {
		...(await withSession()),
		body: {
			description: input.description.trim(),
			details: input.details?.trim() || null,
			roomId: input.roomId || null,
			roomNumber: input.roomNumber || null,
			foundWhere: input.foundWhere || null,
			foundById: input.foundById || null,
			foundByName: input.foundByName || null,
			tellFrontOffice: input.tellFrontOffice,
		},
	});
	if (error || !data) return fail(error, "The item could not be logged");
	revalidateOps();
	return { ok: true, data: toLostFoundRow(data.data) };
}

/** Adds the photo (multipart, JPEG/PNG/WebP up to 2 MB) to a logged item. */
export async function uploadFoundPhoto(
	id: string,
	form: FormData,
): Promise<LF> {
	if (!live("housekeeping")) return NOT_LIVE;
	const file = form.get("file");
	if (!(file instanceof File) || file.size === 0)
		return { ok: false, error: "Pick a photo" };
	if (file.size > 2 * 1024 * 1024)
		return { ok: false, error: "The photo is too big · keep it under 2 MB" };
	const s = await withSession();
	const body = new FormData();
	body.set("file", file, file.name || "photo.jpg");
	try {
		const res = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/housekeeping/lost-found/${encodeURIComponent(id)}/photo`,
			{
				method: "POST",
				headers: {
					...(s.auth ? { Authorization: `Bearer ${s.auth.token}` } : {}),
					...(s.headers ?? {}),
				},
				body,
			},
		);
		const json = (await res.json().catch(() => null)) as {
			message?: string;
			data?: Parameters<typeof toLostFoundRow>[0];
		} | null;
		if (!res.ok || !json?.data)
			return {
				ok: false,
				error: json?.message || "The photo could not be saved",
			};
		revalidateOps();
		return { ok: true, data: toLostFoundRow(json.data) };
	} catch {
		return {
			ok: false,
			error: "Can't reach the server. Check your connection",
		};
	}
}

export async function tellFrontOffice(id: string): Promise<LF> {
	if (!live("housekeeping")) return NOT_LIVE;
	const { data, error } = await api(
		"@post/housekeeping/lost-found/:id/tell-front-office",
		{
			...(await withSession()),
			params: { id },
		},
	);
	if (error || !data) return fail(error, "The front office could not be told");
	return { ok: true, data: toLostFoundRow(data.data) };
}

export async function returnFoundItem(
	id: string,
	input: { returnedTo: string; idNote?: string; how?: string },
): Promise<LF> {
	if (!live("housekeeping")) return NOT_LIVE;
	const { data, error } = await api(
		"@post/housekeeping/lost-found/:id/return",
		{
			...(await withSession()),
			params: { id },
			body: {
				returnedTo: input.returnedTo.trim(),
				idNote: input.idNote?.trim() || null,
				how: input.how || null,
			},
		},
	);
	if (error || !data) return fail(error, "The item could not be handed back");
	revalidateOps();
	return { ok: true, data: toLostFoundRow(data.data) };
}

export async function disposeFoundItem(
	id: string,
	reason: string,
): Promise<LF> {
	if (!live("housekeeping")) return NOT_LIVE;
	const { data, error } = await api(
		"@post/housekeeping/lost-found/:id/dispose",
		{
			...(await withSession()),
			params: { id },
			body: { reason: reason.trim() },
		},
	);
	if (error || !data) return fail(error, "The item could not be disposed of");
	revalidateOps();
	return { ok: true, data: toLostFoundRow(data.data) };
}

// ---- expense categories, budgets, bills ----------------------------------------------------------------

export async function addExpenseCategory(
	label: string,
): Promise<ActionResult<{ code: string; label: string }>> {
	if (!live("finance")) return NOT_LIVE;
	const { data, error } = await api("@post/finance/expense-categories", {
		...(await withSession()),
		body: { label: label.trim() },
	});
	if (error || !data) return fail(error, "The category could not be added");
	revalidateOps();
	return { ok: true, data: { code: data.data.code, label: data.data.label } };
}

export async function changeExpenseCategory(
	id: string,
	patch: { label?: string; active?: boolean },
): Promise<ActionResult> {
	if (!live("finance")) return NOT_LIVE;
	const { data, error } = await api("@put/finance/expense-categories/:id", {
		...(await withSession()),
		params: { id },
		body: patch,
	});
	if (error || !data) return fail(error, "The category could not be changed");
	revalidateOps();
	return { ok: true, data: null };
}

export async function saveBudget(input: {
	category: string;
	month: string;
	amount: number;
}): Promise<ActionResult> {
	if (!live("finance")) return NOT_LIVE;
	const { data, error } = await api("@put/finance/budgets", {
		...(await withSession()),
		body: input,
	});
	if (error || !data) return fail(error, "The budget could not be saved");
	revalidateOps();
	return { ok: true, data: null };
}

export type BillInput = {
	payee: string;
	category: string;
	amount: number;
	dueDate: string;
	repeats: string;
	note?: string;
};

export async function saveBill(
	input: BillInput,
	id?: string,
): Promise<ActionResult<BillRow>> {
	if (!live("finance")) return NOT_LIVE;
	const body = {
		...input,
		payee: input.payee.trim(),
		note: input.note?.trim() || null,
	};
	const s = await withSession();
	const { data, error } = id
		? await api("@put/finance/bills/:id", { ...s, params: { id }, body })
		: await api("@post/finance/bills", { ...s, body });
	if (error || !data) return fail(error, "The bill could not be saved");
	revalidateOps();
	return { ok: true, data: toBillRow(data.data) };
}

export async function payBill(
	id: string,
	paidFrom: string,
): Promise<
	ActionResult<{ bill: BillRow; next?: BillRow; expenseAmount: number }>
> {
	if (!live("finance")) return NOT_LIVE;
	const { data, error } = await api("@post/finance/bills/:id/paid", {
		...(await withSession()),
		params: { id },
		body: { paidFrom },
	});
	if (error || !data) return fail(error, "The bill could not be marked paid");
	revalidateOps();
	return {
		ok: true,
		data: {
			bill: toBillRow(data.data.bill),
			next: data.data.next ? toBillRow(data.data.next) : undefined,
			expenseAmount: Number(data.data.expense.amount),
		},
	};
}

export async function cancelBill(id: string): Promise<ActionResult> {
	if (!live("finance")) return NOT_LIVE;
	const { data, error } = await api("@post/finance/bills/:id/cancel", {
		...(await withSession()),
		params: { id },
	});
	if (error || !data) return fail(error, "The bill could not be cancelled");
	revalidateOps();
	return { ok: true, data: null };
}

// ---- receipts -------------------------------------------------------------------------------------------

/** Email receipt: the receipt as printed (its text) goes to the address, for one payment, a sale or a folio. */
export async function emailReceipt(input: {
	paymentId?: string;
	orderId?: string;
	folioId?: string;
	to: string;
	text: string;
}): Promise<
	ActionResult<{
		to: string;
		receiptNumbers: string[];
		deliveries?: Delivery[] | null;
	}>
> {
	if (!live("payment")) return NOT_LIVE;
	const { data, error } = await api("@post/payment/receipts/email", {
		...(await withSession()),
		body: {
			...(input.paymentId ? { paymentId: input.paymentId } : {}),
			...(input.orderId ? { orderId: input.orderId } : {}),
			...(input.folioId ? { folioId: input.folioId } : {}),
			to: input.to.trim(),
			text: input.text,
		},
	});
	if (error || !data) return fail(error, "The receipt could not be emailed");
	return {
		ok: true,
		data: {
			to: data.data.to,
			receiptNumbers: data.data.receiptNumbers,
			deliveries: deliveriesOf(data),
		},
	};
}
