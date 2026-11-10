import "server-only";

import { getActiveRole, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";
import type { StockItemRow } from "@hospio/api/data/types";
import type { Person } from "./work-orders";

/**
 * What every work-order screen needs besides the rows: who I am, whether I supervise (maintenance Full or a
 * manager/owner), the technicians to assign, the rooms to raise against and the Maintenance store's parts.
 */
export async function workOrderContext(opts: { parts?: boolean } = {}) {
	const [user, role, staff, rooms, stores, items] = await Promise.all([
		getUser(),
		getActiveRole(),
		data.staff.list().catch(() => []),
		data.rooms.list().catch(() => []),
		opts.parts ? data.inventory.stores().catch(() => []) : Promise.resolve([]),
		opts.parts
			? data.inventory.items().catch(() => [])
			: Promise.resolve([] as StockItemRow[]),
	]);
	const level = user?.roleLevels.find((g) => g.role === "MAINTENANCE")?.level;
	const supervisor =
		role === "MANAGER" ||
		role === "OWNER" ||
		(role === "MAINTENANCE" && level === "FULL");
	const technicians: Person[] = staff
		.filter(
			(s) =>
				s.status === "ACTIVE" &&
				(s.role === "MAINTENANCE" ||
					s.grants?.some((g) => g.role === "MAINTENANCE")),
		)
		.map((s) => ({ id: s.userId ?? s.id, name: s.fullName }));
	const store = stores.find((s) => s.kind === "MAINTENANCE");
	return {
		me: { id: user?.id ?? "", name: user?.fullName ?? "" } satisfies Person,
		role,
		supervisor,
		technicians,
		rooms: rooms
			.map((r) => ({ id: r.id, number: r.number }))
			.sort((a, b) =>
				a.number.localeCompare(b.number, "en", { numeric: true }),
			),
		parts: store ? items.filter((i) => i.storeId === store.id) : [],
		storeId: store?.id,
	};
}

/**
 * The rows of a work-order screen: every open work order (the board) and one page of the finished ones, read with the
 * URL's `donePage` and `doneQ` (docs/pagination.md).
 */
export async function loadWorkOrders(
	searchParams: Promise<SearchParamsRecord> | SearchParamsRecord,
) {
	const q = listQueryFrom(await searchParams, [], "done");
	const [rows, done] = await Promise.all([
		data.maintenance.workOrders("open"),
		data.maintenance.workOrdersPage({ scope: "done", q: q.q, page: q.page }),
	]);
	return { rows, done };
}
