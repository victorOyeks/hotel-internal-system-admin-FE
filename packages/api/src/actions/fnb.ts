"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import {
	serializeOptionGroups,
	toCategoryRow,
	toHappyHourRow,
	toMenuItemRow,
	toOrderRow,
	toOutletRow,
	toTableRow,
} from "@hospio/api/data/mappers/fnb";
import type {
	CategoryRow,
	HappyHourRow,
	MenuItemRow,
	OptionGroup,
	OrderRow,
	OutletRow,
	TableRow,
} from "@hospio/api/data/types";
import { demoDelay } from "@hospio/api/demo/mode";
import { revalidateOps } from "./ops-helpers";

/**
 * Restaurant and bar writes (docs/restaurant-bar.md in hospio-backend): orders and tabs, the kitchen
 * board, menus and prices, Hotel setup outlets and tables, and the stock the outlets use. In demo mode
 * the call is echoed back after a short pause (an order is built from what the screen sent, a change to
 * an existing order answers null and the screen applies it locally), so the screens behave the same.
 * When fnb-service refuses (tab limit, nobody checked in to the room, …) its sentence is the error.
 */

const fnbLive = () => live("fnb");

// ---- orders -------------------------------------------------------------------------------------------

export type OrderLineInput = {
	menuItemId: string;
	name: string;
	price: number;
	quantity: number;
	/** What the guest chose, as text ("Grilled, Hot"). */
	options?: string;
	notes?: string;
};

export type NewOrderInput = {
	outletId: string;
	outletName: string;
	kind: OrderRow["kind"];
	tableId?: string;
	tableNo?: string;
	roomId?: string;
	roomNumber?: string;
	guestName?: string;
	notes?: string;
	lines: OrderLineInput[];
	/** Send the ticket to the kitchen right away (the restaurant); a bar sale is not sent. */
	send?: boolean;
	/** For the demo's own numbering and name on the ticket. */
	openedBy?: string;
	vatPct?: number;
	pricesIncludeTax?: boolean;
};

function demoOrder(input: NewOrderInput): OrderRow {
	const subtotal = input.lines.reduce((s, l) => s + l.price * l.quantity, 0);
	const vat = input.vatPct ?? 7.5;
	const included = input.pricesIncludeTax !== false;
	const tax = included
		? Math.round((subtotal * vat) / (100 + vat))
		: Math.round((subtotal * vat) / 100);
	const sent = !!input.send;
	return {
		id: `or-${Date.now()}`,
		number: `${input.outletName.slice(0, 1).toUpperCase()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
		outlet: input.outletName,
		outletId: input.outletId,
		kind: input.kind,
		tableId: input.tableId,
		tableNo: input.tableNo,
		roomId: input.roomId,
		roomNumber: input.roomNumber,
		guestName: input.guestName,
		status: sent ? "SENT" : "OPEN",
		lines: input.lines.map((l, i) => ({
			id: `ol-${Date.now()}-${i}`,
			menuItemId: l.menuItemId,
			name: l.name,
			qty: l.quantity,
			price: l.price,
			options: l.options,
			notes: l.notes,
			status: sent ? "SENT" : "NEW",
		})),
		subtotal: included ? subtotal - tax : subtotal,
		tax,
		total: included ? subtotal : subtotal + tax,
		paid: false,
		chargedToRoom: false,
		openedBy: input.openedBy ?? "You",
		openedAt: new Date().toISOString(),
		sentAt: sent ? new Date().toISOString() : undefined,
	};
}

const lineBody = (l: OrderLineInput) => ({
	menuItemId: l.menuItemId,
	quantity: l.quantity,
	options: l.options ?? null,
	notes: l.notes ?? null,
});

/** Start an order, sale or tab with its first lines; with `send` the ticket goes to the kitchen at once. */
export async function startOrder(
	input: NewOrderInput,
): Promise<ActionResult<OrderRow>> {
	if (!fnbLive()) {
		await demoDelay(400);
		return { ok: true, data: demoOrder(input) };
	}
	const s = await withSession();
	const created = await api("@post/fnb/orders", {
		...s,
		body: {
			outletId: input.outletId,
			kind: input.kind,
			tableId: input.tableId ?? null,
			roomId: input.roomId ?? null,
			guestName: input.guestName ?? null,
			notes: input.notes ?? null,
			lines: input.lines.map(lineBody),
		},
	});
	if (created.error || !created.data)
		return {
			ok: false,
			error: errorMessage(created.error, "The order could not be started"),
		};
	let order = created.data.data;
	if (input.send) {
		const sent = await api("@post/fnb/orders/:id/send", {
			...s,
			params: { id: order.id },
		});
		if (sent.error || !sent.data)
			return {
				ok: false,
				error: `${order.number} was started but the ticket was not sent: ${errorMessage(sent.error)}. Find it on the board.`,
			};
		order = sent.data.data;
	}
	revalidateOps();
	return { ok: true, data: toOrderRow(order, input.outletName) };
}

/** Add lines to an order or a tab. A tab over the limit is refused with the service's own sentence. */
export async function addOrderLines(
	orderId: string,
	lines: OrderLineInput[],
	outletName?: string,
): Promise<ActionResult<OrderRow | null>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const s = await withSession();
	let latest: Parameters<typeof toOrderRow>[0] | null = null;
	for (const l of lines) {
		const { data, error } = await api("@post/fnb/orders/:id/lines", {
			...s,
			params: { id: orderId },
			body: lineBody(l),
		});
		if (error || !data)
			return {
				ok: false,
				error: errorMessage(error, "The items could not be added"),
			};
		latest = data.data;
	}
	revalidateOps();
	return { ok: true, data: latest ? toOrderRow(latest, outletName) : null };
}

/** Send the ticket: every new line goes to the kitchen. */
export async function sendOrder(
	orderId: string,
	outletName?: string,
): Promise<ActionResult<OrderRow | null>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const { data, error } = await api("@post/fnb/orders/:id/send", {
		...(await withSession()),
		params: { id: orderId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The ticket could not be sent"),
		};
	revalidateOps();
	return { ok: true, data: toOrderRow(data.data, outletName) };
}

/**
 * One dish ready or served. Pass every line id to mark the whole ticket: the service moves the order to
 * READY when every live line is ready and to SERVED when all are served.
 */
export async function setLinesStatus(
	orderId: string,
	lineIds: string[],
	status: "READY" | "SERVED",
	outletName?: string,
): Promise<ActionResult<OrderRow | null>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const s = await withSession();
	let last: Parameters<typeof toOrderRow>[0] | null = null;
	for (const lineId of lineIds) {
		const { data, error } = await api(
			"@put/fnb/orders/:id/lines/:lineId/status",
			{
				...s,
				params: { id: orderId, lineId },
				query: { status },
			},
		);
		if (error || !data)
			return {
				ok: false,
				error: errorMessage(
					error,
					status === "READY"
						? "The dish could not be marked ready"
						: "The dish could not be marked served",
				),
			};
		last = data.data;
	}
	revalidateOps();
	return { ok: true, data: last ? toOrderRow(last, outletName) : null };
}

/** Close a settled order (the ticket is done). The service refuses an order that is not paid or on a room. */
export async function closeOrder(
	orderId: string,
	outletName?: string,
): Promise<ActionResult<OrderRow | null>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const { data, error } = await api("@put/fnb/orders/:id/status", {
		...(await withSession()),
		params: { id: orderId },
		query: { status: "CLOSED" },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The order could not be closed"),
		};
	revalidateOps();
	return { ok: true, data: toOrderRow(data.data, outletName) };
}

export async function cancelOrderLine(
	orderId: string,
	lineId: string,
	reason: string,
	outletName?: string,
): Promise<ActionResult<OrderRow | null>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const { data, error } = await api(
		"@post/fnb/orders/:id/lines/:lineId/cancel",
		{
			...(await withSession()),
			params: { id: orderId, lineId },
			body: { reason },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The item could not be cancelled"),
		};
	revalidateOps();
	return { ok: true, data: toOrderRow(data.data, outletName) };
}

export async function cancelOrder(
	orderId: string,
	reason: string,
	outletName?: string,
): Promise<ActionResult<OrderRow | null>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const { data, error } = await api("@post/fnb/orders/:id/cancel", {
		...(await withSession()),
		params: { id: orderId },
		body: { reason },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The order could not be cancelled"),
		};
	revalidateOps();
	return { ok: true, data: toOrderRow(data.data, outletName) };
}

/**
 * Charge an order or a tab to a guest's room. fnb-service checks the room has an active stay and an open
 * folio and answers "Nobody is checked in to room X" / "Room X has no open bill" otherwise.
 */
export async function chargeOrderToRoom(
	orderId: string,
	roomId?: string,
	outletName?: string,
): Promise<ActionResult<OrderRow | null>> {
	if (!fnbLive()) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { data, error } = await api("@post/fnb/orders/:id/charge-to-room", {
		...(await withSession()),
		params: { id: orderId },
		query: roomId ? { roomId } : {},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The order could not be charged to the room"),
		};
	revalidateOps();
	return { ok: true, data: toOrderRow(data.data, outletName) };
}

export async function moveTab(
	orderId: string,
	tableId: string,
	outletName?: string,
): Promise<ActionResult<OrderRow | null>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const { data, error } = await api("@post/fnb/orders/:id/move-table", {
		...(await withSession()),
		params: { id: orderId },
		query: { tableId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The tab could not be moved"),
		};
	revalidateOps();
	return { ok: true, data: toOrderRow(data.data, outletName) };
}

/** Read one order again, e.g. after a payment, to see whether the service has settled it. */
export async function readOrder(
	orderId: string,
	outletName?: string,
): Promise<ActionResult<OrderRow | null>> {
	if (!fnbLive()) return { ok: true, data: null };
	const { data, error } = await api("@get/fnb/orders/:id", {
		...(await withSession()),
		params: { id: orderId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The order could not be read"),
		};
	return { ok: true, data: toOrderRow(data.data, outletName) };
}

// ---- menu and prices ----------------------------------------------------------------------------------

/** Mark an item sold out, or bring it back. Takes effect at once. */
export async function setItemAvailable(
	itemId: string,
	available: boolean,
): Promise<ActionResult<{ id: string; available: boolean }>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return { ok: true, data: { id: itemId, available } };
	}
	const { data, error } = await api("@put/fnb/menu/:id/available", {
		...(await withSession()),
		params: { id: itemId },
		query: { available },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The menu could not be changed"),
		};
	revalidateOps();
	return { ok: true, data: { id: itemId, available } };
}

export type PriceChangeResult =
	| { status: "CHANGED"; price: number }
	| { status: "PENDING_APPROVAL"; price: number; requestId?: string };

/**
 * Change a price. A manager or FULL access changes it at once; anyone else gets 202 PENDING_APPROVAL
 * and the old price stays until the manager decides (Approvals).
 */
export async function changeItemPrice(
	itemId: string,
	newPrice: number,
	reason: string,
): Promise<ActionResult<PriceChangeResult>> {
	if (!fnbLive()) {
		await demoDelay(400);
		return { ok: true, data: { status: "PENDING_APPROVAL", price: newPrice } };
	}
	const { data, error } = await api("@put/fnb/menu/:id/price", {
		...(await withSession()),
		params: { id: itemId },
		body: { newPrice, reason: reason.trim() || null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The price could not be changed"),
		};
	revalidateOps();
	const answer = data.data as {
		status?: string;
		requestId?: string | null;
		price?: number;
	};
	if (answer.status === "PENDING_APPROVAL")
		return {
			ok: true,
			data: {
				status: "PENDING_APPROVAL",
				price: newPrice,
				requestId: answer.requestId ?? undefined,
			},
		};
	return {
		ok: true,
		data: {
			status: "CHANGED",
			price: typeof answer.price === "number" ? answer.price : newPrice,
		},
	};
}

export type MenuItemInput = {
	category: string;
	name: string;
	description?: string;
	price: number;
	options: OptionGroup[];
	recipe: { stockItemId: string; quantity: number }[];
	active: boolean;
	sortOrder?: number;
};

/** Add or edit a dish or drink: choices as JSON, the recipe per portion, and whether it is on the menu. */
export async function saveMenuItem(
	outlet: { id: string; name: string },
	id: string | undefined,
	input: MenuItemInput,
): Promise<ActionResult<MenuItemRow>> {
	if (!fnbLive()) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: id ?? `mi-new-${Date.now()}`,
				outletId: outlet.id,
				outlet: outlet.name,
				category: input.category,
				name: input.name,
				price: input.price,
				available: true,
				active: input.active,
				description: input.description,
				options: input.options.flatMap((g) => g.choices.map((c) => c.name)),
				optionGroups: input.options.length ? input.options : undefined,
				recipe: input.recipe.length ? input.recipe : undefined,
			},
		};
	}
	const body = {
		category: input.category,
		name: input.name,
		description: input.description?.trim() || null,
		price: input.price,
		options: serializeOptionGroups(input.options),
		recipe: input.recipe,
		sortOrder: input.sortOrder ?? null,
		active: input.active,
	};
	const s = await withSession();
	const { data, error } = id
		? await api("@put/fnb/outlets/:outletId/menu/:id", {
				...s,
				params: { outletId: outlet.id, id },
				body,
			})
		: await api("@post/fnb/outlets/:outletId/menu", {
				...s,
				params: { outletId: outlet.id },
				body,
			});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The item could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: toMenuItemRow(data.data, outlet) };
}

export async function saveCategory(
	outletId: string,
	id: string | undefined,
	input: { name: string; sortOrder?: number; active?: boolean },
): Promise<ActionResult<CategoryRow>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return {
			ok: true,
			data: {
				id: id ?? `cat-${Date.now()}`,
				name: input.name,
				sortOrder: input.sortOrder ?? 0,
				active: input.active !== false,
			},
		};
	}
	const body = {
		name: input.name,
		sortOrder: input.sortOrder ?? null,
		active: input.active ?? null,
	};
	const s = await withSession();
	const { data, error } = id
		? await api("@put/fnb/outlets/:outletId/categories/:id", {
				...s,
				params: { outletId, id },
				body,
			})
		: await api("@post/fnb/outlets/:outletId/categories", {
				...s,
				params: { outletId },
				body,
			});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The category could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: toCategoryRow(data.data) };
}

export async function saveHappyHour(
	outletId: string,
	id: string | undefined,
	input: {
		name: string;
		from: string;
		to: string;
		days: string;
		discountPct: number;
		active: boolean;
	},
): Promise<ActionResult<HappyHourRow>> {
	if (!fnbLive()) {
		await demoDelay(400);
		return { ok: true, data: { id: id ?? `hh-${Date.now()}`, ...input } };
	}
	const body = {
		name: input.name,
		fromTime: input.from,
		toTime: input.to,
		days: input.days,
		discountPct: input.discountPct,
		active: input.active,
	};
	const s = await withSession();
	const { data, error } = id
		? await api("@put/fnb/outlets/:outletId/happy-hours/:id", {
				...s,
				params: { outletId, id },
				body,
			})
		: await api("@post/fnb/outlets/:outletId/happy-hours", {
				...s,
				params: { outletId },
				body,
			});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The happy hour could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: toHappyHourRow(data.data) };
}

// ---- Hotel setup: outlets and tables ------------------------------------------------------------------

export async function saveOutlet(
	id: string | undefined,
	input: {
		name: string;
		kind: OutletRow["kind"];
		storeId?: string;
		status: OutletRow["status"];
	},
	tables: TableRow[] = [],
): Promise<ActionResult<OutletRow>> {
	if (!fnbLive()) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: id ?? `out-${Date.now()}`,
				name: input.name,
				kind: input.kind,
				status: input.status,
				storeId: input.storeId,
				tables,
			},
		};
	}
	const body = {
		name: input.name,
		kind: input.kind,
		storeId: input.storeId ?? null,
		status: input.status,
	};
	const s = await withSession();
	const { data, error } = id
		? await api("@put/fnb/outlets/:id", { ...s, params: { id }, body })
		: await api("@post/fnb/outlets", { ...s, body });
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The outlet could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: toOutletRow(data.data, []) };
}

export async function saveTable(
	outletId: string,
	id: string | undefined,
	input: { number: string; seats: number; active: boolean },
): Promise<ActionResult<TableRow>> {
	if (!fnbLive()) {
		await demoDelay(300);
		return {
			ok: true,
			data: { id: id ?? `tbl-${Date.now()}`, outletId, ...input },
		};
	}
	const s = await withSession();
	const { data, error } = id
		? await api("@put/fnb/outlets/:outletId/tables/:id", {
				...s,
				params: { outletId, id },
				body: input,
			})
		: await api("@post/fnb/outlets/:outletId/tables", {
				...s,
				params: { outletId },
				body: input,
			});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The table could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: toTableRow(data.data, outletId) };
}

// ---- stock the outlets use ----------------------------------------------------------------------------

/** Stock used in service, or written off (waste, breakage) with the reason in the note. */
export async function useOrWasteStock(input: {
	itemId: string;
	storeId: string;
	quantity: number;
	waste: boolean;
	note?: string;
}): Promise<ActionResult<{ quantity: number }>> {
	if (!live("inventory")) {
		await demoDelay(300);
		return { ok: true, data: { quantity: -1 } };
	}
	const { data, error } = await api("@post/inventory/levels/use", {
		...(await withSession()),
		body: {
			itemId: input.itemId,
			storeId: input.storeId,
			quantity: input.quantity,
			waste: input.waste,
			note: input.note?.trim() || null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				input.waste
					? "The write-off could not be recorded"
					: "The use could not be recorded",
			),
		};
	revalidateOps();
	return { ok: true, data: { quantity: data.data.quantity } };
}

/** A request to the main store; it shows on Inventory's Requests with the team and the store it is for. */
export async function askTheStore(input: {
	fromTeam: "KITCHEN" | "BAR";
	storeId?: string;
	lines: { itemId: string; name: string; quantity: number }[];
	note?: string;
}): Promise<ActionResult<{ id: string }>> {
	if (!live("inventory")) {
		await demoDelay(400);
		return { ok: true, data: { id: `rq-${Date.now()}` } };
	}
	const { data, error } = await api("@post/inventory/requests", {
		...(await withSession()),
		body: {
			fromTeam: input.fromTeam,
			storeId: input.storeId ?? null,
			lines: input.lines,
			note: input.note?.trim() || null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The request could not be sent"),
		};
	revalidateOps();
	return { ok: true, data: { id: data.data.id } };
}

/**
 * The end-of-night count: start a sheet for the store and submit what was counted. The manager approves it
 * in Inventory → Counts and the levels are corrected then.
 */
export async function submitStockCount(input: {
	storeId: string;
	lines: {
		itemId: string;
		name: string;
		quantity: number;
		unitCost?: number;
	}[];
}): Promise<ActionResult<{ id: string }>> {
	if (!live("inventory")) {
		await demoDelay(400);
		return { ok: true, data: { id: `ct-${Date.now()}` } };
	}
	const s = await withSession();
	const started = await api("@post/inventory/counts", {
		...s,
		body: { storeId: input.storeId },
	});
	if (started.error || !started.data)
		return {
			ok: false,
			error: errorMessage(started.error, "The count could not be started"),
		};
	const submitted = await api("@put/inventory/counts/:id", {
		...s,
		params: { id: started.data.data.id },
		body: { lines: input.lines },
	});
	if (submitted.error || !submitted.data)
		return {
			ok: false,
			error: errorMessage(submitted.error, "The count could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: { id: submitted.data.data.id } };
}
