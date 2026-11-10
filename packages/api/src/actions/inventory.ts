"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import type { Delivery } from "@hospio/api/api/routes-admin";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import {
	toDeliveryRow,
	toItemDetail,
	toPurchaseOrderRow,
	toStockCountRow,
	toSupplierRow,
	toTransferRow,
} from "@hospio/api/data/inventory";
import { live } from "@hospio/api/data/live";
import type {
	DeliveryRow,
	PurchaseOrderRow,
	StockCountRow,
	StockItemDetail,
	SupplierRow,
	StockTransferRow,
} from "@hospio/api/data/types";
import { revalidateOps } from "./ops-helpers";

/**
 * The store's writes (docs/inventory-stores.md in hospio-backend): stores, items, levels, moves between
 * stores, issuing and declining requests, suppliers, purchase orders, deliveries and counts. Every one
 * goes to inventory-service; there is no demo path that pretends to succeed.
 */

const NOT_LIVE: ActionResult<never> = {
	ok: false,
	error: "Inventory isn't connected in demo mode",
};

type Line = {
	itemId: string;
	quantity: number;
	unitCost?: number | null;
	damaged?: number | null;
	note?: string | null;
};

type Answer = { data: { data: unknown } | null; error: unknown };

async function call<R extends Answer>(
	promise: Promise<R>,
	fallback: string,
): Promise<ActionResult<NonNullable<R["data"]>["data"]>> {
	const { data, error } = await promise;
	if (error || !data)
		return { ok: false, error: errorMessage(error, fallback) };
	revalidateOps();
	return { ok: true, data: data.data as NonNullable<R["data"]>["data"] };
}

const clean = (v?: string | null) => (v?.trim() ? v.trim() : null);

// ---- stores and items

export async function saveStore(input: {
	id?: string;
	name: string;
	kind: string;
	active?: boolean;
}): Promise<ActionResult<{ id: string }>> {
	if (!live("inventory")) return NOT_LIVE;
	const s = await withSession();
	const body = {
		name: input.name.trim(),
		kind: input.kind,
		active: input.active ?? null,
	};
	const r = input.id
		? await call(
				api("@put/inventory/stores/:id", {
					...s,
					params: { id: input.id },
					body,
				}),
				"The store could not be saved",
			)
		: await call(
				api("@post/inventory/stores", { ...s, body }),
				"The store could not be added",
			);
	return r.ok ? { ok: true, data: { id: r.data.id } } : r;
}

export async function saveItem(input: {
	id?: string;
	name: string;
	category?: string;
	unit?: string;
	minLevel?: number;
	parLevel?: number;
	unitCost?: number;
	supplierId?: string;
	active?: boolean;
	storeId?: string;
	openingQuantity?: number;
}): Promise<ActionResult<{ id: string }>> {
	if (!live("inventory")) return NOT_LIVE;
	const s = await withSession();
	const body = {
		name: input.name.trim(),
		category: clean(input.category),
		unit: clean(input.unit),
		minLevel: input.minLevel ?? null,
		parLevel: input.parLevel ?? null,
		unitCost: input.unitCost ?? null,
		supplierId: input.supplierId ?? null,
		active: input.active ?? null,
	};
	const r = input.id
		? await call(
				api("@put/inventory/items/:id", {
					...s,
					params: { id: input.id },
					body,
				}),
				"The item could not be saved",
			)
		: await call(
				api("@post/inventory/items", {
					...s,
					body: {
						...body,
						storeId: input.storeId ?? null,
						openingQuantity: input.openingQuantity ?? null,
					},
				}),
				"The item could not be added",
			);
	return r.ok ? { ok: true, data: { id: r.data.id } } : r;
}

/** The item with its level in every store and its last movements (the item panel). */
export async function loadItemDetail(
	id: string,
): Promise<ActionResult<StockItemDetail>> {
	if (!live("inventory")) return NOT_LIVE;
	const { data, error } = await api("@get/inventory/items/:id", {
		...(await withSession()),
		params: { id },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The item could not be loaded"),
		};
	return { ok: true, data: toItemDetail(data.data) };
}

export async function adjustLevel(input: {
	itemId: string;
	storeId: string;
	quantity: number;
	reason: string;
}): Promise<ActionResult<{ quantity: number }>> {
	if (!live("inventory")) return NOT_LIVE;
	return call(
		api("@post/inventory/levels/adjust", {
			...(await withSession()),
			body: input,
		}),
		"The level could not be corrected",
	);
}

export async function transferStock(input: {
	fromStoreId: string;
	toStoreId: string;
	lines: Line[];
	note?: string;
}): Promise<ActionResult<StockTransferRow>> {
	if (!live("inventory")) return NOT_LIVE;
	const r = await call(
		api("@post/inventory/transfers", {
			...(await withSession()),
			body: { ...input, note: clean(input.note) },
		}),
		"The stock could not be moved",
	);
	return r.ok ? { ok: true, data: toTransferRow(r.data) } : r;
}

// ---- requests

export async function issueRequest(input: {
	id: string;
	storeId: string;
	lines?: Line[];
}): Promise<ActionResult<{ status: string }>> {
	if (!live("inventory")) return NOT_LIVE;
	const r = await call(
		api("@post/inventory/requests/:id/issue", {
			...(await withSession()),
			params: { id: input.id },
			body: { storeId: input.storeId, lines: input.lines ?? null },
		}),
		"The request could not be issued",
	);
	return r.ok ? { ok: true, data: { status: r.data.status } } : r;
}

export async function declineRequest(input: {
	id: string;
	reason: string;
}): Promise<ActionResult<{ status: string }>> {
	if (!live("inventory")) return NOT_LIVE;
	const r = await call(
		api("@post/inventory/requests/:id/decline", {
			...(await withSession()),
			params: { id: input.id },
			body: { reason: input.reason.trim() },
		}),
		"The request could not be declined",
	);
	return r.ok ? { ok: true, data: { status: r.data.status } } : r;
}

// ---- suppliers

export async function saveSupplier(input: {
	id?: string;
	name: string;
	contactName?: string;
	phone?: string;
	email?: string;
	paymentTerms?: string;
	address?: string;
	notes?: string;
	active?: boolean;
	itemIds?: string[];
}): Promise<ActionResult<SupplierRow>> {
	if (!live("inventory")) return NOT_LIVE;
	const s = await withSession();
	const body = {
		name: input.name.trim(),
		contactName: clean(input.contactName),
		phone: clean(input.phone),
		email: clean(input.email),
		paymentTerms: clean(input.paymentTerms),
		address: clean(input.address),
		notes: clean(input.notes),
		active: input.active ?? null,
		itemIds: input.itemIds ?? null,
	};
	const r = input.id
		? await call(
				api("@put/inventory/suppliers/:id", {
					...s,
					params: { id: input.id },
					body,
				}),
				"The supplier could not be saved",
			)
		: await call(
				api("@post/inventory/suppliers", { ...s, body }),
				"The supplier could not be added",
			);
	return r.ok ? { ok: true, data: toSupplierRow(r.data) } : r;
}

// ---- purchase orders

export type OrderResult = PurchaseOrderRow & { deliveries?: Delivery[] | null };

function withSent(o: Parameters<typeof toPurchaseOrderRow>[0]): OrderResult {
	return { ...toPurchaseOrderRow(o), deliveries: o.sent ?? null };
}

export async function saveOrder(input: {
	id?: string;
	supplierId: string;
	storeId?: string;
	lines: Line[];
	expectedOn?: string;
	note?: string;
	submit: boolean;
}): Promise<ActionResult<OrderResult>> {
	if (!live("inventory")) return NOT_LIVE;
	const s = await withSession();
	const body = {
		supplierId: input.supplierId,
		storeId: input.storeId ?? null,
		lines: input.lines,
		expectedOn: input.expectedOn || null,
		note: clean(input.note),
		submit: input.submit,
	};
	const r = input.id
		? await call(
				api("@put/inventory/purchase-orders/:id", {
					...s,
					params: { id: input.id },
					body,
				}),
				"The order could not be saved",
			)
		: await call(
				api("@post/inventory/purchase-orders", { ...s, body }),
				"The order could not be saved",
			);
	return r.ok ? { ok: true, data: withSent(r.data) } : r;
}

/** One purchase order with the deliveries received against it (the order panel, and a link to an order not on this page). */
export async function loadPurchaseOrder(
	id: string,
): Promise<ActionResult<PurchaseOrderRow & { deliveries: DeliveryRow[] }>> {
	if (!live("inventory")) return NOT_LIVE;
	const { data, error } = await api("@get/inventory/purchase-orders/:id", {
		...(await withSession()),
		params: { id },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The order could not be loaded"),
		};
	return {
		ok: true,
		data: {
			...toPurchaseOrderRow(data.data),
			deliveries: (data.data.deliveries ?? []).map(toDeliveryRow),
		},
	};
}

export async function submitOrder(
	id: string,
): Promise<ActionResult<OrderResult>> {
	if (!live("inventory")) return NOT_LIVE;
	const r = await call(
		api("@post/inventory/purchase-orders/:id/submit", {
			...(await withSession()),
			params: { id },
		}),
		"The order could not be sent",
	);
	return r.ok ? { ok: true, data: withSent(r.data) } : r;
}

export async function cancelOrder(input: {
	id: string;
	reason: string;
}): Promise<ActionResult<OrderResult>> {
	if (!live("inventory")) return NOT_LIVE;
	const r = await call(
		api("@post/inventory/purchase-orders/:id/cancel", {
			...(await withSession()),
			params: { id: input.id },
			body: { reason: input.reason.trim() },
		}),
		"The order could not be cancelled",
	);
	return r.ok ? { ok: true, data: withSent(r.data) } : r;
}

export async function closeOrder(input: {
	id: string;
	reason: string;
}): Promise<ActionResult<OrderResult>> {
	if (!live("inventory")) return NOT_LIVE;
	const r = await call(
		api("@post/inventory/purchase-orders/:id/close", {
			...(await withSession()),
			params: { id: input.id },
			body: { reason: input.reason.trim() },
		}),
		"The order could not be closed",
	);
	return r.ok ? { ok: true, data: withSent(r.data) } : r;
}

// ---- deliveries

export async function receiveDelivery(input: {
	purchaseOrderId?: string;
	supplierName?: string;
	storeId?: string;
	invoiceNumber?: string;
	lines: Line[];
	note?: string;
}): Promise<ActionResult<DeliveryRow>> {
	if (!live("inventory")) return NOT_LIVE;
	const r = await call(
		api("@post/inventory/deliveries", {
			...(await withSession()),
			body: {
				purchaseOrderId: input.purchaseOrderId ?? null,
				supplierName: clean(input.supplierName),
				storeId: input.storeId ?? null,
				invoiceNumber: clean(input.invoiceNumber),
				lines: input.lines,
				note: clean(input.note),
			},
		}),
		"The delivery could not be received",
	);
	return r.ok ? { ok: true, data: toDeliveryRow(r.data) } : r;
}

// ---- counts

export async function startCount(
	storeId: string,
): Promise<ActionResult<StockCountRow>> {
	if (!live("inventory")) return NOT_LIVE;
	const { data, error } = await api("@post/inventory/counts", {
		...(await withSession()),
		body: { storeId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The count could not be started"),
		};
	revalidateOps();
	return {
		ok: true,
		data: {
			id: data.data.id,
			storeName: "",
			status: "OPEN",
			startedBy: "",
			startedAt: new Date().toISOString(),
		},
	};
}

export async function submitCount(input: {
	id: string;
	lines: { itemId: string; quantity: number }[];
	note?: string;
}): Promise<ActionResult<{ id: string }>> {
	if (!live("inventory")) return NOT_LIVE;
	const { data, error } = await api("@put/inventory/counts/:id", {
		...(await withSession()),
		params: { id: input.id },
		body: { lines: input.lines, note: clean(input.note) },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The count could not be submitted"),
		};
	revalidateOps();
	return { ok: true, data: { id: data.data.id } };
}

export async function approveCount(
	id: string,
): Promise<ActionResult<StockCountRow>> {
	if (!live("inventory")) return NOT_LIVE;
	const r = await call(
		api("@post/inventory/counts/:id/approve", {
			...(await withSession()),
			params: { id },
		}),
		"The count could not be approved",
	);
	return r.ok ? { ok: true, data: toStockCountRow(r.data) } : r;
}

export async function cancelCount(input: {
	id: string;
	reason: string;
}): Promise<ActionResult<StockCountRow>> {
	if (!live("inventory")) return NOT_LIVE;
	const r = await call(
		api("@post/inventory/counts/:id/cancel", {
			...(await withSession()),
			params: { id: input.id },
			body: { reason: input.reason.trim() },
		}),
		"The count could not be cancelled",
	);
	return r.ok ? { ok: true, data: toStockCountRow(r.data) } : r;
}
