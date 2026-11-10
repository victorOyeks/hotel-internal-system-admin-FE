import "server-only";

/**
 * Laundry and maintenance reads (docs/laundry-maintenance.md in hospio-backend): work orders, assets, preventive
 * schedules and the maintenance money on maintenance-service; the laundry price list, guest orders, linen batches and
 * the laundry money on housekeeping-service. `data.maintenance` and `data.laundry` in ./index are these. A reader
 * answers empty (or the demo work orders) when its domain is not live, and logs and answers empty when the service fails.
 */

import { api, errorMessage } from "@hospio/api/api/client";
import type {
	LaundryOrder,
	LaundryPrice,
	LinenBatch,
	MaintAsset,
	MaintSchedule,
	WorkOrder,
} from "@hospio/api/api/routes-lm";
import { withSession } from "@hospio/api/api/server";
import * as ops from "@hospio/api/demo/fixtures/ops";
import type { z } from "zod";
import { live } from "./live";
import {
	allPages,
	failedPage,
	type ListQuery,
	type Paged,
	type PageResult,
	pageQuery,
	slicePage,
	toPaged,
} from "./paging";
import type {
	GuestLaundryRow,
	LaundryMoney,
	LaundryPriceRow,
	LinenBatchRow,
	MaintAssetRow,
	MaintenanceMoney,
	MaintScheduleRow,
	WorkOrderPriority,
	WorkOrderRow,
	WorkOrderStatus,
} from "./types";

const n = (v: number | null | undefined) => (typeof v === "number" ? v : 0);
const s = (v: string | null | undefined) => v ?? undefined;
const where = (roomNumber?: string | null, area?: string | null) =>
	roomNumber ? `Room ${roomNumber}` : (area ?? "Hotel");

/** An unpaged answer, or the rows of a page (the routes answer either). */
const rowsOf = <T>(d: T[] | { content: T[] }): T[] =>
	Array.isArray(d) ? d : d.content;

type Wire<T> = Parameters<typeof toPaged<T, unknown>>[0];
/** A paged answer as a Paged; an unpaged one (a service that is behind) as one page of everything. */
const asPaged = <A, B>(d: A[] | Wire<A>, map: (a: A) => B): Paged<B> =>
	Array.isArray(d)
		? slicePage(d.map(map), 0, Math.max(1, d.length))
		: toPaged(d, map);

async function pageOf<A, B>(
	what: string,
	call: Promise<{ data: { data: A[] | Wire<A> } | null; error: unknown }>,
	map: (a: A) => B,
	size?: number,
): Promise<PageResult<B>> {
	const { data, error } = await call;
	if (error || !data) {
		console.error(`${what}:`, error);
		return failedPage(errorMessage(error, `Couldn't load ${what}`), size);
	}
	return { ok: true, data: asPaged(data.data, map) };
}

function failed<T>(what: string, error: unknown, fallback: T): T {
	console.error(`${what}:`, error);
	return fallback;
}

export function toWorkOrderRow(w: z.infer<typeof WorkOrder>): WorkOrderRow {
	return {
		id: w.id,
		number: w.number ?? "WO",
		roomId: s(w.roomId),
		roomNumber: s(w.roomNumber),
		area: s(w.area),
		where: where(w.roomNumber, w.area),
		category: w.category ?? "OTHER",
		priority: w.priority as WorkOrderPriority,
		status: w.status as WorkOrderStatus,
		title: w.title,
		description: s(w.description),
		source: s(w.source),
		reportedBy: s(w.reportedBy),
		reportedByName: w.reportedByName ?? "Someone",
		reportedByRole: s(w.reportedByRole),
		assignedTo: s(w.assignedTo),
		assignedToName: s(w.assignedToName),
		dueAt: s(w.dueAt),
		overdue: !!w.overdue,
		startedAt: s(w.startedAt),
		holdReason: s(w.holdReason),
		doneAt: s(w.doneAt),
		completionNote: s(w.completionNote),
		labourMinutes: w.labourMinutes ?? undefined,
		parts: (w.parts ?? []).map((p) => ({
			itemId: p.itemId,
			name: p.name ?? "Part",
			unit: p.unit ?? "",
			quantity: p.quantity,
			unitCost: n(p.unitCost),
			value: n(p.value),
		})),
		partsCost: n(w.partsCost),
		vendorName: s(w.vendorName),
		vendorCost: n(w.vendorCost),
		totalCost: n(w.totalCost),
		roomOutOfOrder: !!w.roomOutOfOrder,
		oooUntil: s(w.oooUntil),
		reopenCount: n(w.reopenCount),
		reopenReason: s(w.reopenReason),
		cancelReason: s(w.cancelReason),
		hasPhoto: !!w.hasPhoto,
		assetName: s(w.assetName),
		scheduleId: s(w.scheduleId),
		createdAt: w.createdAt ?? new Date().toISOString(),
		updates: (w.updates ?? []).map((u) => ({
			at: u.at ?? "",
			by: u.byName ?? "",
			note: u.note,
		})),
	};
}

export function toAssetRow(a: z.infer<typeof MaintAsset>): MaintAssetRow {
	return {
		id: a.id,
		name: a.name,
		category: a.category ?? "OTHER",
		roomId: s(a.roomId),
		roomNumber: s(a.roomNumber),
		area: s(a.area),
		where: where(a.roomNumber, a.area),
		active: a.active !== false,
		openWorkOrders: n(a.openWorkOrders),
	};
}

export function toScheduleRow(
	j: z.infer<typeof MaintSchedule>,
): MaintScheduleRow {
	return {
		id: j.id,
		title: j.title,
		description: s(j.description),
		category: j.category ?? "OTHER",
		priority: (j.priority ?? "NORMAL") as WorkOrderPriority,
		everyDays: j.everyDays,
		nextDue: j.nextDue,
		lastDone: s(j.lastDone),
		lastOpened: s(j.lastOpened),
		assetId: s(j.assetId),
		assetName: s(j.assetName),
		roomId: s(j.roomId),
		roomNumber: s(j.roomNumber),
		area: s(j.area),
		where: j.assetName ?? where(j.roomNumber, j.area),
		assignedTo: s(j.assignedTo),
		assignedToName: s(j.assignedToName),
		paused: !!j.paused,
	};
}

export function toPriceRow(p: z.infer<typeof LaundryPrice>): LaundryPriceRow {
	return {
		id: p.id,
		name: p.name,
		category: p.category ?? "WASH_IRON",
		price: p.price,
		expressPrice: n(p.expressPrice) || p.price,
		active: p.active !== false,
		sortOrder: n(p.sortOrder),
	};
}

export function toGuestLaundryRow(
	o: z.infer<typeof LaundryOrder>,
): GuestLaundryRow {
	return {
		id: o.id,
		number: o.number ?? "LDR",
		bookingId: s(o.bookingId),
		guestName: o.guestName ?? "Guest",
		roomId: s(o.roomId),
		roomNumber: s(o.roomNumber),
		lines: (o.lines ?? []).map((l) => ({
			priceId: s(l.priceId),
			name: l.name,
			quantity: l.quantity,
			unitPrice: l.unitPrice,
			amount: l.amount,
		})),
		express: !!o.express,
		total: o.total,
		status: o.status as GuestLaundryRow["status"],
		settlement:
			o.settlement === "ROOM" || o.settlement === "PAID"
				? o.settlement
				: undefined,
		chargedAt: s(o.chargedAt),
		paidAt: s(o.paidAt),
		paymentMethod: s(o.paymentMethod),
		promisedAt: s(o.promisedAt),
		note: s(o.note),
		pocketNote: s(o.pocketNote),
		cancelReason: s(o.cancelReason),
		receivedByName: s(o.receivedByName),
		createdAt: o.createdAt ?? new Date().toISOString(),
		deliveredAt: s(o.deliveredAt),
	};
}

export function toBatchRow(b: z.infer<typeof LinenBatch>): LinenBatchRow {
	return {
		id: b.id,
		number: b.number,
		status: b.status as LinenBatchRow["status"],
		lines: b.lines.map((l) => ({
			itemId: l.itemId,
			name: l.name ?? "Linen",
			unit: l.unit ?? "pcs",
			sent: l.sent,
			received: l.received ?? undefined,
			returned: n(l.returned),
			condemned: n(l.condemned),
			lost: n(l.lost),
			missing: n(l.missing),
			outstanding: n(l.outstanding),
			unitCost: n(l.unitCost),
		})),
		note: s(b.note),
		sentByName: s(b.sentByName),
		createdAt: b.createdAt ?? new Date().toISOString(),
		receivedAt: s(b.receivedAt),
		receivedByName: s(b.receivedByName),
		returnedAt: s(b.returnedAt),
		closedReason: s(b.closedReason),
		condemnedValue: n(b.condemnedValue),
		lostValue: n(b.lostValue),
		sent: n(b.sent),
		missing: n(b.missing),
		outstanding: n(b.outstanding),
	};
}

/** The old demo repairs, shown as work orders when maintenance isn't live (the demo build). */
function demoWorkOrders(): WorkOrderRow[] {
	return ops.demoRepairs.map((r, i) => ({
		id: r.id,
		number: `WO-2026-${String(i + 1).padStart(5, "0")}`,
		roomNumber: r.roomNumber,
		area: r.area,
		where: where(r.roomNumber, r.area),
		category: "OTHER",
		priority: r.priority,
		status: r.status === "WAITING_PARTS" ? "ON_HOLD" : r.status,
		title: r.title,
		description: r.description,
		reportedByName: r.reportedBy,
		assignedToName: r.assignedTo,
		overdue: false,
		holdReason: r.status === "WAITING_PARTS" ? "Waiting for parts" : undefined,
		doneAt: r.doneAt,
		parts: [],
		partsCost: 0,
		vendorCost: 0,
		totalCost: 0,
		roomOutOfOrder: !!r.roomOutOfOrder,
		reopenCount: 0,
		hasPhoto: false,
		createdAt: r.createdAt,
		updates: r.updates,
	}));
}

export const lmData = {
	maintenance: {
		/**
		 * The open work orders (the board: every one, overdue first; bounded by nature) or `mine` (open and on me).
		 * Done and all are paged: {@link workOrdersPage}.
		 */
		workOrders: async (
			scope: "open" | "mine" = "open",
		): Promise<WorkOrderRow[]> => {
			if (!live("maintenance"))
				return demoWorkOrders().filter(
					(w) => !["DONE", "CANCELLED"].includes(w.status),
				);
			const { data, error } = await api("@get/maintenance/repairs", {
				...(await withSession()),
				query: { scope },
			});
			if (error || !data)
				return failed("maintenance-service work orders", error, []);
			return rowsOf(data.data).map(toWorkOrderRow);
		},
		/**
		 * One page of work orders: `scope` open, mine, raised, overdue, held, unassigned, done or all, with `q`, `roomId`,
		 * `from`, `to`; `counts` has every tab over the same search.
		 */
		workOrdersPage: async (
			q: ListQuery & { scope?: string; roomId?: string } = {},
		): Promise<PageResult<WorkOrderRow>> => {
			if (!live("maintenance")) {
				const rows = demoWorkOrders();
				const done = rows.filter((w) =>
					["DONE", "CANCELLED"].includes(w.status),
				);
				const list = q.scope === "done" ? done : rows;
				return {
					ok: true,
					data: slicePage(list, q.page ?? 0, q.size ?? 25, {
						counts: { done: done.length, all: rows.length },
					}),
				};
			}
			return pageOf(
				"maintenance-service work orders",
				api("@get/maintenance/repairs", {
					...(await withSession()),
					query: pageQuery(q),
				}),
				toWorkOrderRow,
				q.size,
			);
		},
		workOrder: async (id: string): Promise<WorkOrderRow | null> => {
			if (!live("maintenance"))
				return demoWorkOrders().find((w) => w.id === id) ?? null;
			const { data, error } = await api("@get/maintenance/repairs/:id", {
				...(await withSession()),
				params: { id },
			});
			if (error || !data)
				return failed("maintenance-service work order", error, null);
			return toWorkOrderRow(data.data);
		},
		assets: async (): Promise<MaintAssetRow[]> => {
			if (!live("maintenance")) return [];
			const { data, error } = await api("@get/maintenance/assets", {
				...(await withSession()),
			});
			if (error || !data)
				return failed("maintenance-service assets", error, []);
			return data.data.map(toAssetRow);
		},
		schedules: async (): Promise<MaintScheduleRow[]> => {
			if (!live("maintenance")) return [];
			const { data, error } = await api("@get/maintenance/scheduled-jobs", {
				...(await withSession()),
			});
			if (error || !data)
				return failed("maintenance-service schedules", error, []);
			return data.data.map(toScheduleRow);
		},
		/** Parts and vendor cost of work orders completed in the period (default the last 30 days); null when not allowed or not live. */
		money: async (
			from?: string,
			to?: string,
		): Promise<MaintenanceMoney | null> => {
			if (!live("maintenance")) return null;
			const query: Record<string, string> = {};
			if (from) query.from = from;
			if (to) query.to = to;
			const { data, error } = await api("@get/maintenance/repairs/summary", {
				...(await withSession()),
				query,
			});
			if (error || !data) {
				if (error?.status !== 403)
					console.error("maintenance-service summary:", error);
				return null;
			}
			return data.data;
		},
	},
	laundry: {
		prices: async (): Promise<LaundryPriceRow[]> => {
			if (!live("housekeeping")) return [];
			const { data, error } = await api("@get/housekeeping/laundry/prices", {
				...(await withSession()),
			});
			if (error || !data) return failed("laundry prices", error, []);
			return data.data.map(toPriceRow);
		},
		/** The open guest orders (the jobs board: received, in progress, ready; bounded by nature). */
		orders: async (): Promise<GuestLaundryRow[]> => {
			if (!live("housekeeping")) return [];
			const { data, error } = await api("@get/housekeeping/laundry/orders", {
				...(await withSession()),
				query: { status: "open" },
			});
			if (error || !data) return failed("laundry orders", error, []);
			return rowsOf(data.data).map(toGuestLaundryRow);
		},
		/**
		 * What the jobs board shows: every open order plus every order taken in the last 14 days (for "delivered today" and
		 * what was charged or paid today), read page by page so none is dropped.
		 */
		boardOrders: async (): Promise<GuestLaundryRow[]> => {
			if (!live("housekeeping")) return [];
			const since = new Date(Date.now() + 3600_000 - 14 * 86400_000)
				.toISOString()
				.slice(0, 10);
			const s = await withSession();
			const [open, recent] = await Promise.all([
				lmData.laundry.orders(),
				allPages(async (page, size) => {
					const { data, error } = await api(
						"@get/housekeeping/laundry/orders",
						{ ...s, query: pageQuery({ from: since, page, size }) },
					);
					if (error || !data) {
						console.error("laundry orders:", error);
						return null;
					}
					return asPaged(data.data, toGuestLaundryRow);
				}),
			]);
			const byId = new Map(recent.rows.map((o) => [o.id, o]));
			for (const o of open) byId.set(o.id, o);
			return [...byId.values()].sort((a, b) =>
				b.createdAt.localeCompare(a.createdAt),
			);
		},
		/** One page of guest orders (any status unless `status`; OPEN for the board's ones), with `counts` and `totals.value`. */
		ordersPage: async (
			q: ListQuery & { roomId?: string; bookingId?: string } = {},
		): Promise<PageResult<GuestLaundryRow>> => {
			if (!live("housekeeping")) return { ok: true, data: slicePage([], 0) };
			return pageOf(
				"laundry orders",
				api("@get/housekeeping/laundry/orders", {
					...(await withSession()),
					query: pageQuery(q),
				}),
				toGuestLaundryRow,
				q.size,
			);
		},
		/** The open linen batches (sent, received, part returned), read page by page so none is dropped. */
		batches: async (): Promise<LinenBatchRow[]> => {
			if (!live("housekeeping")) return [];
			const s = await withSession();
			const all = await allPages(async (page, size) => {
				const { data, error } = await api(
					"@get/housekeeping/laundry/linen-batches",
					{ ...s, query: pageQuery({ status: "OPEN", page, size }) },
				);
				if (error || !data) {
					console.error("linen batches:", error);
					return null;
				}
				return asPaged(data.data, toBatchRow);
			});
			return all.rows;
		},
		/** One page of linen batches, with `counts` per status and `totals` written off (condemned, lost) over the range. */
		batchesPage: async (
			q: ListQuery = {},
		): Promise<PageResult<LinenBatchRow>> => {
			if (!live("housekeeping")) return { ok: true, data: slicePage([], 0) };
			return pageOf(
				"linen batches",
				api("@get/housekeeping/laundry/linen-batches", {
					...(await withSession()),
					query: pageQuery(q),
				}),
				toBatchRow,
				q.size,
			);
		},
		money: async (from?: string, to?: string): Promise<LaundryMoney | null> => {
			if (!live("housekeeping")) return null;
			const query: Record<string, string> = {};
			if (from) query.from = from;
			if (to) query.to = to;
			const { data, error } = await api("@get/housekeeping/laundry/summary", {
				...(await withSession()),
				query,
			});
			if (error || !data) {
				if (error?.status !== 403) console.error("laundry summary:", error);
				return null;
			}
			return data.data;
		},
	},
};
