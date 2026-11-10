import { z } from "zod";
import { pagedOf, pageParams } from "./paged";

/**
 * Restaurant and bar (docs/restaurant-bar.md in hospio-backend): fnb-service (outlets, tables, menus,
 * categories, happy hours, orders, tabs, sales), the inventory routes the outlets use (stores, items,
 * levels, use or waste, ask the store, counts) and finance-service's outlet sales. Spread into
 * `createSchema` in ./schema.ts.
 *
 * Every field the contract adds is `.nullable().optional()` so a response from a service that has not
 * caught up still parses; statuses and kinds are plain strings so a new value never breaks a screen.
 */

const envelope = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		requestTime: z.string(),
		requestType: z.string(),
		referenceId: z.string(),
		status: z.boolean(),
		message: z.string().nullable(),
		data,
	});

const str = z.string().nullable().optional();
const num = z.number().nullable().optional();
const bool = z.boolean().nullable().optional();

// ---- outlets, tables, categories, happy hours -----------------------------------------------------

export const OutletItem = z.object({
	id: z.string(),
	name: z.string(),
	kind: z.string(),
	status: str,
	/** The inventory store the outlet draws from (new). */
	storeId: str,
});

export const TableItem = z.object({
	id: z.string(),
	outletId: str,
	number: z.string(),
	seats: num,
	active: bool,
});

export const CategoryItem = z.object({
	id: z.string(),
	outletId: str,
	name: z.string(),
	sortOrder: num,
	active: bool,
});

export const HappyHourItem = z.object({
	id: z.string(),
	outletId: str,
	name: z.string(),
	fromTime: z.string(),
	toTime: z.string(),
	days: z.string(),
	discountPct: z.number(),
	active: bool,
});

// ---- menu -----------------------------------------------------------------------------------------

export const MenuItemItem = z.object({
	id: z.string(),
	outletId: str,
	category: z.string(),
	name: z.string(),
	description: str,
	price: z.number(),
	taxRate: num,
	/** JSON `[{group, choices:[{name, priceDelta}], required, multiple}]`, or the older comma list. */
	options: z.unknown().optional(),
	/** `[{stockItemId, quantity}]` per portion, as an array or as the JSON text of one. */
	recipe: z.unknown().optional(),
	available: bool,
	active: bool,
	sortOrder: num,
});

export const PriceChangeAnswer = z.object({
	status: z.string(),
	requestId: str,
});

const MenuItemBody = z.object({
	category: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	price: z.number(),
	taxRate: z.number().nullable().optional(),
	options: z.string().nullable().optional(),
	recipe: z
		.array(z.object({ stockItemId: z.string(), quantity: z.number() }))
		.nullable()
		.optional(),
	sortOrder: z.number().nullable().optional(),
	active: z.boolean().nullable().optional(),
});

// ---- orders ---------------------------------------------------------------------------------------

export const OrderLineItem = z.object({
	id: z.string(),
	orderId: str,
	menuItemId: str,
	name: z.string(),
	quantity: z.number(),
	unitPrice: z.number(),
	taxRate: num,
	/** Happy hour discount on the line (new). */
	discount: num,
	options: str,
	notes: str,
	status: z.string(),
	/** Why and by whom a cancelled line was cancelled. */
	cancelReason: str,
	cancelledByName: str,
});

export const OrderItem = z.object({
	id: z.string(),
	number: z.string(),
	outletId: z.string(),
	kind: z.string(),
	tableId: str,
	tableNo: str,
	roomId: str,
	roomNumber: str,
	bookingId: str,
	guestName: str,
	status: z.string(),
	subtotal: num,
	tax: num,
	discount: num,
	total: z.number(),
	chargedToRoom: bool,
	paid: bool,
	paymentId: str,
	openedByName: str,
	sentAt: str,
	closedAt: str,
	notes: str,
	createdAt: str,
	/** New: who closed it and how it was settled (PAYMENT, ROOM, COMPLIMENTARY, CANCELLED). */
	closedBy: str,
	closedByName: str,
	settledBy: str,
	settledAt: str,
	settledByName: str,
	cancelReason: str,
	/** Approved payments so far; part paid while under the total. */
	paidAmount: num,
	lines: z.array(OrderLineItem).nullable().optional(),
});

// ---- sales history --------------------------------------------------------------------------------

const money = z.number();
const SaleTotalsItem = z.object({
	sales: z.number(),
	sold: money,
	paid: money,
	unpaid: money,
	onRooms: money,
	cancelled: z.number(),
	cancelledAmount: num,
});

export const SaleRowItem = z.object({
	id: z.string(),
	number: z.string(),
	outletId: z.string(),
	outletName: str,
	outletKind: str,
	kind: z.string(),
	tableNo: str,
	roomNumber: str,
	guestName: str,
	createdAt: z.string(),
	openedBy: str,
	openedByName: str,
	items: str,
	itemCount: num,
	total: money,
	paidAmount: num,
	balance: num,
	/** PAID, TO_PAY, PART_PAID, ON_ROOM, CANCELLED or IN_PROGRESS. */
	status: z.string(),
	orderStatus: str,
	methods: z.array(z.string()).nullable().optional(),
	settledAt: str,
	settledBy: str,
	settledByName: str,
	cancelReason: str,
});

export const SalesHistoryItem = z.object({
	from: z.string(),
	to: z.string(),
	page: z.number(),
	size: z.number(),
	matching: z.number(),
	rows: z.array(SaleRowItem),
	totals: SaleTotalsItem,
	outlets: z.array(
		SaleTotalsItem.omit({ cancelledAmount: true }).extend({
			outletId: z.string(),
			name: z.string(),
			kind: str,
		}),
	),
	attendants: z.array(
		SaleTotalsItem.omit({ cancelledAmount: true }).extend({
			userId: z.string(),
			name: z.string(),
		}),
	),
	earlierUnpaid: z.object({ count: z.number(), amount: money, oldest: str }),
	viewer: z.object({
		userId: z.string(),
		management: z.boolean(),
		mine: z.boolean(),
		mineByDefault: z.boolean(),
		canExport: z.boolean(),
		actsOnOthers: z.boolean(),
	}),
	outletChoices: z.array(
		z.object({ id: z.string(), name: z.string(), kind: z.string() }),
	),
});

export const SaleDetailItem = z.object({
	sale: SaleRowItem,
	roomId: str,
	bookingId: str,
	tableId: str,
	notes: str,
	subtotal: money,
	discount: money,
	tax: money,
	total: money,
	paidAmount: money,
	balance: money,
	lines: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			quantity: z.number(),
			unitPrice: money,
			options: str,
			choices: z
				.array(z.object({ name: z.string(), extra: money }))
				.nullable()
				.optional(),
			notes: str,
			discount: num,
			amount: money,
			status: z.string(),
			cancelReason: str,
			cancelledByName: str,
		}),
	),
	payments: z.array(
		z.object({
			paymentId: z.string(),
			method: z.string(),
			amount: money,
			at: str,
			reference: str,
			takenByName: str,
		}),
	),
	timeline: z.object({
		openedAt: str,
		openedByName: str,
		sentAt: str,
		settledAt: str,
		settledBy: str,
		settledByName: str,
		closedAt: str,
		closedByName: str,
	}),
	can: z.object({
		pay: z.boolean(),
		chargeToRoom: z.boolean(),
		cancel: z.boolean(),
		note: str,
	}),
});

const salesQuery = z
	.object({
		from: z.string(),
		to: z.string(),
		outletId: z.string(),
		desk: z.string(),
		status: z.string(),
		method: z.string(),
		attendant: z.string(),
		mine: z.boolean(),
		q: z.string(),
		page: z.number(),
		size: z.number(),
	})
	.partial()
	.optional();

const OrderBody = z.object({
	outletId: z.string(),
	kind: z.string().nullable().optional(),
	tableId: z.string().nullable().optional(),
	roomId: z.string().nullable().optional(),
	guestName: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	lines: z
		.array(
			z.object({
				menuItemId: z.string(),
				quantity: z.number(),
				options: z.string().nullable().optional(),
				notes: z.string().nullable().optional(),
			}),
		)
		.optional(),
});

// ---- sales ----------------------------------------------------------------------------------------

const SalesFigures = z.object({
	orders: num,
	sales: num,
	paidAtOutlet: num,
	chargedToRooms: num,
	cancelled: num,
	byMethod: z.record(z.string(), z.number()).nullable().optional(),
});

export const OutletSalesItem = SalesFigures.extend({
	outletId: z.string(),
	name: z.string(),
	kind: str,
	topItems: z
		.array(z.object({ name: z.string(), qty: z.number(), sales: z.number() }))
		.nullable()
		.optional(),
});

export const SalesDay = z.object({
	date: str,
	outlets: z.array(OutletSalesItem),
	totals: SalesFigures.nullable().optional(),
});

// ---- inventory ------------------------------------------------------------------------------------

export const StoreItem = z.object({
	id: z.string(),
	name: z.string(),
	kind: str,
	active: bool,
	items: num,
	lowItems: num,
	/** Stock value of the store (null for callers who don't see money). */
	value: num,
});

export const StockItemFull = z.object({
	id: z.string(),
	name: z.string(),
	category: str,
	unit: str,
	minLevel: num,
	unitCost: num,
	supplierId: str,
	active: bool,
	parLevel: num,
	supplierName: str,
	onHand: num,
});

export const StockLevelItem = z.object({
	id: str,
	itemId: z.string(),
	storeId: z.string(),
	quantity: z.number(),
	updatedAt: str,
});

export const StockRequestItem = z.object({
	id: z.string(),
	fromTeam: z.string(),
	storeId: str,
	/** JSON text `[{itemId, name, quantity}]`, or the array itself. */
	lines: z.unknown().optional(),
	note: str,
	status: z.string(),
	requestedBy: str,
	requestedByName: str,
	createdAt: str,
	storeName: str,
	issuedByName: str,
	issuedAt: str,
	/** Why the store declined or closed it short. */
	reason: str,
});

const StockLine = z.object({
	itemId: z.string(),
	name: z.string().nullable().optional(),
	quantity: z.number(),
	unitCost: z.number().nullable().optional(),
});

export const StockCountItem = z.object({
	id: z.string(),
	storeId: z.string(),
	status: z.string(),
});

const nameBody = z.object({
	name: z.string(),
	sortOrder: z.number().nullable().optional(),
	active: z.boolean().nullable().optional(),
});
const happyBody = z.object({
	name: z.string(),
	fromTime: z.string(),
	toTime: z.string(),
	days: z.string(),
	discountPct: z.number(),
	active: z.boolean().nullable().optional(),
});
const tableBody = z.object({
	number: z.string(),
	seats: z.number().nullable().optional(),
	active: z.boolean().nullable().optional(),
});
const outletBody = z.object({
	name: z.string(),
	kind: z.string(),
	storeId: z.string().nullable().optional(),
	status: z.string().nullable().optional(),
});
const reasonBody = z.object({ reason: z.string() });

export const fnbRoutes = {
	// outlets, tables
	"@get/fnb/outlets": { output: envelope(z.array(OutletItem)) },
	"@post/fnb/outlets": { input: outletBody, output: envelope(OutletItem) },
	"@put/fnb/outlets/:id": { input: outletBody, output: envelope(OutletItem) },
	"@get/fnb/outlets/:outletId/tables": { output: envelope(z.array(TableItem)) },
	"@post/fnb/outlets/:outletId/tables": {
		input: tableBody,
		output: envelope(TableItem),
	},
	"@put/fnb/outlets/:outletId/tables/:id": {
		input: tableBody,
		output: envelope(TableItem),
	},

	// menu
	"@get/fnb/outlets/:outletId/menu": {
		query: z.object({ all: z.boolean() }).partial().optional(),
		output: envelope(z.array(MenuItemItem)),
	},
	"@post/fnb/outlets/:outletId/menu": {
		input: MenuItemBody,
		output: envelope(MenuItemItem),
	},
	"@put/fnb/outlets/:outletId/menu/:id": {
		input: MenuItemBody,
		output: envelope(MenuItemItem),
	},
	"@put/fnb/menu/:id/available": {
		query: z.object({ available: z.boolean() }),
		output: envelope(MenuItemItem),
	},
	"@put/fnb/menu/:id/price": {
		input: z.object({
			newPrice: z.number(),
			reason: z.string().nullable().optional(),
		}),
		output: envelope(z.union([MenuItemItem, PriceChangeAnswer])),
	},
	"@get/fnb/outlets/:outletId/categories": {
		output: envelope(z.array(CategoryItem)),
	},
	"@post/fnb/outlets/:outletId/categories": {
		input: nameBody,
		output: envelope(CategoryItem),
	},
	"@put/fnb/outlets/:outletId/categories/:id": {
		input: nameBody,
		output: envelope(CategoryItem),
	},
	"@get/fnb/outlets/:outletId/happy-hours": {
		output: envelope(z.array(HappyHourItem)),
	},
	"@post/fnb/outlets/:outletId/happy-hours": {
		input: happyBody,
		output: envelope(HappyHourItem),
	},
	"@put/fnb/outlets/:outletId/happy-hours/:id": {
		input: happyBody,
		output: envelope(HappyHourItem),
	},

	// orders
	"@get/fnb/orders": {
		query: z
			.object({ outletId: z.string(), status: z.string(), date: z.string() })
			.partial()
			.optional(),
		output: envelope(z.array(OrderItem)),
	},
	"@get/fnb/orders/:id": { output: envelope(OrderItem) },
	"@post/fnb/orders": { input: OrderBody, output: envelope(OrderItem) },
	"@post/fnb/orders/:id/lines": {
		input: z.object({
			menuItemId: z.string(),
			quantity: z.number(),
			options: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
		}),
		output: envelope(OrderItem),
	},
	"@post/fnb/orders/:id/send": { output: envelope(OrderItem) },
	"@put/fnb/orders/:id/status": {
		query: z.object({ status: z.string() }),
		output: envelope(OrderItem),
	},
	"@put/fnb/orders/:id/lines/:lineId/status": {
		query: z.object({ status: z.string() }),
		output: envelope(OrderItem),
	},
	"@post/fnb/orders/:id/lines/:lineId/cancel": {
		input: reasonBody,
		output: envelope(OrderItem),
	},
	"@post/fnb/orders/:id/cancel": {
		input: reasonBody,
		output: envelope(OrderItem),
	},
	"@post/fnb/orders/:id/charge-to-room": {
		query: z.object({ roomId: z.string() }).partial().optional(),
		output: envelope(OrderItem),
	},
	"@post/fnb/orders/:id/move-table": {
		query: z.object({ tableId: z.string() }),
		output: envelope(OrderItem),
	},
	"@get/fnb/sales": {
		query: z
			.object({ date: z.string(), outletId: z.string() })
			.partial()
			.optional(),
		output: envelope(SalesDay),
	},

	"@get/fnb/sales/history": {
		query: salesQuery,
		output: envelope(SalesHistoryItem),
	},
	"@get/fnb/sales/history/export": {
		query: salesQuery,
		output: envelope(
			z.object({
				filename: z.string(),
				csv: z.string(),
				rows: z.number(),
				truncated: z.boolean(),
			}),
		),
	},
	"@get/fnb/sales/history/unpaid": {
		query: z.object({ desk: z.string() }).partial().optional(),
		output: envelope(z.object({ count: z.number(), amount: z.number() })),
	},
	"@get/fnb/sales/history/:id": { output: envelope(SaleDetailItem) },

	// finance · outlet sales for the manager and owner screens
	"@get/finance/sales": {
		query: z.object({ date: z.string() }).partial().optional(),
		output: envelope(SalesDay),
	},

	// inventory the outlets use
	"@get/inventory/stores": { output: envelope(z.array(StoreItem)) },
	"@get/inventory/items": { output: envelope(z.array(StockItemFull)) },
	"@get/inventory/levels": {
		query: z.object({ storeId: z.string() }).partial().optional(),
		output: envelope(z.array(StockLevelItem)),
	},
	"@post/inventory/levels/use": {
		input: z.object({
			itemId: z.string(),
			storeId: z.string(),
			quantity: z.number(),
			waste: z.boolean(),
			note: z.string().nullable().optional(),
		}),
		output: envelope(StockLevelItem),
	},
	/** Paged (docs/pagination.md): team, status (OPEN, comma lists), q, from, to; counts per status. */
	"@get/inventory/requests": {
		query: pageParams,
		output: envelope(pagedOf(StockRequestItem)),
	},
	"@post/inventory/requests": {
		input: z.object({
			fromTeam: z.string(),
			storeId: z.string().nullable().optional(),
			lines: z.array(StockLine),
			note: z.string().nullable().optional(),
		}),
		output: envelope(StockRequestItem),
	},
	"@post/inventory/counts": {
		input: z.object({ storeId: z.string() }),
		output: envelope(StockCountItem),
	},
	"@put/inventory/counts/:id": {
		input: z.object({
			lines: z.array(StockLine),
			note: z.string().nullable().optional(),
		}),
		output: envelope(StockCountItem),
	},
} as const;
