import { z } from "zod";
import { Deliveries } from "./routes-admin";

/**
 * The operating day's routes (docs/operating-day.md in hospio-backend): finance-service (workforce,
 * tills, deposits, expenses, night audit, series, transactions, owner summary), housekeeping-service
 * (tasks, room status, lost & found, problems) and platform-service approvals (all, decide, escalate).
 * Spread into `createSchema` in ./schema.ts. The routes that already existed (finance `today` and `rota`,
 * housekeeping `room-status`, `platform/approvals`) live in ./schema.ts with their new fields added.
 *
 * Every field the contract adds is `.nullable().optional()` so a response from a service that has not
 * caught up still parses; statuses are plain strings so a new value never breaks a screen.
 */

const envelope = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		requestTime: z.string(),
		requestType: z.string(),
		referenceId: z.string(),
		status: z.boolean(),
		message: z.string().nullable(),
		data,
		deliveries: Deliveries,
	});

const str = z.string().nullable().optional();
const num = z.number().nullable().optional();
const bool = z.boolean().nullable().optional();
const id = z.object({ id: z.string() });
const dateQuery = z.object({ date: z.string() }).partial().optional();

// ---- workforce -----------------------------------------------------------------------------------

export const ShiftRequestItem = z.object({
	id: z.string(),
	shiftId: str,
	kind: z.string(),
	userId: str,
	userName: str,
	withUserId: str,
	withUserName: str,
	reason: str,
	status: z.string(),
	decidedBy: str,
	createdAt: str,
	shiftDate: str,
	startsAt: str,
	endsAt: str,
	role: str,
	deliveries: Deliveries,
});

export const LeaveItem = z.object({
	id: z.string(),
	userId: str,
	userName: str,
	role: str,
	fromDate: z.string(),
	toDate: z.string(),
	days: num,
	reason: str,
	status: z.string(),
	decidedBy: str,
	decisionNote: str,
	createdAt: str,
	deliveries: Deliveries,
});

export const ClockMe = z.object({
	clockedIn: z.boolean(),
	since: str,
	todayMinutes: num,
});

export const ClockEntry = z.object({
	id: z.string().nullable().optional(),
	userId: str,
	userName: str,
	clockIn: str,
	clockOut: str,
	note: str,
});

export const ShiftBody = z.object({
	userId: z.string(),
	userName: z.string().nullable().optional(),
	role: z.string(),
	shiftDate: z.string(),
	startsAt: z.string(),
	endsAt: z.string(),
});

// ---- tills, deposits ------------------------------------------------------------------------------

export const TillItem = z.object({
	id: z.string(),
	role: z.string(),
	openedBy: str,
	openedByName: str,
	openedAt: str,
	openingFloat: z.number(),
	cashIn: num,
	cashOut: num,
	expectedCash: z.number(),
	countedCash: num,
	variance: num,
	status: z.string(),
	closedAt: str,
	closedBy: str,
	note: str,
	entries: num,
	deliveries: Deliveries,
});

export const TillEntryItem = z.object({
	id: z.string(),
	tillId: str,
	paymentId: str,
	amount: z.number(),
	method: str,
	description: str,
	kind: str,
	createdAt: str,
});

export const TillHandover = z.object({
	closed: TillItem.nullable().optional(),
	opened: TillItem.nullable().optional(),
	deliveries: Deliveries,
});

export const DepositItem = z.object({
	id: z.string(),
	amount: z.number(),
	bankAccount: str,
	reference: str,
	bankedBy: str,
	bankedAt: str,
});

// ---- expenses -------------------------------------------------------------------------------------

export const ExpenseItem = z.object({
	id: z.string(),
	category: z.string(),
	amount: z.number(),
	description: str,
	paidFrom: str,
	receiptKey: str,
	expenseDate: str,
	status: z.string(),
	approvalId: str,
	approverLevel: str,
	requestedBy: str,
	requestedByName: str,
	decidedBy: str,
	decisionNote: str,
	createdAt: str,
	deliveries: Deliveries,
});

// ---- night audit, money ---------------------------------------------------------------------------

export const ChecklistItem = z.object({
	key: z.string(),
	label: z.string(),
	done: z.boolean(),
	detail: str,
});

/**
 * `GET /night-audit?date`: the audit when one exists plus the computed checklist and counts. The audit's own
 * stored `checklist` is a JSON string on older builds, so both shapes parse.
 */
export const NightAuditDay = z.object({
	id: str,
	businessDate: str,
	status: str,
	revenue: num,
	cashCounted: num,
	variance: num,
	roomsOccupied: num,
	closedBy: str,
	closedAt: str,
	note: str,
	checklist: z
		.union([z.array(ChecklistItem), z.string()])
		.nullable()
		.optional(),
	arrivals: num,
	departures: num,
	inHouse: num,
	noShows: num,
	rooms: num,
	report: z.unknown().optional(),
	deliveries: Deliveries,
});

export const SeriesPoint = z.object({
	date: z.string(),
	revenue: z.number(),
	expenses: z.number(),
});

export const TransactionItem = z.object({
	at: z.string(),
	kind: z.string(),
	description: str,
	amount: z.number(),
	method: str,
	by: str,
	ref: str,
});

export const OwnerHotelSummary = z.object({
	hotelId: z.string(),
	name: z.string(),
	revenue: z.number(),
	expenses: z.number(),
	profit: num,
	occupancyPct: num,
});

export const OwnerSummary = z.object({
	hotels: z.array(OwnerHotelSummary),
	totals: z
		.object({ revenue: num, expenses: num, profit: num, occupancyPct: num })
		.nullable()
		.optional(),
});

// ---- housekeeping ---------------------------------------------------------------------------------

export const CleaningTaskItem = z.object({
	id: z.string(),
	roomId: z.string(),
	roomNumber: str,
	kind: z.string(),
	dueDate: str,
	status: z.string(),
	assignedTo: str,
	assignedToName: str,
	checklist: str,
	startedAt: str,
	doneAt: str,
	doneBy: str,
	inspectedBy: str,
	inspectedAt: str,
	inspectionNote: str,
	skipReason: str,
	priority: str,
	guestArrives: bool,
});

export const LostFoundItem = z.object({
	id: z.string(),
	description: z.string(),
	foundWhere: str,
	roomId: str,
	foundBy: str,
	foundAt: str,
	status: z.string(),
	returnedTo: str,
	returnedAt: str,
});

export const ProblemItem = z.object({
	id: z.string(),
	roomId: str,
	roomNumber: str,
	description: z.string(),
	repairId: str,
	status: str,
});

// ---- routes ---------------------------------------------------------------------------------------

export const opsRoutes = {
	// finance · workforce
	"@get/finance/workforce/shifts/mine": {
		output: envelope(
			z.array(
				z.object({
					id: z.string(),
					userId: z.string(),
					userName: str,
					role: z.string(),
					shiftDate: z.string(),
					startsAt: z.string(),
					endsAt: z.string(),
					status: z.string(),
					clockedIn: bool,
					attendance: str,
				}),
			),
		),
	},
	"@post/finance/workforce/shifts": {
		input: ShiftBody,
		output: envelope(z.unknown()),
	},
	"@put/finance/workforce/shifts/:id": {
		params: id,
		input: ShiftBody,
		output: envelope(z.unknown()),
	},
	"@delete/finance/workforce/shifts/:id": {
		params: id,
		output: envelope(z.unknown()),
	},
	"@post/finance/workforce/shifts/:id/requests": {
		params: id,
		input: z.object({
			kind: z.string(),
			withUserId: z.string().nullable().optional(),
			reason: z.string().nullable().optional(),
		}),
		output: envelope(ShiftRequestItem),
	},
	"@get/finance/workforce/shift-requests": {
		output: envelope(z.array(ShiftRequestItem)),
	},
	"@post/finance/workforce/shift-requests/:id/decide": {
		params: id,
		query: z.object({ approved: z.boolean() }),
		output: envelope(ShiftRequestItem),
	},
	"@post/finance/workforce/leave": {
		input: z.object({
			fromDate: z.string(),
			toDate: z.string(),
			reason: z.string().nullable().optional(),
		}),
		output: envelope(LeaveItem),
	},
	"@get/finance/workforce/leave/mine": { output: envelope(z.array(LeaveItem)) },
	"@get/finance/workforce/leave/pending": {
		output: envelope(z.array(LeaveItem)),
	},
	"@post/finance/workforce/leave/:id/decide": {
		params: id,
		input: z.object({
			decision: z.string(),
			note: z.string().nullable().optional(),
		}),
		output: envelope(LeaveItem),
	},
	"@get/finance/workforce/clock/me": { output: envelope(ClockMe) },
	"@get/finance/workforce/clock": {
		query: dateQuery,
		output: envelope(z.array(ClockEntry)),
	},
	"@post/finance/workforce/clock-in": {
		input: z.object({ note: z.string().nullable().optional() }).optional(),
		output: envelope(ClockEntry),
	},
	"@post/finance/workforce/clock-out": {
		input: z.object({ note: z.string().nullable().optional() }).optional(),
		output: envelope(ClockEntry),
	},

	// finance · tills and deposits
	"@get/finance/tills": { output: envelope(z.array(TillItem)) },
	"@get/finance/tills/mine": { output: envelope(TillItem.nullable()) },
	"@get/finance/tills/mine/closed": { output: envelope(z.array(TillItem)) },
	"@post/finance/tills": {
		input: z.object({
			role: z.string(),
			openingFloat: z.number().nullable().optional(),
		}),
		output: envelope(TillItem),
	},
	"@get/finance/tills/:id/entries": {
		params: id,
		output: envelope(z.array(TillEntryItem)),
	},
	"@post/finance/tills/:id/movements": {
		params: id,
		input: z.object({
			kind: z.enum(["PAY_IN", "PAY_OUT"]),
			amount: z.number(),
			reason: z.string(),
		}),
		output: envelope(TillEntryItem),
	},
	"@post/finance/tills/:id/close": {
		params: id,
		input: z.object({
			countedCash: z.number(),
			note: z.string().nullable().optional(),
		}),
		output: envelope(TillItem),
	},
	"@post/finance/tills/:id/handover": {
		params: id,
		input: z.object({
			countedCash: z.number(),
			note: z.string().nullable().optional(),
			toUserId: z.string(),
			toUserName: z.string(),
		}),
		output: envelope(TillHandover.or(TillItem)),
	},
	"@post/finance/payments/:paymentId/match": {
		params: z.object({ paymentId: z.string() }),
		query: z.object({ matched: z.boolean() }).partial().optional(),
		output: envelope(z.unknown()),
	},
	"@get/finance/deposits": { output: envelope(z.array(DepositItem)) },
	"@post/finance/deposits": {
		input: z.object({
			amount: z.number(),
			bankAccount: z.string().nullable().optional(),
			reference: z.string().nullable().optional(),
		}),
		output: envelope(DepositItem),
	},

	// finance · expenses
	"@get/finance/expenses": {
		query: z
			.object({ status: z.string(), from: z.string(), to: z.string() })
			.partial()
			.optional(),
		output: envelope(z.array(ExpenseItem)),
	},
	"@post/finance/expenses": {
		input: z.object({
			category: z.string(),
			amount: z.number(),
			description: z.string(),
			paidFrom: z.string().nullable().optional(),
			receiptKey: z.string().nullable().optional(),
			expenseDate: z.string().nullable().optional(),
		}),
		output: envelope(ExpenseItem),
	},
	"@post/finance/expenses/:id/answer": {
		params: id,
		input: z.object({ note: z.string() }),
		output: envelope(ExpenseItem),
	},
	"@post/finance/expenses/:id/paid": {
		params: id,
		input: z.object({ paidFrom: z.string().nullable().optional() }).optional(),
		output: envelope(ExpenseItem),
	},

	// finance · night audit and money
	"@get/finance/night-audit": {
		query: dateQuery,
		output: envelope(NightAuditDay),
	},
	"@get/finance/night-audit/past": { output: envelope(z.array(NightAuditDay)) },
	"@post/finance/night-audit/close": {
		query: dateQuery,
		input: z.object({
			cashCounted: z.number().nullable().optional(),
			roomsOccupied: z.number().nullable().optional(),
			note: z.string().nullable().optional(),
			markNoShows: z.boolean().optional(),
		}),
		output: envelope(NightAuditDay),
	},
	"@get/finance/income": {
		query: z.object({ from: z.string(), to: z.string() }),
		output: envelope(
			z.array(
				z.object({ source: z.string(), amount: z.number(), pct: z.number() }),
			),
		),
	},
	"@get/finance/series": {
		query: z.object({ from: z.string(), to: z.string() }).partial().optional(),
		output: envelope(z.array(SeriesPoint)),
	},
	"@get/finance/transactions": {
		query: dateQuery,
		output: envelope(z.array(TransactionItem)),
	},
	"@get/finance/owner/summary": {
		query: z.object({ from: z.string(), to: z.string() }).partial().optional(),
		output: envelope(OwnerSummary),
	},

	// housekeeping
	"@get/housekeeping/tasks": {
		query: dateQuery,
		output: envelope(z.array(CleaningTaskItem)),
	},
	"@get/housekeeping/tasks/to-inspect": {
		output: envelope(z.array(CleaningTaskItem)),
	},
	"@post/housekeeping/tasks": {
		input: z.object({
			roomId: z.string(),
			roomNumber: z.string().nullable().optional(),
			kind: z.string(),
			dueDate: z.string().nullable().optional(),
			assignedTo: z.string().nullable().optional(),
			assignedToName: z.string().nullable().optional(),
		}),
		output: envelope(CleaningTaskItem),
	},
	"@put/housekeeping/tasks/:id/assign": {
		params: id,
		input: z.object({
			assignedTo: z.string(),
			assignedToName: z.string().nullable().optional(),
		}),
		output: envelope(CleaningTaskItem),
	},
	"@post/housekeeping/tasks/:id/start": {
		params: id,
		output: envelope(CleaningTaskItem),
	},
	"@put/housekeeping/tasks/:id/checklist": {
		params: id,
		input: z.object({ checklist: z.string() }),
		output: envelope(CleaningTaskItem),
	},
	"@post/housekeeping/tasks/:id/done": {
		params: id,
		output: envelope(CleaningTaskItem),
	},
	"@post/housekeeping/tasks/:id/skip": {
		params: id,
		input: z.object({ reason: z.string() }),
		output: envelope(CleaningTaskItem),
	},
	"@post/housekeeping/tasks/:id/inspect": {
		params: id,
		input: z.object({
			passed: z.boolean(),
			note: z.string().nullable().optional(),
		}),
		output: envelope(CleaningTaskItem),
	},
	"@post/housekeeping/tasks/:id/rush": {
		params: id,
		output: envelope(CleaningTaskItem),
	},
	"@post/housekeeping/room-status/:roomId": {
		params: z.object({ roomId: z.string() }),
		input: z.object({
			status: z.enum(["CLEAN", "DIRTY", "INSPECTED"]),
			note: z.string().nullable().optional(),
		}),
		output: envelope(z.unknown()),
	},
	"@post/housekeeping/minibar": {
		input: z.object({
			roomId: z.string(),
			items: z.string(),
			total: z.number(),
		}),
		output: envelope(z.unknown()),
	},
	"@post/housekeeping/linen-requests": {
		input: z.object({
			roomId: z.string().nullable().optional(),
			roomNumber: z.string().nullable().optional(),
			items: z.string(),
		}),
		output: envelope(z.unknown()),
	},
	"@get/housekeeping/lost-found": { output: envelope(z.array(LostFoundItem)) },
	"@post/housekeeping/lost-found": {
		input: z.object({
			description: z.string(),
			foundWhere: z.string().nullable().optional(),
			roomId: z.string().nullable().optional(),
			photoKey: z.string().nullable().optional(),
		}),
		output: envelope(LostFoundItem),
	},
	"@post/housekeeping/lost-found/:id/return": {
		params: id,
		input: z.object({ returnedTo: z.string() }),
		output: envelope(LostFoundItem),
	},
	"@post/housekeeping/problems": {
		input: z.object({
			roomId: z.string().nullable().optional(),
			roomNumber: z.string().nullable().optional(),
			description: z.string(),
			photoKey: z.string().nullable().optional(),
		}),
		output: envelope(ProblemItem),
	},

	// platform · approvals (the pending list is in ./schema.ts)
	"@get/platform/approvals/all": {
		output: envelope(
			z.array(
				z.object({
					id: z.string(),
					sourceModule: z.string(),
					sourceRef: str,
					kind: z.string(),
					amount: num,
					requesterName: str,
					requesterRole: str,
					approverLevel: z.string(),
					description: str,
					status: z.string(),
					createdAt: z.string(),
					decidedByName: str,
					note: str,
					hotelName: str,
				}),
			),
		),
	},
	"@post/platform/approvals/:id/decide": {
		params: id,
		input: z.object({
			decision: z.string(),
			note: z.string().nullable().optional(),
		}),
		output: envelope(
			z.object({
				id: z.string(),
				status: z.string(),
				approverLevel: str,
				deliveries: Deliveries,
			}),
		),
	},
	"@post/platform/approvals/:id/escalate": {
		params: id,
		input: z.object({ note: z.string().nullable().optional() }),
		output: envelope(
			z.object({
				id: z.string(),
				status: z.string(),
				approverLevel: str,
				deliveries: Deliveries,
			}),
		),
	},
};

export type ShiftRequestItem = z.infer<typeof ShiftRequestItem>;
export type LeaveItem = z.infer<typeof LeaveItem>;
export type ClockMe = z.infer<typeof ClockMe>;
export type ClockEntry = z.infer<typeof ClockEntry>;
export type TillItem = z.infer<typeof TillItem>;
export type TillEntryItem = z.infer<typeof TillEntryItem>;
export type DepositItem = z.infer<typeof DepositItem>;
export type ExpenseItem = z.infer<typeof ExpenseItem>;
export type ChecklistItem = z.infer<typeof ChecklistItem>;
export type NightAuditDay = z.infer<typeof NightAuditDay>;
export type SeriesPoint = z.infer<typeof SeriesPoint>;
export type TransactionItem = z.infer<typeof TransactionItem>;
export type OwnerSummary = z.infer<typeof OwnerSummary>;
export type CleaningTaskItem = z.infer<typeof CleaningTaskItem>;
export type LostFoundItem = z.infer<typeof LostFoundItem>;
