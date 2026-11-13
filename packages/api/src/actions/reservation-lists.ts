"use server";

import type { ActionResult } from "@hospio/api/actions";
import { atHotel } from "@hospio/api/api/server";
import { data } from "@hospio/api/data";
import { allPages } from "@hospio/api/data/paging";
import type {
	BookingQuery,
	BookingRow,
	PaymentQuery,
	PaymentRow,
} from "@hospio/api/data/types";

/**
 * Reads behind the paged payments, bookings and guests screens (docs/pagination.md in hospio-backend): exports over the
 * whole filtered range (every page, 100 at a time, so the row count equals the list's total) and a guest's stays.
 * `business` reads every hotel (no X-Hotel-Id): only the owner is allowed that by the services.
 */

export type ExportRows<T> = { rows: T[]; total: number; truncated: boolean };

const LIMIT = 50_000;

export async function exportPayments(
	q: PaymentQuery,
	business = false,
): Promise<ActionResult<ExportRows<PaymentRow>>> {
	const run = () =>
		allPages(async (page, size) => {
			const r = await data.payments.page({ ...q, page, size });
			return r.ok ? r.data : null;
		}, LIMIT);
	const all = await (business ? atHotel(null, run) : run());
	if (!all.ok)
		return { ok: false, error: "Payments couldn't be exported. Try again" };
	return {
		ok: true,
		data: { rows: all.rows, total: all.total, truncated: all.truncated },
	};
}

export async function exportBookings(
	q: BookingQuery,
	business = false,
): Promise<ActionResult<ExportRows<BookingRow>>> {
	const run = () =>
		allPages(async (page, size) => {
			const r = await data.bookings.page({ ...q, page, size });
			return r.ok ? r.data : null;
		}, LIMIT);
	const all = await (business ? atHotel(null, run) : run());
	if (!all.ok)
		return { ok: false, error: "Bookings couldn't be exported. Try again" };
	// Company stays named here, so the screens need no list of every account to export.
	const rows = await data.bookings.named(all.rows);
	return {
		ok: true,
		data: { rows, total: all.total, truncated: all.truncated },
	};
}

/** A guest's stays at every hotel of the business, newest first (the guest panel). */
export async function guestStays(
	id: string,
): Promise<ActionResult<BookingRow[]>> {
	return { ok: true, data: await data.guests.stays(id) };
}
