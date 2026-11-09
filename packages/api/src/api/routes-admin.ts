import { z } from "zod";

/**
 * The admin portal's routes (docs/admin-portal.md in hospio-backend): platform-service `/platform/admin/**`
 * and `/platform/marketer/**`, payment-service `/payment/admin/**`, and identity's support access. Spread
 * into `createSchema` in ./schema.ts. Statuses are plain strings so a new value on the server never
 * breaks a screen; the data seam narrows them.
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

const paged = <T extends z.ZodTypeAny>(item: T) =>
	z.object({
		content: z.array(item),
		number: z.number(),
		size: z.number(),
		totalElements: z.number(),
		totalPages: z.number(),
		first: z.boolean().optional(),
		last: z.boolean().optional(),
		empty: z.boolean().optional(),
	});

const str = z.string().nullable().optional();
const num = z.number().nullable().optional();
const JsonMap = z.record(z.string(), z.unknown());

// ---- deliveries (cross-cutting) ------------------------------------------------------------------

/** A message the platform would have sent; echoed in responses while email and SMS are not connected. */
export const Delivery = z.object({
	channel: z.string(),
	to: z.string().nullable(),
	subject: str,
	text: z.string(),
	kind: str,
	ref: str,
});
export const Deliveries = z.array(Delivery).nullable().optional();

// ---- platform: dashboard, health, alerts, changes --------------------------------------------------

export const Alert = z.object({
	id: z.string(),
	businessId: str,
	businessName: str,
	hotelId: str,
	kind: str,
	title: z.string(),
	detail: str,
	tone: str,
	openedAt: str,
	dismissedAt: str,
	dismissedBy: str,
	dismissedByName: str,
	createdAt: str,
});

export const PlatformChange = z.object({
	id: z.string(),
	businessId: str,
	hotelId: str,
	area: str,
	description: str,
	reason: str,
	beforeJson: str,
	afterJson: str,
	madeBy: str,
	madeByName: str,
	undoUntil: str,
	undoneAt: str,
	undoneBy: str,
	businessName: str,
	undone: z.boolean().nullable().optional(),
	createdAt: str,
});

export const ChangeRow = z.object({
	change: PlatformChange,
	businessName: str,
	madeByName: str,
	undone: z.boolean(),
});

export const PlatformActivity = z.object({
	id: z.string(),
	businessId: str,
	hotelId: str,
	eventType: str,
	actorId: str,
	actorName: str,
	summary: str,
	payload: str,
	occurredAt: z.string(),
});

export const HealthScore = z.object({
	id: z.string(),
	businessId: str,
	score: z.number(),
	factors: str,
	computedAt: str,
});

export const Overview = z.object({
	businesses: z.object({
		total: z.number(),
		byStage: z.record(z.string(), z.number()).nullable().optional(),
	}),
	hotels: z.number(),
	rooms: z.number(),
	mrr: z.number().nullable(),
	dueFees: z.number().nullable(),
	overdueFees: z.number().nullable(),
	openTickets: z.number(),
	onboardingInProgress: z.number(),
	readyForHandover: z.number(),
	alerts: z.array(Alert).nullable(),
	recentChanges: z.array(ChangeRow).nullable(),
	recentActivity: z.array(PlatformActivity).nullable(),
	health: z
		.object({ good: z.number(), watch: z.number(), atRisk: z.number() })
		.nullable(),
});

export const WeekCount = z.object({
	weekStart: z.string(),
	bookings: z.number(),
	payments: z.number(),
	messages: z.number(),
});

export const Usage = z.object({
	businessId: z.string(),
	activeUsers7d: z.number(),
	activeUsers30d: z.number(),
	bookings30d: z.number(),
	payments30d: z.number(),
	messages30d: z.number(),
	weeks: z.array(WeekCount).nullable(),
	features: z.record(z.string(), z.boolean()).nullable(),
});

export const HotelOverview = z.object({
	hotelId: z.string(),
	businessId: str,
	name: str,
	managerUserId: str,
	managerName: str,
	rooms: num,
	occupiedRooms: num,
	occupancyPct: num,
	arrivalsToday: num,
	departuresToday: num,
	openFolios: num,
	paymentsTodayCount: num,
	paymentsTodayGross: num,
	raw: JsonMap.nullable().optional(),
});

export const PlatformChangeRequest = z.object({
	businessId: z.string(),
	hotelId: str,
	area: z.string(),
	description: z.string(),
	reason: z.string(),
	beforeJson: str,
	afterJson: str,
});

// ---- platform: fees ------------------------------------------------------------------------------

export const FeeRule = z.object({
	id: z.string(),
	businessId: str,
	model: z.string(),
	value: z.number(),
	startsOn: str,
	endsOn: str,
	createdAt: str,
});

export const FeeLine = z.object({
	hotelId: str,
	hotelName: str,
	base: num,
	fee: num,
});

export const FeePayment = z.object({
	id: z.string(),
	statementId: str,
	amount: z.number(),
	paidOn: str,
	reference: str,
	recordedBy: str,
	recordedByName: str,
	createdAt: str,
});

export const FeeStatementResponse = z.object({
	id: z.string(),
	businessId: z.string(),
	businessName: str,
	month: z.string(),
	baseAmount: z.number().nullable(),
	feeAmount: z.number().nullable(),
	paidAmount: z.number().nullable(),
	outstanding: z.number().nullable(),
	status: z.string(),
	dueOn: str,
	sentAt: str,
	lines: z.array(FeeLine).nullable(),
	payments: z.array(FeePayment).nullable(),
	createdAt: str,
	updatedAt: str,
});

export const GenerateResult = z.object({
	created: z.number(),
	skipped: z.number(),
	notes: z.array(z.string()).nullable(),
});

// ---- platform: support ---------------------------------------------------------------------------

export const SupportTicket = z.object({
	id: z.string(),
	businessId: str,
	businessName: str,
	hotelId: str,
	subject: z.string(),
	body: str,
	priority: z.string(),
	status: z.string(),
	openedBy: str,
	openedByName: str,
	openedAt: str,
	assignedTo: str,
	assignedToName: str,
	resolution: str,
	resolvedAt: str,
	lastActivityAt: str,
	createdAt: str,
});

export const SupportTicketComment = z.object({
	id: z.string(),
	ticketId: str,
	authorId: str,
	authorName: str,
	body: z.string(),
	internal: z.boolean(),
	createdAt: str,
});

export const TicketDetail = z.object({
	ticket: SupportTicket,
	comments: z.array(SupportTicketComment).nullable(),
});
export const TicketCommentResponse = z.object({
	comment: SupportTicketComment,
	deliveries: Deliveries,
});
export const TicketResolved = z.object({
	ticket: SupportTicket,
	deliveries: Deliveries,
});

// ---- platform: marketers -------------------------------------------------------------------------

export const MarketerProfile = z.object({
	id: z.string(),
	userId: str,
	fullName: z.string(),
	email: str,
	phone: str,
	status: z.string(),
	sharePct: z.number().nullable(),
	months: z.number().nullable(),
	bankName: str,
	bankAccount: str,
	bankAccountName: str,
	joinedAt: str,
	endedAt: str,
	referralCode: str,
	createdAt: str,
});

export const MarketerAgreement = z.object({
	id: z.string(),
	businessId: str,
	userId: str,
	fullName: str,
	sharePct: z.number().nullable(),
	months: z.number().nullable(),
	whtPct: z.number().nullable(),
	status: z.string(),
	startedOn: str,
	endedOn: str,
	profileId: str,
});

export const Commission = z.object({
	id: z.string(),
	businessId: str,
	marketerId: str,
	profileId: str,
	month: z.string(),
	baseAmount: z.number().nullable(),
	gross: z.number().nullable(),
	wht: z.number().nullable(),
	net: z.number().nullable(),
	status: z.string(),
	paidAt: str,
	paidReference: str,
	paidOn: str,
});

export const CommissionRow = z.object({
	commission: Commission,
	marketerName: str,
	businessName: str,
});

export const Referral = z.object({
	id: z.string(),
	profileId: str,
	hotelName: z.string(),
	ownerName: str,
	phone: str,
	email: str,
	city: str,
	stage: z.string(),
	note: str,
	businessId: str,
	sentAt: str,
	updatedAt: str,
	createdAt: str,
});

export const MarketerListRow = z.object({
	profile: MarketerProfile,
	businesses: z.number(),
	earnedTotal: z.number().nullable(),
	due: z.number().nullable(),
});

export const MarketerLogin = z.object({
	userId: z.string(),
	temporaryPassword: str,
	temporaryPasswordExpiresAt: str,
	inviteToken: str,
	inviteExpiresAt: str,
});

export const MarketerInvited = z.object({
	profile: MarketerProfile,
	login: MarketerLogin.nullable(),
	deliveries: Deliveries,
});

export const MarketerDetail = z.object({
	profile: MarketerProfile,
	agreements: z.array(MarketerAgreement).nullable(),
	referrals: z.array(Referral).nullable(),
	commissions: z.array(CommissionRow).nullable(),
	earnedTotal: z.number().nullable(),
	due: z.number().nullable(),
	paid: z.number().nullable(),
});

export const MarketerTotals = z.object({
	earnedTotal: z.number().nullable(),
	due: z.number().nullable(),
	paid: z.number().nullable(),
	businesses: z.number(),
	referrals: z.number(),
});
export const MarketerMe = z.object({
	profile: MarketerProfile,
	totals: MarketerTotals,
});

export const MarketerBusiness = z.object({
	id: z.string(),
	name: z.string(),
	city: str,
	stage: str,
	hotels: z.number(),
	since: str,
	sharePct: z.number().nullable(),
	lastMonthShare: z.number().nullable(),
	lastMonth: str,
});

export const CommissionStatement = z.object({
	month: z.string(),
	marketerName: str,
	gross: z.number().nullable(),
	wht: z.number().nullable(),
	net: z.number().nullable(),
	text: z.string(),
});

// ---- platform: settings --------------------------------------------------------------------------

export const Integration = z.object({
	key: z.string(),
	name: z.string(),
	kind: str,
	status: z.string(),
	detail: str,
	lastCheck: str,
});
export const PlatformSettings = z.record(z.string(), JsonMap);

// ---- payment: settlements and payouts -------------------------------------------------------------

export const Settlement = z.object({
	id: z.string(),
	businessId: str,
	businessName: str,
	hotelId: str,
	provider: str,
	periodDate: z.string(),
	gross: z.number().nullable(),
	providerFees: z.number().nullable(),
	hmsShare: z.number().nullable(),
	net: z.number().nullable(),
	paymentCount: num,
	status: z.string(),
	settledAt: str,
	payoutBatchId: str,
	failureReason: str,
	createdAt: str,
});

export const PayoutBatch = z.object({
	id: z.string(),
	ref: z.string(),
	createdBy: str,
	createdByName: str,
	status: z.string(),
	total: z.number().nullable(),
	businessCount: z.number(),
	settlementCount: z.number().nullable().optional(),
	paidAt: str,
	paidOn: str,
	paidReference: str,
	createdAt: z.string(),
});

export const FailedPayout = z.object({
	id: z.string(),
	settlementId: str,
	payoutBatchId: str,
	businessId: str,
	businessName: str,
	amount: z.number().nullable(),
	bankLabel: str,
	reason: str,
	attempts: z.number(),
	lastTriedAt: str,
	resolvedAt: str,
	createdAt: str,
});

export const RunResult = z.object({
	date: str,
	created: z.number(),
	skipped: z.number(),
});
export const BatchDetail = z.object({
	batch: PayoutBatch,
	settlements: z.array(Settlement).nullable(),
});
export const RetryResult = z.object({
	failedPayoutId: z.string(),
	attempts: z.number(),
	resolved: z.boolean(),
});
export const PaymentSummary = z.object({
	businessId: str,
	from: str,
	to: str,
	gross: z.number().nullable(),
	count: z.number(),
	byProvider: z
		.array(
			z.object({
				provider: str,
				gross: z.number().nullable(),
				count: z.number(),
			}),
		)
		.nullable(),
	byHotel: z
		.array(
			z.object({
				hotelId: str,
				gross: z.number().nullable(),
				count: z.number(),
			}),
		)
		.nullable(),
});

/** payment-service PaymentResponse, as the cross-business list returns it. */
export const AdminPayment = z.object({
	id: z.string(),
	folioId: str,
	bookingId: str,
	guestName: str,
	role: str,
	method: z.string(),
	amount: z.number(),
	currency: str,
	status: z.string(),
	terminalId: str,
	providerRef: str,
	description: str,
	failureReason: str,
	requestedBy: str,
	requestedByName: str,
	createdAt: z.string(),
	resolvedAt: str,
	verifiedAt: str,
});

// ---- identity: support access --------------------------------------------------------------------

export const SupportAccessGrant = z.object({
	id: z.string(),
	adminId: str,
	businessId: str,
	reason: str,
	expiresAt: str,
	createdAt: str,
});
export const SupportAccessToken = z.object({
	accessToken: z.string(),
	expiresIn: z.number(),
	hotels: z.array(z.string()).nullable(),
});
export const SupportAccessGrantRow = z.object({
	id: z.string(),
	adminId: str,
	adminName: str,
	businessId: str,
	reason: str,
	createdAt: str,
	expiresAt: str,
	expired: z.boolean(),
});

const pageQuery = { page: z.number(), size: z.number() };

export const adminRoutes = {
	// platform · dashboard, health, alerts, changes
	"@get/platform/admin/overview": { output: envelope(Overview) },
	"@get/platform/admin/businesses/:id/usage": {
		params: z.object({ id: z.string() }),
		output: envelope(Usage),
	},
	"@get/platform/admin/businesses/:id/hotels/:hotelId/overview": {
		params: z.object({ id: z.string(), hotelId: z.string() }),
		output: envelope(HotelOverview),
	},
	"@get/platform/admin/health": {
		query: z.object({ businessId: z.string() }).partial().optional(),
		output: envelope(z.array(HealthScore)),
	},
	"@post/platform/admin/health/:businessId": {
		params: z.object({ businessId: z.string() }),
		output: envelope(HealthScore),
	},
	"@get/platform/admin/alerts": {
		query: z
			.object({ businessId: z.string(), open: z.boolean() })
			.partial()
			.optional(),
		output: envelope(z.array(Alert)),
	},
	"@post/platform/admin/alerts/:id/dismiss": {
		params: z.object({ id: z.string() }),
		output: envelope(Alert),
	},
	"@get/platform/admin/changes": {
		query: z
			.object({
				businessId: z.string(),
				madeBy: z.string(),
				from: z.string(),
				to: z.string(),
				...pageQuery,
			})
			.partial()
			.optional(),
		output: envelope(paged(ChangeRow)),
	},
	"@post/platform/admin/changes": {
		input: PlatformChangeRequest,
		output: envelope(PlatformChange),
	},
	"@post/platform/changes/:id/undo": {
		params: z.object({ id: z.string() }),
		output: envelope(PlatformChange),
	},

	// platform · fees
	"@get/platform/admin/fees/rules": {
		query: z.object({ businessId: z.string() }),
		output: envelope(z.array(FeeRule)),
	},
	"@post/platform/admin/fees/rules": {
		input: z.object({
			businessId: z.string(),
			model: z.string(),
			value: z.number(),
			startsOn: z.string(),
			endsOn: str,
		}),
		output: envelope(FeeRule),
	},
	"@get/platform/admin/fees/statements": {
		query: z
			.object({
				businessId: z.string(),
				status: z.string(),
				month: z.string(),
				...pageQuery,
			})
			.partial()
			.optional(),
		output: envelope(paged(FeeStatementResponse)),
	},
	"@get/platform/admin/fees/statements/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(FeeStatementResponse),
	},
	"@post/platform/admin/fees/statements/generate": {
		input: z.object({ month: z.string(), businessId: str }),
		output: envelope(GenerateResult),
	},
	"@post/platform/admin/fees/statements": {
		input: z.object({
			businessId: z.string(),
			month: z.string(),
			baseAmount: z.number(),
		}),
		output: envelope(FeeStatementResponse),
	},
	"@post/platform/admin/fees/statements/:id/payments": {
		params: z.object({ id: z.string() }),
		input: z.object({ amount: z.number(), paidOn: str, reference: str }),
		output: envelope(FeeStatementResponse),
	},
	"@post/platform/admin/fees/statements/:id/send": {
		params: z.object({ id: z.string() }),
		output: envelope(z.object({ deliveries: Deliveries })),
	},

	// platform · support
	"@get/platform/admin/support/tickets": {
		query: z
			.object({
				status: z.string(),
				priority: z.string(),
				businessId: z.string(),
				assignedTo: z.string(),
				q: z.string(),
				...pageQuery,
			})
			.partial()
			.optional(),
		output: envelope(paged(SupportTicket)),
	},
	"@get/platform/admin/support/tickets/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(TicketDetail),
	},
	"@post/platform/admin/support/tickets": {
		input: z.object({
			businessId: z.string(),
			hotelId: str,
			subject: z.string(),
			body: str,
			priority: str,
		}),
		output: envelope(SupportTicket),
	},
	"@put/platform/admin/support/tickets/:id/assign": {
		params: z.object({ id: z.string() }),
		input: z.object({ adminId: z.string() }),
		output: envelope(SupportTicket),
	},
	"@put/platform/admin/support/tickets/:id/priority": {
		params: z.object({ id: z.string() }),
		input: z.object({ priority: z.string() }),
		output: envelope(SupportTicket),
	},
	"@post/platform/admin/support/tickets/:id/comments": {
		params: z.object({ id: z.string() }),
		input: z.object({ body: z.string(), internal: z.boolean() }),
		output: envelope(TicketCommentResponse),
	},
	"@post/platform/admin/support/tickets/:id/resolve": {
		params: z.object({ id: z.string() }),
		input: z.object({ resolution: z.string() }),
		output: envelope(TicketResolved),
	},
	"@post/platform/admin/support/tickets/:id/reopen": {
		params: z.object({ id: z.string() }),
		output: envelope(SupportTicket),
	},

	// platform · marketers
	"@get/platform/admin/marketers": {
		query: z.object({ status: z.string(), q: z.string() }).partial().optional(),
		output: envelope(z.array(MarketerListRow)),
	},
	"@post/platform/admin/marketers/invite": {
		input: z.object({
			fullName: z.string(),
			email: z.string(),
			phone: str,
			sharePct: num,
			months: num,
		}),
		output: envelope(MarketerInvited),
	},
	"@get/platform/admin/marketers/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(MarketerDetail),
	},
	"@put/platform/admin/marketers/:id": {
		params: z.object({ id: z.string() }),
		input: z.object({ sharePct: num, months: num, status: str }),
		output: envelope(MarketerProfile),
	},
	"@get/platform/admin/referrals": {
		query: z
			.object({ profileId: z.string(), stage: z.string(), ...pageQuery })
			.partial()
			.optional(),
		output: envelope(paged(Referral)),
	},
	"@put/platform/admin/referrals/:id/stage": {
		params: z.object({ id: z.string() }),
		input: z.object({ stage: z.string(), note: str }),
		output: envelope(Referral),
	},
	"@get/platform/admin/commissions": {
		query: z
			.object({
				profileId: z.string(),
				status: z.string(),
				month: z.string(),
				...pageQuery,
			})
			.partial()
			.optional(),
		output: envelope(paged(CommissionRow)),
	},
	"@post/platform/admin/commissions/:id/pay": {
		params: z.object({ id: z.string() }),
		input: z.object({ reference: str, paidOn: str }).optional(),
		output: envelope(Commission),
	},

	// platform · settings
	"@get/platform/admin/settings": { output: envelope(PlatformSettings) },
	"@put/platform/admin/settings/:group": {
		params: z.object({ group: z.string() }),
		input: JsonMap,
		output: envelope(JsonMap),
	},
	"@get/platform/admin/integrations": {
		output: envelope(z.array(Integration)),
	},

	// platform · marketer portal
	"@get/platform/marketer/me": { output: envelope(MarketerMe) },
	"@put/platform/marketer/me/bank": {
		input: z.object({
			bankName: z.string(),
			bankAccount: z.string(),
			bankAccountName: z.string(),
		}),
		output: envelope(MarketerProfile),
	},
	"@get/platform/marketer/referrals": { output: envelope(z.array(Referral)) },
	"@post/platform/marketer/referrals": {
		input: z.object({
			hotelName: z.string(),
			ownerName: str,
			phone: str,
			email: str,
			city: str,
			note: str,
		}),
		output: envelope(Referral),
	},
	"@get/platform/marketer/businesses": {
		output: envelope(z.array(MarketerBusiness)),
	},
	"@get/platform/marketer/commissions": {
		query: z.object({ month: z.string() }).partial().optional(),
		output: envelope(z.array(CommissionRow)),
	},
	"@get/platform/marketer/commissions/statement": {
		query: z.object({ month: z.string() }).partial().optional(),
		output: envelope(CommissionStatement),
	},

	// payment · settlements, payouts, cross-business payments
	"@get/payment/admin/settlements": {
		query: z
			.object({
				businessId: z.string(),
				status: z.string(),
				from: z.string(),
				to: z.string(),
				...pageQuery,
			})
			.partial()
			.optional(),
		output: envelope(paged(Settlement)),
	},
	"@post/payment/admin/settlements/run": {
		input: z.object({ date: str }).optional(),
		output: envelope(RunResult),
	},
	"@get/payment/admin/payouts/batches": {
		query: z.object(pageQuery).partial().optional(),
		output: envelope(paged(PayoutBatch)),
	},
	"@get/payment/admin/payouts/batches/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(BatchDetail),
	},
	"@post/payment/admin/payouts/batches": {
		input: z
			.object({ settlementIds: z.array(z.string()).nullable().optional() })
			.optional(),
		output: envelope(BatchDetail),
	},
	"@post/payment/admin/payouts/batches/:id/mark-paid": {
		params: z.object({ id: z.string() }),
		input: z.object({ reference: str, paidOn: str }).optional(),
		output: envelope(BatchDetail),
	},
	"@post/payment/admin/payouts/batches/:id/fail-settlement": {
		params: z.object({ id: z.string() }),
		input: z.object({ settlementId: z.string(), reason: str, bankLabel: str }),
		output: envelope(BatchDetail),
	},
	"@get/payment/admin/payouts/failed": {
		query: z.object(pageQuery).partial().optional(),
		output: envelope(paged(FailedPayout)),
	},
	"@post/payment/admin/payouts/failed/:id/retry": {
		params: z.object({ id: z.string() }),
		query: z.object({ resolve: z.boolean() }).partial().optional(),
		output: envelope(RetryResult),
	},
	"@get/payment/admin/payments": {
		query: z
			.object({
				businessId: z.string(),
				hotelId: z.string(),
				status: z.string(),
				from: z.string(),
				to: z.string(),
				...pageQuery,
			})
			.partial()
			.optional(),
		output: envelope(paged(AdminPayment)),
	},
	"@get/payment/admin/summary": {
		query: z
			.object({ businessId: z.string(), from: z.string(), to: z.string() })
			.partial(),
		output: envelope(PaymentSummary),
	},

	// identity · support access ("View as owner")
	"@post/identity/support-access": {
		input: z.object({
			businessId: z.string(),
			reason: z.string(),
			minutes: z.number(),
		}),
		output: envelope(SupportAccessGrant),
	},
	"@post/identity/support-access/:grantId/token": {
		params: z.object({ grantId: z.string() }),
		output: envelope(SupportAccessToken),
	},
	"@get/identity/support-access": {
		query: z.object({ businessId: z.string() }),
		output: envelope(z.array(SupportAccessGrantRow)),
	},
};

export type Delivery = z.infer<typeof Delivery>;
export type Alert = z.infer<typeof Alert>;
export type PlatformChange = z.infer<typeof PlatformChange>;
export type ChangeRow = z.infer<typeof ChangeRow>;
export type PlatformActivity = z.infer<typeof PlatformActivity>;
export type HealthScore = z.infer<typeof HealthScore>;
export type Overview = z.infer<typeof Overview>;
export type Usage = z.infer<typeof Usage>;
export type HotelOverview = z.infer<typeof HotelOverview>;
export type FeeRule = z.infer<typeof FeeRule>;
export type FeeStatementResponse = z.infer<typeof FeeStatementResponse>;
export type GenerateResult = z.infer<typeof GenerateResult>;
export type SupportTicket = z.infer<typeof SupportTicket>;
export type SupportTicketComment = z.infer<typeof SupportTicketComment>;
export type MarketerProfile = z.infer<typeof MarketerProfile>;
export type MarketerAgreement = z.infer<typeof MarketerAgreement>;
export type Commission = z.infer<typeof Commission>;
export type CommissionRow = z.infer<typeof CommissionRow>;
export type Referral = z.infer<typeof Referral>;
export type MarketerListRow = z.infer<typeof MarketerListRow>;
export type MarketerLogin = z.infer<typeof MarketerLogin>;
export type MarketerInvited = z.infer<typeof MarketerInvited>;
export type MarketerDetail = z.infer<typeof MarketerDetail>;
export type MarketerMe = z.infer<typeof MarketerMe>;
export type MarketerBusiness = z.infer<typeof MarketerBusiness>;
export type CommissionStatement = z.infer<typeof CommissionStatement>;
export type Integration = z.infer<typeof Integration>;
export type PlatformSettings = z.infer<typeof PlatformSettings>;
export type Settlement = z.infer<typeof Settlement>;
export type PayoutBatch = z.infer<typeof PayoutBatch>;
export type FailedPayout = z.infer<typeof FailedPayout>;
export type RunResult = z.infer<typeof RunResult>;
export type BatchDetail = z.infer<typeof BatchDetail>;
export type RetryResult = z.infer<typeof RetryResult>;
export type PaymentSummary = z.infer<typeof PaymentSummary>;
export type AdminPayment = z.infer<typeof AdminPayment>;
export type SupportAccessGrant = z.infer<typeof SupportAccessGrant>;
export type SupportAccessToken = z.infer<typeof SupportAccessToken>;
export type SupportAccessGrantRow = z.infer<typeof SupportAccessGrantRow>;
