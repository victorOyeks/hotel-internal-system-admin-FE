"use server";

import type { ActionResult } from "@hospio/api/actions";
import { data } from "@hospio/api/data";
import { allPages } from "@hospio/api/data/paging";
import type { OwnerStaffRow, RolesAccessRow } from "@hospio/api/data/types";

/**
 * Reads behind the paged Staff and Roles & permissions screens (docs/pagination.md in hospio-backend): the owner's staff
 * export over the whole filtered range (every page, 100 people at a time) and the people search of "Give a role".
 */

const LIMIT = 10_000;

export async function exportOwnerStaff(q: {
	q?: string;
	hotel?: string | null;
	tab?: string | null;
}): Promise<
	ActionResult<{ rows: OwnerStaffRow[]; total: number; truncated: boolean }>
> {
	const all = await allPages(async (page, size) => {
		const r = await data.owner.staffPage({ ...q, page, size });
		return r.ok ? r.data : null;
	}, LIMIT);
	if (!all.ok)
		return { ok: false, error: "Staff couldn't be exported. Try again" };
	return {
		ok: true,
		data: { rows: all.rows, total: all.total, truncated: all.truncated },
	};
}

/** Up to 10 people at the active hotel whose name, email or phone contains `q` (Give a role's person search). */
export async function searchStaffAccess(
	q: string,
): Promise<ActionResult<RolesAccessRow[]>> {
	const r = await data.roles.accessPage({ q: q.trim() || undefined, size: 10 });
	if (!r.ok) return { ok: false, error: r.error };
	return { ok: true, data: r.data.content };
}
