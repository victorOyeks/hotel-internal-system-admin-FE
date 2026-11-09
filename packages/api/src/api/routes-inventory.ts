import { z } from "zod";
import { Deliveries } from "./routes-admin";

/**
 * Inventory and stores (docs/inventory-stores.md in hospio-backend): the store's own routes on top of
 * the ones the outlets use (routes-fnb.ts: stores, items, levels, use/waste, ask the store, counts).
 * Spread into `createSchema` in ./schema.ts after fnbRoutes.
 *
 * New fields are `.nullable().optional()` and statuses plain strings, so a service that is behind or
 * ahead never breaks a screen.
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

export const InvStore = z.object({
	id: z.string(),
	name: z.string(),
	kind: str,
	active: bool,
	items: num,
	lowItems: num,
	value: num,
});

export const InvItem = z.object({
	id: z.string(),
	name: z.string(),
	category: str,
	unit: str,
	minLevel: num,
	parLevel: num,
	unitCost: num,
	supplierId: str,
	supplierName: str,
	active: bool,
	onHand: num,
});

export const InvMovement = z.object({
	id: z.string(),
	at: str,
	itemId: z.string(),
	itemName: str,
	unit: str,
	storeId: z.string(),
	storeName: str,
	kind: z.string(),
	quantity: z.number(),
	unitCost: num,
	value: num,
	reference: str,
	note: str,
	team: str,
	byName: str,
});

export const InvItemDetail = z.object({
	item: InvItem,
	levels: z.array(
		z.object({
			storeId: z.string(),
			storeName: z.string(),
			storeKind: str,
			quantity: z.number(),
			value: num,
		}),
	),
	movements: z.array(InvMovement),
});

const ReqLine = z.object({
	itemId: z.string(),
	name: str,
	unit: str,
	quantity: z.number(),
	issued: num,
});

export const InvRequest = z.object({
	id: z.string(),
	fromTeam: z.string(),
	storeId: str,
	storeName: str,
	lines: z.array(ReqLine).nullable().optional(),
	note: str,
	status: z.string(),
	requestedBy: str,
	requestedByName: str,
	issuedByName: str,
	issuedAt: str,
	reason: str,
	createdAt: str,
});

export const InvTransfer = z.object({
	reference: z.string(),
	at: str,
	fromStoreId: str,
	fromStore: str,
	toStoreId: str,
	toStore: str,
	team: str,
	lines: z.array(ReqLine),
	value: num,
	byName: str,
	note: str,
});

export const InvSupplier = z.object({
	id: z.string(),
	name: z.string(),
	contactName: str,
	phone: str,
	email: str,
	paymentTerms: str,
	address: str,
	notes: str,
	active: bool,
	items: num,
	itemIds: z.array(z.string()).nullable().optional(),
	openOrders: num,
	lastOrderAt: str,
	spent: num,
});

const OrderLine = z.object({
	itemId: z.string(),
	name: str,
	unit: str,
	quantity: z.number(),
	unitCost: num,
	received: num,
	damaged: num,
});

export const InvDelivery = z.object({
	id: z.string(),
	purchaseOrderId: str,
	poNumber: str,
	supplierName: str,
	storeId: str,
	storeName: str,
	lines: z
		.array(
			z.object({
				itemId: z.string(),
				name: str,
				unit: str,
				quantity: z.number(),
				unitCost: num,
				damaged: num,
				ordered: num,
				shortQty: num,
				overQty: num,
				note: str,
			}),
		)
		.nullable()
		.optional(),
	total: num,
	invoiceNumber: str,
	note: str,
	summary: str,
	receivedByName: str,
	receivedAt: str,
});

export const InvOrder = z.object({
	id: z.string(),
	number: z.string(),
	supplierId: str,
	supplierName: str,
	storeId: str,
	storeName: str,
	lines: z.array(OrderLine).nullable().optional(),
	total: num,
	receivedValue: num,
	status: z.string(),
	expectedOn: str,
	note: str,
	createdByName: str,
	createdAt: str,
	sentAt: str,
	sentTo: str,
	approverLevel: str,
	decisionNote: str,
	cancelReason: str,
	deliveries: z.array(InvDelivery).nullable().optional(),
	sent: Deliveries,
});

export const InvCount = z.object({
	id: z.string(),
	storeId: z.string(),
	storeName: str,
	status: z.string(),
	lines: z
		.array(
			z.object({
				itemId: z.string(),
				name: str,
				unit: str,
				expected: num,
				quantity: num,
				variance: num,
				unitCost: num,
				value: num,
			}),
		)
		.nullable()
		.optional(),
	varianceValue: num,
	note: str,
	startedByName: str,
	countedByName: str,
	approvedByName: str,
	cancelReason: str,
	startedAt: str,
	closedAt: str,
});

export const InvValue = z.object({
	total: z.number(),
	stores: z.array(InvStore),
	low: z.array(
		z.object({
			itemId: z.string(),
			name: z.string(),
			unit: str,
			storeId: z.string(),
			storeName: str,
			quantity: z.number(),
			minLevel: num,
			parLevel: num,
			suggest: num,
			unitCost: num,
			supplierId: str,
			supplierName: str,
		}),
	),
	onOrder: num,
});

export const InvUsage = z.object({
	from: z.string(),
	to: z.string(),
	stores: z.array(
		z.object({
			storeId: z.string(),
			name: z.string(),
			kind: str,
			received: z.number(),
			transferredIn: z.number(),
			issuedOut: z.number(),
			used: z.number(),
			wasted: z.number(),
			counted: z.number(),
		}),
	),
	teams: z.array(z.object({ team: z.string(), issued: z.number() })),
	totals: z.object({
		received: z.number(),
		issued: z.number(),
		used: z.number(),
		wasted: z.number(),
		counted: z.number(),
	}),
});

const line = z.object({
	itemId: z.string(),
	quantity: z.number(),
	unitCost: z.number().nullable().optional(),
	damaged: z.number().nullable().optional(),
	note: z.string().nullable().optional(),
});
const reason = z.object({ reason: z.string() });
const range = z
	.object({ from: z.string(), to: z.string() })
	.partial()
	.optional();
const orderBody = z.object({
	supplierId: z.string(),
	storeId: z.string().nullable().optional(),
	lines: z.array(line),
	expectedOn: z.string().nullable().optional(),
	note: z.string().nullable().optional(),
	submit: z.boolean().nullable().optional(),
});

export const inventoryRoutes = {
	"@post/inventory/stores": {
		input: z.object({
			name: z.string(),
			kind: z.string(),
			active: z.boolean().nullable().optional(),
		}),
		output: envelope(InvStore),
	},
	"@put/inventory/stores/:id": {
		input: z.object({
			name: z.string(),
			kind: z.string(),
			active: z.boolean().nullable().optional(),
		}),
		output: envelope(InvStore),
	},
	"@get/inventory/items/:id": { output: envelope(InvItemDetail) },
	"@post/inventory/items": {
		input: z.object({
			name: z.string(),
			category: z.string().nullable().optional(),
			unit: z.string().nullable().optional(),
			minLevel: z.number().nullable().optional(),
			parLevel: z.number().nullable().optional(),
			unitCost: z.number().nullable().optional(),
			supplierId: z.string().nullable().optional(),
			active: z.boolean().nullable().optional(),
			storeId: z.string().nullable().optional(),
			openingQuantity: z.number().nullable().optional(),
		}),
		output: envelope(InvItem),
	},
	"@put/inventory/items/:id": {
		input: z.object({
			name: z.string(),
			category: z.string().nullable().optional(),
			unit: z.string().nullable().optional(),
			minLevel: z.number().nullable().optional(),
			parLevel: z.number().nullable().optional(),
			unitCost: z.number().nullable().optional(),
			supplierId: z.string().nullable().optional(),
			active: z.boolean().nullable().optional(),
		}),
		output: envelope(InvItem),
	},
	"@get/inventory/movements": {
		query: z
			.object({
				itemId: z.string(),
				storeId: z.string(),
				kind: z.string(),
				from: z.string(),
				to: z.string(),
			})
			.partial()
			.optional(),
		output: envelope(z.array(InvMovement)),
	},
	"@post/inventory/levels/adjust": {
		input: z.object({
			itemId: z.string(),
			storeId: z.string(),
			quantity: z.number(),
			reason: z.string(),
		}),
		output: envelope(z.object({ quantity: z.number() })),
	},
	"@post/inventory/transfers": {
		input: z.object({
			fromStoreId: z.string(),
			toStoreId: z.string(),
			lines: z.array(line),
			note: z.string().nullable().optional(),
		}),
		output: envelope(InvTransfer),
	},
	"@get/inventory/transfers": {
		query: range,
		output: envelope(z.array(InvTransfer)),
	},
	"@post/inventory/requests/:id/issue": {
		input: z.object({
			storeId: z.string(),
			lines: z.array(line).nullable().optional(),
		}),
		output: envelope(InvRequest),
	},
	"@post/inventory/requests/:id/decline": {
		input: reason,
		output: envelope(InvRequest),
	},
	"@get/inventory/suppliers": { output: envelope(z.array(InvSupplier)) },
	"@post/inventory/suppliers": {
		input: z.object({
			name: z.string(),
			contactName: z.string().nullable().optional(),
			phone: z.string().nullable().optional(),
			email: z.string().nullable().optional(),
			paymentTerms: z.string().nullable().optional(),
			address: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
			active: z.boolean().nullable().optional(),
			itemIds: z.array(z.string()).nullable().optional(),
		}),
		output: envelope(InvSupplier),
	},
	"@put/inventory/suppliers/:id": {
		input: z.object({
			name: z.string(),
			contactName: z.string().nullable().optional(),
			phone: z.string().nullable().optional(),
			email: z.string().nullable().optional(),
			paymentTerms: z.string().nullable().optional(),
			address: z.string().nullable().optional(),
			notes: z.string().nullable().optional(),
			active: z.boolean().nullable().optional(),
			itemIds: z.array(z.string()).nullable().optional(),
		}),
		output: envelope(InvSupplier),
	},
	"@get/inventory/purchase-orders": {
		query: z.object({ status: z.string() }).partial().optional(),
		output: envelope(z.array(InvOrder)),
	},
	"@get/inventory/purchase-orders/:id": { output: envelope(InvOrder) },
	"@post/inventory/purchase-orders": {
		input: orderBody,
		output: envelope(InvOrder),
	},
	"@put/inventory/purchase-orders/:id": {
		input: orderBody,
		output: envelope(InvOrder),
	},
	"@post/inventory/purchase-orders/:id/submit": { output: envelope(InvOrder) },
	"@post/inventory/purchase-orders/:id/cancel": {
		input: reason,
		output: envelope(InvOrder),
	},
	"@post/inventory/purchase-orders/:id/close": {
		input: reason,
		output: envelope(InvOrder),
	},
	"@get/inventory/deliveries": { output: envelope(z.array(InvDelivery)) },
	"@post/inventory/deliveries": {
		input: z.object({
			purchaseOrderId: z.string().nullable().optional(),
			supplierName: z.string().nullable().optional(),
			storeId: z.string().nullable().optional(),
			invoiceNumber: z.string().nullable().optional(),
			lines: z.array(line),
			note: z.string().nullable().optional(),
		}),
		output: envelope(InvDelivery),
	},
	"@get/inventory/counts": { output: envelope(z.array(InvCount)) },
	"@post/inventory/counts/:id/approve": { output: envelope(InvCount) },
	"@post/inventory/counts/:id/cancel": {
		input: reason,
		output: envelope(InvCount),
	},
	"@get/inventory/value": { output: envelope(InvValue) },
	"@get/inventory/usage": { query: range, output: envelope(InvUsage) },
} as const;
