/**
 * The shapes the admin portal and the marketer portal render. They follow platform-service and
 * payment-service (hospio-backend/docs/admin-portal.md); `data/admin.ts` maps the API (or the demo
 * fixtures) onto them so the screens never see the difference. Money in naira, dates ISO strings.
 */

import type { Delivery } from "@hospio/api/api/routes-admin";
import type { AdminUserRow, PlatformChangeRow } from "./types";

export type { Delivery };

export type Paged<T> = {
	content: T[];
	page: number;
	size: number;
	total: number;
	totalPages: number;
};

export const emptyPage = <T>(size = 25): Paged<T> => ({
	content: [],
	page: 0,
	size,
	total: 0,
	totalPages: 0,
});

/** Anything that may carry the messages the platform would have sent. */
export type WithDeliveries<T> = T & { deliveries?: Delivery[] };

// ---- dashboard -----------------------------------------------------------------------------------

export type AlertRow = {
	id: string;
	businessId?: string;
	businessName: string;
	hotelId?: string;
	kind: string;
	title: string;
	detail: string;
	tone: "danger" | "warning" | "grey";
	at: string;
};

export type AdminChangeRow = PlatformChangeRow & {
	businessId: string;
	hotelId?: string;
	beforeJson?: string;
	afterJson?: string;
};

export type AdminActivityRow = {
	id: string;
	at: string;
	by: string;
	action: string;
	target: string;
	eventType: string;
	businessId?: string;
};

export type OverviewData = {
	businesses: { total: number; byStage: Record<string, number> };
	hotels: number;
	rooms: number;
	mrr: number;
	dueFees: number;
	overdueFees: number;
	openTickets: number;
	onboardingInProgress: number;
	readyForHandover: number;
	alerts: AlertRow[];
	recentChanges: AdminChangeRow[];
	recentActivity: AdminActivityRow[];
	health: { good: number; watch: number; atRisk: number };
};

export type HealthRow = {
	businessId: string;
	score: number;
	factors: Record<string, unknown>;
	computedAt?: string;
};

export type UsageData = {
	businessId: string;
	activeUsers7d: number;
	activeUsers30d: number;
	bookings30d: number;
	payments30d: number;
	messages30d: number;
	weeks: {
		weekStart: string;
		bookings: number;
		payments: number;
		messages: number;
	}[];
	features: Record<string, boolean>;
};

export type HotelOverviewData = {
	hotelId: string;
	businessId?: string;
	name: string;
	managerName?: string;
	rooms: number;
	occupiedRooms: number;
	occupancyPct: number;
	arrivalsToday: number;
	departuresToday: number;
	openFolios: number;
	paymentsTodayCount: number;
	paymentsTodayGross: number;
};

// ---- team ----------------------------------------------------------------------------------------

export type TeamMemberRow = AdminUserRow & {
	userId: string;
	phone: string;
	grantId?: string;
	inviteStatus: "PENDING" | "ACCEPTED" | "EXPIRED" | "NONE";
	mustChangePassword: boolean;
};

// ---- fees ----------------------------------------------------------------------------------------

export type FeeStatementStatus = "DUE" | "PART_PAID" | "PAID" | "OVERDUE";
export type FeeLineRow = {
	hotelId?: string;
	hotelName: string;
	base: number;
	fee: number;
};
export type FeePaymentRow = {
	id: string;
	amount: number;
	paidOn?: string;
	reference?: string;
	recordedBy: string;
};
export type FeeStatementItem = {
	id: string;
	businessId: string;
	businessName: string;
	month: string;
	baseAmount: number;
	feeAmount: number;
	paidAmount: number;
	outstanding: number;
	status: FeeStatementStatus;
	dueOn?: string;
	sentAt?: string;
	lines: FeeLineRow[];
	payments: FeePaymentRow[];
	createdAt?: string;
};
export type FeeRuleRow = {
	id: string;
	businessId: string;
	model: string;
	value: number;
	startsOn?: string;
	endsOn?: string;
};
export type GenerateStatementsResult = {
	created: number;
	skipped: number;
	notes: string[];
};

// ---- payments ------------------------------------------------------------------------------------

export type SettlementStatus = "PENDING" | "SETTLED" | "FAILED";
export type SettlementItem = {
	id: string;
	businessId: string;
	businessName: string;
	hotelId?: string;
	provider: string;
	periodDate: string;
	gross: number;
	providerFees: number;
	hmsShare: number;
	net: number;
	paymentCount: number;
	status: SettlementStatus;
	settledAt?: string;
	payoutBatchId?: string;
	failureReason?: string;
};
export type PayoutBatchStatus = "PROCESSING" | "PAID" | "PART_FAILED";
export type PayoutBatchItem = {
	id: string;
	ref: string;
	createdBy: string;
	status: PayoutBatchStatus;
	total: number;
	businessCount: number;
	settlementCount: number;
	paidAt?: string;
	paidOn?: string;
	paidReference?: string;
	createdAt: string;
};
export type PayoutBatchDetail = {
	batch: PayoutBatchItem;
	settlements: SettlementItem[];
};
export type FailedPayoutItem = {
	id: string;
	settlementId?: string;
	payoutBatchId?: string;
	businessId: string;
	businessName: string;
	amount: number;
	bankLabel: string;
	reason: string;
	attempts: number;
	lastTriedAt?: string;
	resolvedAt?: string;
};
export type PaymentSummaryData = {
	gross: number;
	count: number;
	byProvider: { provider: string; gross: number; count: number }[];
	byHotel: { hotelId: string; gross: number; count: number }[];
};
export type AdminPaymentRow = {
	id: string;
	reference: string;
	guestName: string;
	method: string;
	amount: number;
	status: string;
	providerRef?: string;
	description: string;
	takenBy: string;
	createdAt: string;
	bookingId?: string;
	folioId?: string;
	terminalId?: string;
};
export type RunSettlementsResult = {
	date?: string;
	created: number;
	skipped: number;
};
export type RetryPayoutResult = {
	failedPayoutId: string;
	attempts: number;
	resolved: boolean;
};

// ---- support -------------------------------------------------------------------------------------

export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type TicketItem = {
	id: string;
	businessId: string;
	businessName: string;
	hotelId?: string;
	subject: string;
	body: string;
	priority: TicketPriority;
	status: TicketStatus;
	openedBy?: string;
	openedByName: string;
	openedAt: string;
	assignedTo?: string;
	assignedToName?: string;
	resolution?: string;
	resolvedAt?: string;
	lastActivityAt?: string;
};
export type TicketCommentItem = {
	id: string;
	authorId?: string;
	authorName: string;
	body: string;
	internal: boolean;
	createdAt: string;
};
export type TicketDetailData = {
	ticket: TicketItem;
	comments: TicketCommentItem[];
};

// ---- marketers -----------------------------------------------------------------------------------

export type MarketerStatus = "PENDING" | "ACTIVE" | "ENDED";
export type MarketerProfileRow = {
	id: string;
	userId?: string;
	fullName: string;
	email: string;
	phone: string;
	status: MarketerStatus;
	sharePct: number;
	months: number;
	bankName?: string;
	bankAccount?: string;
	bankAccountName?: string;
	joined: string;
	endedAt?: string;
	referralCode?: string;
	businesses: number;
	earnedTotal: number;
	due: number;
};
export type MarketerAgreementRow = {
	id: string;
	businessId: string;
	sharePct: number;
	months: number;
	whtPct: number;
	status: string;
	startedOn?: string;
	endedOn?: string;
};
export type ReferralStage =
	| "LEAD"
	| "CONTACTED"
	| "ONBOARDING"
	| "LIVE"
	| "LOST";
export type ReferralItem = {
	id: string;
	profileId?: string;
	hotelName: string;
	ownerName: string;
	phone: string;
	email?: string;
	city: string;
	stage: ReferralStage;
	note?: string;
	businessId?: string;
	sentAt: string;
	updatedAt?: string;
};
export type CommissionStatus = "DUE" | "PAID" | "WAITING" | string;
export type CommissionLine = {
	id: string;
	businessId?: string;
	profileId?: string;
	marketerName: string;
	businessName: string;
	month: string;
	baseAmount: number;
	gross: number;
	wht: number;
	net: number;
	status: CommissionStatus;
	paidOn?: string;
	paidReference?: string;
};
export type MarketerDetailData = {
	profile: MarketerProfileRow;
	agreements: MarketerAgreementRow[];
	referrals: ReferralItem[];
	commissions: CommissionLine[];
	earnedTotal: number;
	due: number;
	paid: number;
};
export type MarketerLoginData = {
	userId: string;
	temporaryPassword?: string;
	temporaryPasswordExpiresAt?: string;
	inviteToken?: string;
	inviteExpiresAt?: string;
};
export type MarketerInvitedData = WithDeliveries<{
	profile: MarketerProfileRow;
	login?: MarketerLoginData;
}>;

/** The marketer portal's own view. */
export type MarketerMeData = {
	profile: MarketerProfileRow;
	totals: {
		earnedTotal: number;
		due: number;
		paid: number;
		businesses: number;
		referrals: number;
	};
};
export type MarketerBusinessItem = {
	id: string;
	name: string;
	city: string;
	stage: string;
	hotels: number;
	since?: string;
	sharePct: number;
	lastMonthShare: number;
	lastMonth?: string;
};
export type CommissionStatementData = {
	month: string;
	marketerName: string;
	gross: number;
	wht: number;
	net: number;
	text: string;
};

// ---- settings ------------------------------------------------------------------------------------

export type SettingsGroup = "general" | "fees" | "security";
export type PlatformSettingsData = Record<
	SettingsGroup,
	Record<string, unknown>
>;
export type IntegrationItem = {
	key: string;
	name: string;
	kind: string;
	status: "CONNECTED" | "DISCONNECTED" | "ERROR" | "NOT_CONFIGURED";
	detail: string;
	lastCheck?: string;
};

// ---- support access --------------------------------------------------------------------------------

export type SupportAccessGrantItem = {
	id: string;
	adminId?: string;
	adminName: string;
	businessId: string;
	reason: string;
	createdAt?: string;
	expiresAt?: string;
	expired: boolean;
};
