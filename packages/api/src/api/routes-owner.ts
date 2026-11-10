import { z } from "zod";
import { Deliveries } from "./routes-admin";
import { pagedOf, pageParams } from "./paged";

/**
 * Owner portal (docs/owner-portal.md in hospio-backend): staff accounts on identity-service, staff threads on
 * messaging-service, settlements on payment-service, requests to H.M.S support and report schedules on platform-service.
 * Spread into `createSchema` in ./schema.ts. New fields are `.nullable().optional()` and statuses plain strings, so a
 * service that is behind or ahead never breaks a screen.
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
const id = z.object({ id: z.string() });

/** identity's UserResponse, as the staff actions answer it (the list keeps using UserSummary in ./schema). */
const StaffUser = z.object({
	id: z.string(),
	fullName: z.string(),
	email: z.string(),
	phone: str,
	status: z.string(),
	pausedUntil: str,
	statusReason: str,
	statusChangedBy: str,
	statusChangedAt: str,
	jobTitle: str,
});

export const ThreadRow = z.object({
	id: z.string(),
	hotelId: str,
	subject: str,
	audience: str,
	startedById: str,
	startedByName: str,
	recipientId: str,
	recipientName: str,
	mine: z.boolean(),
	withName: str,
	lastMessageAt: str,
	lastPreview: str,
	unread: z.number(),
	broadcastId: str,
	createdAt: str,
});

export const ThreadMessage = z.object({
	id: z.string(),
	senderId: str,
	senderName: str,
	body: z.string(),
	createdAt: z.string(),
	mine: z.boolean(),
});

const ThreadSent = z.object({ thread: ThreadRow, deliveries: Deliveries });

const GuestConversation = z.object({
	id: z.string(),
	guestName: str,
	guestContact: str,
	channel: z.string(),
	deliveries: Deliveries,
});

export const SettlementItem = z.object({
	id: z.string(),
	hotelId: str,
	provider: str,
	periodDate: z.string(),
	gross: z.number(),
	providerFees: z.number(),
	hmsShare: num,
	net: z.number(),
	paymentCount: num,
	status: z.string(),
	settledAt: str,
	failureReason: str,
});

export const PlatformChangeItem = z.object({
	change: z.object({
		id: z.string(),
		hotelId: str,
		area: z.string(),
		description: z.string(),
		reason: str,
		madeByName: str,
		createdAt: z.string(),
		undoUntil: z.string(),
		undoneAt: str,
		undoRequestedAt: str,
		undoRequestedByName: str,
		undoTicketId: str,
	}),
	businessName: str,
	madeByName: str,
	undone: z.boolean(),
});

export const TicketItem = z.object({
	id: z.string(),
	subject: z.string(),
	status: z.string(),
	priority: str,
	category: str,
	resolution: str,
	createdAt: z.string(),
	resolvedAt: str,
	assignedToName: str,
});

export const ReportItem = z.object({
	id: z.string(),
	hotelId: str,
	kind: z.string(),
	name: str,
	status: z.string(),
	schedule: str,
	sendAt: str,
	recipients: str,
	periodFrom: str,
	periodTo: str,
	nextRunAt: str,
	lastRunAt: str,
	requestedBy: str,
	requestedByName: str,
	scheduleId: str,
	createdAt: z.string(),
});

export const DepartmentsBoard = z.record(
	z.string(),
	z.object({ actionsLastHour: z.number(), lastAt: str, lastAction: str }),
);

export const ownerRoutes = {
	// identity · staff accounts
	"@put/identity/users/:id/details": {
		params: id,
		input: z.object({
			fullName: z.string().optional(),
			phone: z.string().optional(),
			email: z.string().optional(),
			jobTitle: z.string().optional(),
		}),
		output: envelope(StaffUser),
	},
	"@post/identity/users/:id/suspend": {
		params: id,
		input: z.object({ reason: z.string() }),
		output: envelope(StaffUser),
	},
	"@post/identity/users/:id/pause": {
		params: id,
		input: z.object({
			days: z.number(),
			reason: z.string().nullable().optional(),
		}),
		output: envelope(StaffUser),
	},
	"@post/identity/users/:id/reinstate": {
		params: id,
		output: envelope(StaffUser),
	},

	// messaging · staff threads and guest messages
	/** With page or size: a page, newest message first, searched by `q` (docs/pagination.md). */
	"@get/messaging/threads": {
		query: pageParams.optional(),
		output: envelope(pagedOf(ThreadRow)),
	},
	"@post/messaging/threads": {
		input: z.object({
			toUserId: z.string().nullable().optional(),
			toHotelManagers: z.boolean().optional(),
			subject: z.string().nullable().optional(),
			body: z.string(),
			whatsapp: z.boolean().optional(),
		}),
		output: envelope(ThreadSent),
	},
	"@post/messaging/threads/managers": {
		input: z.object({
			subject: z.string().nullable().optional(),
			body: z.string(),
			whatsapp: z.boolean().optional(),
		}),
		output: envelope(
			z.object({
				count: z.number(),
				threads: z.array(ThreadRow),
				deliveries: Deliveries,
			}),
		),
	},
	"@get/messaging/threads/:id": {
		params: id,
		output: envelope(
			z.object({ thread: ThreadRow, messages: z.array(ThreadMessage) }),
		),
	},
	"@post/messaging/threads/:id/reply": {
		params: id,
		input: z.object({ body: z.string() }),
		output: envelope(ThreadSent),
	},
	"@post/messaging/conversations/guest": {
		input: z.object({
			guestId: z.string().nullable().optional(),
			guestName: z.string().nullable().optional(),
			guestContact: z.string(),
			channel: z.string(),
			subject: z.string().nullable().optional(),
			body: z.string(),
		}),
		output: envelope(GuestConversation),
	},

	// payment · settlements
	"@get/payment/payments/settlements": {
		query: z.object({ from: z.string(), to: z.string() }).partial().optional(),
		output: envelope(z.array(SettlementItem)),
	},

	// platform · changes by H.M.S, requests to support, reports, departments
	"@get/platform/changes": { output: envelope(z.array(PlatformChangeItem)) },
	"@post/platform/changes/:id/request-undo": {
		params: id,
		input: z.object({ note: z.string().nullable().optional() }),
		output: envelope(PlatformChangeItem),
	},
	"@get/platform/support/ownership-transfer": {
		output: envelope(TicketItem.nullable()),
	},
	"@post/platform/support/ownership-transfer": {
		input: z.object({
			newOwnerName: z.string(),
			newOwnerEmail: z.string(),
			newOwnerPhone: z.string().nullable().optional(),
			note: z.string().nullable().optional(),
		}),
		output: envelope(TicketItem),
	},
	"@get/platform/reports": { output: envelope(z.array(ReportItem)) },
	"@post/platform/reports/schedules": {
		input: z.object({
			kind: z.string(),
			every: z.string(),
			sendAt: z.string(),
			hotelId: z.string().nullable().optional(),
			managers: z.boolean().optional(),
		}),
		output: envelope(ReportItem),
	},
	"@post/platform/reports/schedules/:id/stop": {
		params: id,
		output: envelope(ReportItem),
	},
	"@post/platform/reports/schedules/:id/run": {
		params: id,
		output: envelope(z.object({ report: ReportItem, deliveries: Deliveries })),
	},
	"@get/platform/departments/live": { output: envelope(DepartmentsBoard) },
} as const;

export type ThreadRowItem = z.infer<typeof ThreadRow>;
export type ThreadMessageItem = z.infer<typeof ThreadMessage>;
export type SettlementRow = z.infer<typeof SettlementItem>;
export type PlatformChangeItemT = z.infer<typeof PlatformChangeItem>;
export type TicketItemT = z.infer<typeof TicketItem>;
export type ReportItemT = z.infer<typeof ReportItem>;
