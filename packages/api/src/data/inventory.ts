import "server-only";

/**
 * Inventory and stores (docs/inventory-stores.md in hospio-backend): purchase orders, deliveries, counts,
 * suppliers, transfers, stock value and usage. `data.inventory` in ./index spreads these over the stores,
 * items and requests the outlets read (./fnb). Live when the `inventory` domain is; demo rows otherwise.
 */

import type { z } from "zod";
import { api, errorMessage } from "@hospio/api/api/client";
import type {
	InvCount,
	InvDelivery,
	InvItemDetail,
	InvMovement,
	InvOrder,
	InvSupplier,
	InvTransfer,
	InvUsage,
	InvValue,
} from "@hospio/api/api/routes-inventory";
import { withSession } from "@hospio/api/api/server";
import * as ops from "@hospio/api/demo/fixtures/ops";
import { demoDelay } from "@hospio/api/demo/mode";
import { live } from "./live";
import {
	allPages,
	failedPage,
	type ListQuery,
	type PageResult,
	pageQuery,
	slicePage,
	toPaged,
} from "./paging";
import type {
	DeliveryRow,
	PurchaseOrderRow,
	StockCountRow,
	StockItemDetail,
	StockMovementRow,
	StockTransferRow,
	StockUsage,
	StockValue,
	SupplierRow,
} from "./types";

const give = async <T>(value: T): Promise<T> => {
	await demoDelay(40);
	return value;
};

function failed<T>(what: string, error: unknown, empty: T): T {
	console.error(`${what}:`, error);
	return empty;
}

const n = (v: number | null | undefined) => (typeof v === "number" ? v : 0);
const s = (v: string | null | undefined) => v ?? undefined;

const PO_STATUSES = [
	"DRAFT",
	"PENDING_APPROVAL",
	"SENT",
	"PARTIAL",
	"RECEIVED",
	"CLOSED",
	"CANCELLED",
];
const COUNT_STATUSES = ["OPEN", "COUNTED", "APPROVED", "CANCELLED"];

export function toPurchaseOrderRow(
	o: z.infer<typeof InvOrder>,
): PurchaseOrderRow {
	return {
		id: o.id,
		number: o.number,
		supplierName: o.supplierName ?? "Supplier",
		supplierId: s(o.supplierId),
		storeId: s(o.storeId),
		storeName: s(o.storeName),
		lines: (o.lines ?? []).map((l) => ({
			itemId: l.itemId,
			name: l.name ?? "Item",
			unit: l.unit ?? "pcs",
			quantity: l.quantity,
			unitCost: n(l.unitCost),
			received: n(l.received),
			damaged: n(l.damaged),
		})),
		total: n(o.total),
		receivedValue: n(o.receivedValue),
		status: (PO_STATUSES.includes(o.status)
			? o.status
			: "DRAFT") as PurchaseOrderRow["status"],
		expectedOn: s(o.expectedOn),
		note: s(o.note),
		createdBy: o.createdByName ?? "—",
		createdAt: o.createdAt ?? new Date().toISOString(),
		sentAt: s(o.sentAt),
		sentTo: s(o.sentTo),
		approverLevel: s(o.approverLevel),
		decisionNote: s(o.decisionNote),
		cancelReason: s(o.cancelReason),
	};
}

export function toDeliveryRow(d: z.infer<typeof InvDelivery>): DeliveryRow {
	const items = (d.lines ?? []).map((l) => ({
		itemId: l.itemId,
		name: l.name ?? "Item",
		unit: l.unit ?? "pcs",
		quantity: l.quantity,
		unitCost: n(l.unitCost),
		damaged: n(l.damaged),
		ordered: l.ordered ?? undefined,
		short: n(l.shortQty),
		over: n(l.overQty),
		note: s(l.note),
	}));
	return {
		id: d.id,
		supplierName: d.supplierName ?? "Supplier",
		poNumber: s(d.poNumber),
		purchaseOrderId: s(d.purchaseOrderId),
		storeName: s(d.storeName),
		lines: items.length,
		items,
		total: n(d.total),
		receivedBy: d.receivedByName ?? "—",
		receivedAt: d.receivedAt ?? new Date().toISOString(),
		note: s(d.note),
		invoiceNumber: s(d.invoiceNumber),
		summary: s(d.summary),
	};
}

export function toStockCountRow(c: z.infer<typeof InvCount>): StockCountRow {
	const lines = (c.lines ?? []).map((l) => ({
		itemId: l.itemId,
		name: l.name ?? "Item",
		unit: l.unit ?? "pcs",
		expected: n(l.expected),
		counted: n(l.quantity),
		unitCost: n(l.unitCost),
		value: n(l.value),
	}));
	return {
		id: c.id,
		storeId: c.storeId,
		storeName: c.storeName ?? "Store",
		status: (COUNT_STATUSES.includes(c.status)
			? c.status
			: "OPEN") as StockCountRow["status"],
		startedBy: c.startedByName ?? "—",
		startedAt: c.startedAt ?? new Date().toISOString(),
		lines: lines.length ? lines : undefined,
		variance: lines.length
			? lines.reduce((t, l) => t + (l.counted - l.expected), 0)
			: undefined,
		varianceValue: c.varianceValue ?? undefined,
		note: s(c.note),
		countedBy: s(c.countedByName),
		approvedBy: s(c.approvedByName),
		cancelReason: s(c.cancelReason),
		closedAt: s(c.closedAt),
	};
}

export function toSupplierRow(x: z.infer<typeof InvSupplier>): SupplierRow {
	return {
		id: x.id,
		name: x.name,
		contactName: x.contactName ?? "",
		phone: x.phone ?? "",
		email: s(x.email),
		terms: x.paymentTerms ?? "",
		items: n(x.items),
		itemIds: x.itemIds ?? [],
		lastOrder: s(x.lastOrderAt),
		address: s(x.address),
		notes: s(x.notes),
		active: x.active !== false,
		openOrders: n(x.openOrders),
		spent: n(x.spent),
	};
}

export function toMovementRow(
	m: z.infer<typeof InvMovement>,
): StockMovementRow {
	return {
		id: m.id,
		at: m.at ?? "",
		itemName: m.itemName ?? "Item",
		unit: m.unit ?? "",
		storeName: m.storeName ?? "Store",
		kind: m.kind,
		quantity: m.quantity,
		value: m.value ?? undefined,
		reference: s(m.reference),
		note: s(m.note),
		team: s(m.team),
		by: s(m.byName),
	};
}

export function toItemDetail(
	d: z.infer<typeof InvItemDetail>,
): StockItemDetail {
	return {
		id: d.item.id,
		name: d.item.name,
		category: d.item.category ?? "Other",
		unit: d.item.unit ?? "pcs",
		minLevel: n(d.item.minLevel),
		parLevel: n(d.item.parLevel),
		unitCost: n(d.item.unitCost),
		supplierId: s(d.item.supplierId),
		supplierName: s(d.item.supplierName),
		onHand: n(d.item.onHand),
		levels: d.levels.map((l) => ({
			storeId: l.storeId,
			storeName: l.storeName,
			quantity: l.quantity,
			value: l.value ?? undefined,
		})),
		movements: d.movements.map(toMovementRow),
	};
}

export function toTransferRow(
	t: z.infer<typeof InvTransfer>,
): StockTransferRow {
	return {
		reference: t.reference,
		at: t.at ?? "",
		fromStore: t.fromStore ?? "Store",
		toStore: s(t.toStore),
		team: s(t.team),
		lines: t.lines.map((l) => ({
			name: l.name ?? "Item",
			quantity: l.quantity,
			unit: l.unit ?? "",
		})),
		value: n(t.value),
		by: s(t.byName),
		note: s(t.note),
	};
}

function toValue(v: z.infer<typeof InvValue>): StockValue {
	return {
		total: v.total,
		stores: v.stores.map((x) => ({
			id: x.id,
			name: x.name,
			kind: x.kind ?? "MAIN",
			items: n(x.items),
			lowItems: n(x.lowItems),
			value: n(x.value),
		})),
		low: v.low.map((l) => ({
			itemId: l.itemId,
			name: l.name,
			unit: l.unit ?? "pcs",
			storeId: l.storeId,
			storeName: l.storeName ?? "Store",
			quantity: l.quantity,
			minLevel: n(l.minLevel),
			suggest: n(l.suggest),
			unitCost: n(l.unitCost),
			supplierId: s(l.supplierId),
			supplierName: s(l.supplierName),
		})),
		onOrder: n(v.onOrder),
	};
}

function toUsage(u: z.infer<typeof InvUsage>): StockUsage {
	return {
		...u,
		stores: u.stores.map((x) => ({ ...x, kind: x.kind ?? "MAIN" })),
	};
}

/** A page of a list from inventory-service, or why it didn't load. */
async function pageOf<A, B>(
	what: string,
	call: Promise<{
		data: { data: Parameters<typeof toPaged<A, B>>[0] } | null;
		error: unknown;
	}>,
	map: (a: A) => B,
	size?: number,
): Promise<PageResult<B>> {
	const { data, error } = await call;
	if (error || !data) {
		console.error(`inventory-service ${what}:`, error);
		return failedPage(errorMessage(error, `Couldn't load ${what}`), size);
	}
	return { ok: true, data: toPaged(data.data, map) };
}

/** Demo rows as a page, filtered the way the service would (status list and text). */
function demoPage<T extends { status?: string }>(
	rows: T[],
	q: ListQuery,
	text: (r: T) => string,
): PageResult<T> {
	const statuses = q.status ? q.status.split(",") : null;
	const needle = q.q?.toLowerCase();
	const base = rows.filter(
		(r) => !needle || text(r).toLowerCase().includes(needle),
	);
	const counts: Record<string, number> = { all: base.length };
	for (const r of base)
		if (r.status) counts[r.status] = (counts[r.status] ?? 0) + 1;
	return {
		ok: true,
		data: slicePage(
			base.filter((r) => !statuses || statuses.includes(r.status ?? "")),
			q.page ?? 0,
			q.size ?? 25,
			{ counts },
		),
	};
}

export const inventoryData = {
	/** Purchase orders, newest first, one page; `counts` per status over the whole filtered range. */
	purchaseOrdersPage: async (
		q: ListQuery & { supplierId?: string } = {},
	): Promise<PageResult<PurchaseOrderRow>> => {
		if (!live("inventory"))
			return give(
				demoPage(
					ops.demoPurchaseOrders,
					q,
					(o) => `${o.number} ${o.supplierName}`,
				),
			);
		return pageOf(
			"purchase orders",
			api("@get/inventory/purchase-orders", {
				...(await withSession()),
				query: pageQuery(q),
			}),
			toPurchaseOrderRow,
			q.size,
		);
	},
	/**
	 * Every purchase order in some statuses (a comma list: the open ones the stock and deliveries screens
	 * need are few), read page by page so none is dropped.
	 */
	purchaseOrders: async (
		status = "DRAFT,PENDING_APPROVAL,SENT,PARTIAL",
		extra: { supplierId?: string } = {},
	): Promise<PurchaseOrderRow[]> => {
		if (!live("inventory"))
			return give(
				ops.demoPurchaseOrders.filter((o) =>
					status.split(",").includes(o.status),
				),
			);
		const s = await withSession();
		const all = await allPages(async (page, size) => {
			const { data, error } = await api("@get/inventory/purchase-orders", {
				...s,
				query: pageQuery({ status, ...extra, page, size }),
			});
			return error || !data ? null : toPaged(data.data, toPurchaseOrderRow);
		});
		if (!all.ok) console.error("inventory-service purchase orders: failed");
		return all.rows;
	},
	/** One purchase order with the deliveries received against it. */
	purchaseOrder: async (id: string): Promise<PurchaseOrderRow | null> => {
		if (!live("inventory"))
			return give(ops.demoPurchaseOrders.find((o) => o.id === id) ?? null);
		const { data, error } = await api("@get/inventory/purchase-orders/:id", {
			...(await withSession()),
			params: { id },
		});
		if (error || !data)
			return failed("inventory-service purchase order", error, null);
		return toPurchaseOrderRow(data.data);
	},
	/** Deliveries, newest first, one page; `totals.value` over the whole filtered range. */
	deliveriesPage: async (
		q: ListQuery & { purchaseOrderId?: string } = {},
	): Promise<PageResult<DeliveryRow>> => {
		if (!live("inventory"))
			return give(
				demoPage(
					ops.demoDeliveries as (DeliveryRow & { status?: string })[],
					q,
					(d) => `${d.supplierName} ${d.poNumber ?? ""}`,
				),
			);
		return pageOf(
			"deliveries",
			api("@get/inventory/deliveries", {
				...(await withSession()),
				query: pageQuery(q),
			}),
			toDeliveryRow,
			q.size,
		);
	},
	/** Stock counts, newest first, one page; `counts` per status. */
	countsPage: async (
		q: ListQuery & { storeId?: string } = {},
	): Promise<PageResult<StockCountRow>> => {
		if (!live("inventory"))
			return give(demoPage(ops.demoStockCounts, q, (c) => c.storeName));
		return pageOf(
			"stock counts",
			api("@get/inventory/counts", {
				...(await withSession()),
				query: pageQuery(q),
			}),
			toStockCountRow,
			q.size,
		);
	},
	/** The counts still in progress (open or counted, waiting for approval): at most one per store. */
	openCounts: async (): Promise<StockCountRow[]> => {
		if (!live("inventory"))
			return give(
				ops.demoStockCounts.filter(
					(c) => c.status === "OPEN" || c.status === "COUNTED",
				),
			);
		const s = await withSession();
		const all = await allPages(async (page, size) => {
			const { data, error } = await api("@get/inventory/counts", {
				...s,
				query: pageQuery({ status: "ACTIVE", page, size }),
			});
			return error || !data ? null : toPaged(data.data, toStockCountRow);
		});
		return all.rows;
	},
	suppliers: async (): Promise<SupplierRow[]> => {
		if (!live("inventory")) return give(ops.demoSuppliers);
		const { data, error } = await api(
			"@get/inventory/suppliers",
			await withSession(),
		);
		if (error || !data) return failed("inventory-service suppliers", error, []);
		return data.data.map(toSupplierRow);
	},
	/** Stock value per store, low items with a reorder suggestion, value still on order. Null when it can't be read. */
	value: async (): Promise<StockValue | null> => {
		if (!live("inventory")) return null;
		const { data, error } = await api(
			"@get/inventory/value",
			await withSession(),
		);
		if (error || !data) return failed("inventory-service value", error, null);
		return toValue(data.data);
	},
	/** Stock received, issued, used and wasted at cost for a date range (yyyy-MM-dd, Lagos days). */
	usage: async (from?: string, to?: string): Promise<StockUsage | null> => {
		if (!live("inventory")) return null;
		const query: { from?: string; to?: string } = {};
		if (from) query.from = from;
		if (to) query.to = to;
		const { data, error } = await api("@get/inventory/usage", {
			...(await withSession()),
			query,
		});
		if (error || !data) return failed("inventory-service usage", error, null);
		return toUsage(data.data);
	},
	transfers: async (
		from?: string,
		to?: string,
	): Promise<StockTransferRow[]> => {
		if (!live("inventory")) return [];
		const query: { from?: string; to?: string } = {};
		if (from) query.from = from;
		if (to) query.to = to;
		const { data, error } = await api("@get/inventory/transfers", {
			...(await withSession()),
			query,
		});
		if (error || !data) return failed("inventory-service transfers", error, []);
		return data.data.map(toTransferRow);
	},
};
