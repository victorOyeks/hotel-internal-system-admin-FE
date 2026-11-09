import "server-only";

/**
 * The restaurant and bar data seam (docs/restaurant-bar.md in hospio-backend): outlets and their tables,
 * menus, categories, happy hours, orders and tabs, sales, and the stores, stock and requests the outlets
 * use. `data` in ./index spreads these into `outlets` and `inventory`. Each reader answers from the demo
 * fixtures when its domain is not live and logs and returns an empty result when the service fails,
 * like the readers in ./ops.
 */

import { cache } from "react";
import { api } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import * as fnb from "@hospio/api/demo/fixtures/fnb";
import * as ops from "@hospio/api/demo/fixtures/ops";
import { demoDelay } from "@hospio/api/demo/mode";
import { live } from "./live";
import { lagosDate } from "./mappers/finance";
import {
	toCategoryRow,
	toHappyHourRow,
	toMenuItemRow,
	toOrderRow,
	toOutletRow,
	toSalesDay,
	toStockItemRows,
	toStockRequestRow,
	toStoreRows,
} from "./mappers/fnb";
import type {
	CategoryRow,
	HappyHourRow,
	MenuItemRow,
	OrderRow,
	OutletRow,
	OutletSalesDayRow,
	StockItemRow,
	StockRequestRow,
	StoreRow,
} from "./types";

const give = async <T>(value: T): Promise<T> => {
	await demoDelay(40);
	return value;
};

function failed<T>(what: string, error: unknown, empty: T): T {
	console.error(`${what}:`, error);
	return empty;
}

/** The hotel's outlets with their tables; one read per request however many screens ask. */
const loadOutlets = cache(async (): Promise<OutletRow[]> => {
	if (!live("fnb")) return fnb.demoOutlets;
	const s = await withSession();
	const { data: res, error } = await api("@get/fnb/outlets", s);
	if (error || !res) return failed("fnb-service outlets", error, []);
	return Promise.all(
		res.data.map(async (o) => {
			const t = await api("@get/fnb/outlets/:outletId/tables", {
				...s,
				params: { outletId: o.id },
			}).catch(() => null);
			return toOutletRow(o, t?.data?.data ?? []);
		}),
	);
});

/** Stores, items and levels in one go, so stock screens and the stores list agree. */
const loadStock = cache(async () => {
	const s = await withSession();
	const [stores, items, levels] = await Promise.all([
		api("@get/inventory/stores", s),
		api("@get/inventory/items", s),
		api("@get/inventory/levels", { ...s, query: {} }),
	]);
	if (
		stores.error ||
		items.error ||
		levels.error ||
		!stores.data ||
		!items.data ||
		!levels.data
	) {
		return failed(
			"inventory-service stock",
			stores.error ?? items.error ?? levels.error,
			null,
		);
	}
	const rows = toStockItemRows(
		items.data.data,
		levels.data.data,
		stores.data.data,
	);
	return { stores: stores.data.data, items: items.data.data, rows };
});

export const fnbData = {
	outlets: {
		/** Every outlet with its tables (Hotel setup, the manager's menus, outlet pickers). */
		list: (): Promise<OutletRow[]> => loadOutlets(),
		/** The outlet a desk works: a kitchen role gets the first KITCHEN or RESTAURANT outlet, the bar the first BAR one. */
		forRole: async (role: "KITCHEN" | "BAR"): Promise<OutletRow | null> => {
			const all = await loadOutlets();
			const mine = all.filter((o) =>
				role === "BAR" ? o.kind === "BAR" : o.kind !== "BAR",
			);
			return mine.find((o) => o.status === "OPEN") ?? mine[0] ?? null;
		},
		/** The menu of one outlet; `all` includes items taken off the menu (manage menu). */
		menu: async (outletId: string, all = false): Promise<MenuItemRow[]> => {
			if (!live("fnb"))
				return give(
					ops.demoMenu.filter(
						(m) => m.outletId === outletId && (all || m.active !== false),
					),
				);
			const s = await withSession();
			const read = (everything: boolean) =>
				api("@get/fnb/outlets/:outletId/menu", {
					...s,
					params: { outletId },
					query: everything ? { all: true } : {},
				});
			const [outlets, first] = await Promise.all([loadOutlets(), read(all)]);
			// `all` is for managers and FULL access; anyone else gets the menu as staff see it.
			const res = first.error && all ? await read(false) : first;
			if (res.error || !res.data)
				return failed("fnb-service menu", res.error, []);
			const outlet = outlets.find((o) => o.id === outletId);
			return res.data.data
				.map((m) => toMenuItemRow(m, outlet))
				.filter((m) => all || m.active !== false)
				.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
		},
		categories: async (outletId: string): Promise<CategoryRow[]> => {
			if (!live("fnb")) return give(fnb.demoCategories(outletId));
			const { data: res, error } = await api(
				"@get/fnb/outlets/:outletId/categories",
				{
					...(await withSession()),
					params: { outletId },
				},
			);
			if (error || !res) return failed("fnb-service categories", error, []);
			return res.data
				.map(toCategoryRow)
				.sort((a, b) => a.sortOrder - b.sortOrder);
		},
		happyHours: async (outletId: string): Promise<HappyHourRow[]> => {
			if (!live("fnb"))
				return give(outletId === "bar" ? fnb.demoHappyHours : []);
			const { data: res, error } = await api(
				"@get/fnb/outlets/:outletId/happy-hours",
				{
					...(await withSession()),
					params: { outletId },
				},
			);
			if (error || !res) return failed("fnb-service happy hours", error, []);
			return res.data.map(toHappyHourRow);
		},
		/**
		 * The open board of an outlet (or of every outlet): OPEN, SENT, READY and SERVED orders. With
		 * `status: "CLOSED"` (or "ALL") and a `date`, that day's closed orders (sale done, close shift).
		 */
		orders: async (
			outletId?: string,
			opts: { status?: "CLOSED" | "ALL"; date?: string } = {},
		): Promise<OrderRow[]> => {
			if (!live("fnb")) {
				const closedStatus = (o: OrderRow) =>
					o.status === "CLOSED" || o.status === "CANCELLED";
				return give(
					ops.demoOrders.filter(
						(o) =>
							(!outletId || o.outletId === outletId) &&
							(opts.status === "ALL"
								? true
								: opts.status === "CLOSED"
									? closedStatus(o)
									: !closedStatus(o)),
					),
				);
			}
			const [outlets, res] = await Promise.all([
				loadOutlets(),
				api("@get/fnb/orders", {
					...(await withSession()),
					query: {
						...(outletId ? { outletId } : {}),
						...(opts.status
							? { status: opts.status, date: opts.date ?? lagosDate() }
							: {}),
					},
				}),
			]);
			if (res.error || !res.data)
				return failed("fnb-service orders", res.error, []);
			const names = new Map(outlets.map((o) => [o.id, o.name]));
			return res.data.data
				.map((o) => toOrderRow(o, names.get(o.outletId)))
				.sort((a, b) => a.openedAt.localeCompare(b.openedAt));
		},
		/** What an outlet sold on a day (`/fnb/sales`): the close-shift summary. Null when the service is not reachable. */
		sales: async (
			date?: string,
			outletId?: string,
		): Promise<OutletSalesDayRow | null> => {
			if (!live("fnb"))
				return give({
					...fnb.demoSales,
					outlets: fnb.demoSales.outlets.filter(
						(o) => !outletId || o.outletId === outletId,
					),
				});
			const { data: res, error } = await api("@get/fnb/sales", {
				...(await withSession()),
				query: { date: date ?? lagosDate(), ...(outletId ? { outletId } : {}) },
			});
			if (error || !res) return failed("fnb-service sales", error, null);
			return toSalesDay(res.data);
		},
		/** Outlet sales for the manager and owner screens (`/finance/sales`); sales, not money received. */
		managementSales: async (
			date?: string,
		): Promise<OutletSalesDayRow | null> => {
			if (!live("finance")) return give(fnb.demoSales);
			const { data: res, error } = await api("@get/finance/sales", {
				...(await withSession()),
				query: { date: date ?? lagosDate() },
			});
			if (error || !res) return failed("finance-service sales", error, null);
			return toSalesDay(res.data);
		},
	},
	inventory: {
		stores: async (): Promise<StoreRow[]> => {
			if (!live("inventory")) return give(ops.demoStores);
			const stock = await loadStock();
			return stock ? toStoreRows(stock.stores, stock.rows) : [];
		},
		/** One row per item per store it is kept in, with what is on the shelf now. */
		items: async (): Promise<StockItemRow[]> => {
			if (!live("inventory")) return give(ops.demoStockItems);
			return (await loadStock())?.rows ?? [];
		},
		requests: async (): Promise<StockRequestRow[]> => {
			if (!live("inventory")) return give(ops.demoStockRequests);
			const [res, stock] = await Promise.all([
				api("@get/inventory/requests", { ...(await withSession()), query: {} }),
				loadStock(),
			]);
			if (res.error || !res.data)
				return failed("inventory-service requests", res.error, []);
			return res.data.data.map((r) => toStockRequestRow(r, stock?.items ?? []));
		},
	},
};
