import { z } from "zod";
import { pagedOf, pageParams } from "./paged";

/**
 * Laundry and maintenance (docs/laundry-maintenance.md in hospio-backend): work orders, assets and preventive
 * schedules on maintenance-service; guest laundry, the price list and linen batches on housekeeping-service.
 * Spread into `createSchema` in ./schema.ts. New fields are `.nullable().optional()` and statuses plain
 * strings, so a service that is behind or ahead never breaks a screen.
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
const reason = z.object({ reason: z.string() });
const range = z
	.object({ from: z.string(), to: z.string() })
	.partial()
	.optional();

export const WorkOrder = z.object({
	id: z.string(),
	number: str,
	roomId: str,
	roomNumber: str,
	area: str,
	category: str,
	priority: z.string(),
	status: z.string(),
	title: z.string(),
	description: str,
	source: str,
	reportedBy: str,
	reportedByName: str,
	reportedByRole: str,
	assignedTo: str,
	assignedToName: str,
	dueAt: str,
	overdue: bool,
	startedAt: str,
	holdReason: str,
	doneAt: str,
	completionNote: str,
	labourMinutes: num,
	parts: z
		.array(
			z.object({
				itemId: z.string(),
				name: str,
				unit: str,
				quantity: z.number(),
				unitCost: num,
				value: num,
			}),
		)
		.nullable()
		.optional(),
	partsCost: num,
	vendorName: str,
	vendorCost: num,
	totalCost: num,
	roomOutOfOrder: bool,
	oooUntil: str,
	reopenCount: num,
	reopenReason: str,
	cancelReason: str,
	hasPhoto: bool,
	assetId: str,
	assetName: str,
	scheduleId: str,
	createdAt: str,
	updates: z
		.array(
			z.object({
				id: z.string(),
				at: str,
				byName: str,
				note: z.string(),
			}),
		)
		.nullable()
		.optional(),
});

export const MaintenanceSummary = z.object({
	from: z.string(),
	to: z.string(),
	done: z.number(),
	open: z.number(),
	overdue: z.number(),
	partsCost: z.number(),
	vendorCost: z.number(),
	labourMinutes: z.number(),
	totalCost: z.number(),
	byCategory: z.array(
		z.object({ category: z.string(), count: z.number(), cost: z.number() }),
	),
});

export const MaintAsset = z.object({
	id: z.string(),
	name: z.string(),
	category: str,
	roomId: str,
	roomNumber: str,
	area: str,
	active: bool,
	openWorkOrders: num,
});

export const MaintSchedule = z.object({
	id: z.string(),
	title: z.string(),
	description: str,
	category: str,
	priority: str,
	everyDays: z.number(),
	nextDue: z.string(),
	lastDone: str,
	lastOpened: str,
	assetId: str,
	assetName: str,
	roomId: str,
	roomNumber: str,
	area: str,
	assignedTo: str,
	assignedToName: str,
	paused: bool,
});

export const LaundryPrice = z.object({
	id: z.string(),
	name: z.string(),
	category: str,
	price: z.number(),
	expressPrice: num,
	active: bool,
	sortOrder: num,
});

export const LaundryOrder = z.object({
	id: z.string(),
	number: str,
	bookingId: str,
	guestName: str,
	roomId: str,
	roomNumber: str,
	lines: z
		.array(
			z.object({
				priceId: str,
				name: z.string(),
				quantity: z.number(),
				unitPrice: z.number(),
				amount: z.number(),
			}),
		)
		.nullable()
		.optional(),
	express: bool,
	total: z.number(),
	status: z.string(),
	settlement: str,
	chargedToRoom: bool,
	paid: bool,
	chargedAt: str,
	paidAt: str,
	paidAmount: num,
	paymentId: str,
	paymentMethod: str,
	promisedAt: str,
	note: str,
	pocketNote: str,
	cancelReason: str,
	receivedByName: str,
	createdAt: str,
	deliveredAt: str,
});

export const LinenBatch = z.object({
	id: z.string(),
	number: z.string(),
	status: z.string(),
	lines: z.array(
		z.object({
			itemId: z.string(),
			name: str,
			unit: str,
			sent: z.number(),
			received: num,
			returned: num,
			condemned: num,
			lost: num,
			missing: num,
			outstanding: num,
			unitCost: num,
		}),
	),
	note: str,
	sentByName: str,
	createdAt: str,
	receivedAt: str,
	receivedByName: str,
	returnedAt: str,
	closedReason: str,
	condemnedValue: num,
	lostValue: num,
	sent: num,
	missing: num,
	outstanding: num,
});

export const LaundrySummary = z.object({
	from: z.string(),
	to: z.string(),
	orders: z.number(),
	income: z.number(),
	charged: z.number(),
	paid: z.number(),
	open: z.number(),
	cancelled: z.number(),
	condemnedValue: z.number(),
	lostValue: z.number(),
});

const workOrderBody = z.object({
	roomId: z.string().nullable().optional(),
	area: z.string().nullable().optional(),
	category: z.string(),
	priority: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	assignedTo: z.string().nullable().optional(),
	assignedToName: z.string().nullable().optional(),
});

const assetBody = z.object({
	name: z.string(),
	category: z.string().nullable().optional(),
	roomId: z.string().nullable().optional(),
	area: z.string().nullable().optional(),
	active: z.boolean().nullable().optional(),
});

const scheduleBody = z.object({
	title: z.string(),
	description: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	priority: z.string().nullable().optional(),
	everyDays: z.number(),
	nextDue: z.string().nullable().optional(),
	assetId: z.string().nullable().optional(),
	roomId: z.string().nullable().optional(),
	area: z.string().nullable().optional(),
	assignedTo: z.string().nullable().optional(),
	assignedToName: z.string().nullable().optional(),
	paused: z.boolean().nullable().optional(),
});

const priceBody = z.object({
	name: z.string(),
	category: z.string().nullable().optional(),
	price: z.number(),
	expressPrice: z.number().nullable().optional(),
	active: z.boolean().nullable().optional(),
	sortOrder: z.number().nullable().optional(),
});

const itemLines = z.array(
	z.object({ itemId: z.string(), quantity: z.number() }),
);

export const lmRoutes = {
	// maintenance-service
	/**
	 * With page/size: a page (scope open, mine, raised, overdue, held, unassigned, done or all; q, roomId, from, to; counts per tab).
	 * Without: every match (the open board, bounded by nature).
	 */
	"@get/maintenance/repairs": {
		query: pageParams,
		output: envelope(z.union([pagedOf(WorkOrder), z.array(WorkOrder)])),
	},
	"@get/maintenance/repairs/:id": { output: envelope(WorkOrder) },
	"@get/maintenance/repairs/summary": {
		query: range,
		output: envelope(MaintenanceSummary),
	},
	"@post/maintenance/repairs": {
		input: workOrderBody,
		output: envelope(WorkOrder),
	},
	"@post/maintenance/repairs/:id/assign": {
		input: z.object({
			assignedTo: z.string(),
			assignedToName: z.string().nullable().optional(),
		}),
		output: envelope(WorkOrder),
	},
	"@post/maintenance/repairs/:id/start": { output: envelope(WorkOrder) },
	"@post/maintenance/repairs/:id/resume": { output: envelope(WorkOrder) },
	"@post/maintenance/repairs/:id/hold": {
		input: reason,
		output: envelope(WorkOrder),
	},
	"@post/maintenance/repairs/:id/reopen": {
		input: reason,
		output: envelope(WorkOrder),
	},
	"@post/maintenance/repairs/:id/cancel": {
		input: reason,
		output: envelope(WorkOrder),
	},
	"@post/maintenance/repairs/:id/complete": {
		input: z.object({
			note: z.string(),
			labourMinutes: z.number().nullable().optional(),
			parts: itemLines.nullable().optional(),
			vendorName: z.string().nullable().optional(),
			vendorCost: z.number().nullable().optional(),
		}),
		output: envelope(WorkOrder),
	},
	"@post/maintenance/repairs/:id/updates": {
		input: z.object({ note: z.string() }),
		output: envelope(WorkOrder),
	},
	"@post/maintenance/repairs/:id/out-of-order": {
		input: z.object({
			reason: z.string().nullable().optional(),
			until: z.string().nullable().optional(),
		}),
		output: envelope(WorkOrder),
	},
	"@post/maintenance/repairs/:id/back-in-service": {
		output: envelope(WorkOrder),
	},
	"@get/maintenance/assets": { output: envelope(z.array(MaintAsset)) },
	"@post/maintenance/assets": {
		input: assetBody,
		output: envelope(MaintAsset),
	},
	"@put/maintenance/assets/:id": {
		input: assetBody,
		output: envelope(MaintAsset),
	},
	"@get/maintenance/scheduled-jobs": {
		output: envelope(z.array(MaintSchedule)),
	},
	"@post/maintenance/scheduled-jobs": {
		input: scheduleBody,
		output: envelope(MaintSchedule),
	},
	"@put/maintenance/scheduled-jobs/:id": {
		input: scheduleBody,
		output: envelope(MaintSchedule),
	},
	"@put/maintenance/scheduled-jobs/:id/pause": {
		query: z.object({ paused: z.boolean() }),
		output: envelope(MaintSchedule),
	},
	"@delete/maintenance/scheduled-jobs/:id": { output: envelope(z.null()) },
	"@post/maintenance/scheduled-jobs/run": {
		output: envelope(z.object({ opened: z.number() })),
	},
	// housekeeping-service · laundry
	"@get/housekeeping/laundry/prices": {
		output: envelope(z.array(LaundryPrice)),
	},
	"@post/housekeeping/laundry/prices": {
		input: priceBody,
		output: envelope(LaundryPrice),
	},
	"@put/housekeeping/laundry/prices/:id": {
		input: priceBody,
		output: envelope(LaundryPrice),
	},
	/** With page/size: a page (status, OPEN alias; q, roomId, bookingId, from, to; counts, totals.value). Without: the open board. */
	"@get/housekeeping/laundry/orders": {
		query: pageParams,
		output: envelope(z.union([pagedOf(LaundryOrder), z.array(LaundryOrder)])),
	},
	"@post/housekeeping/laundry/orders": {
		input: z.object({
			roomId: z.string(),
			lines: z.array(z.object({ priceId: z.string(), quantity: z.number() })),
			express: z.boolean().nullable().optional(),
			promisedAt: z.string().nullable().optional(),
			note: z.string().nullable().optional(),
			chargeToRoom: z.boolean().nullable().optional(),
		}),
		output: envelope(LaundryOrder),
	},
	"@post/housekeeping/laundry/orders/:id/status": {
		input: z.object({ status: z.string() }),
		output: envelope(LaundryOrder),
	},
	"@post/housekeeping/laundry/orders/:id/charge-to-room": {
		output: envelope(LaundryOrder),
	},
	"@post/housekeeping/laundry/orders/:id/paid": {
		input: z.object({ paymentId: z.string() }),
		output: envelope(LaundryOrder),
	},
	"@post/housekeeping/laundry/orders/:id/cancel": {
		input: reason,
		output: envelope(LaundryOrder),
	},
	"@post/housekeeping/laundry/orders/:id/pocket-note": {
		input: z.object({ note: z.string() }),
		output: envelope(LaundryOrder),
	},
	/** With page/size: a page (status, OPEN and DONE aliases; q, from, to; counts). Without: every match. */
	"@get/housekeeping/laundry/linen-batches": {
		query: pageParams,
		output: envelope(z.union([pagedOf(LinenBatch), z.array(LinenBatch)])),
	},
	"@post/housekeeping/laundry/linen-batches": {
		input: z.object({
			lines: itemLines,
			note: z.string().nullable().optional(),
		}),
		output: envelope(LinenBatch),
	},
	"@post/housekeeping/laundry/linen-batches/:id/receive": {
		input: z.object({ lines: itemLines }),
		output: envelope(LinenBatch),
	},
	"@post/housekeeping/laundry/linen-batches/:id/return": {
		input: z.object({
			lines: z.array(
				z.object({
					itemId: z.string(),
					returned: z.number(),
					condemned: z.number(),
				}),
			),
			reason: z.string().nullable().optional(),
		}),
		output: envelope(LinenBatch),
	},
	"@post/housekeeping/laundry/linen-batches/:id/close": {
		input: reason,
		output: envelope(LinenBatch),
	},
	"@get/housekeeping/laundry/summary": {
		query: range,
		output: envelope(LaundrySummary),
	},
} as const;
