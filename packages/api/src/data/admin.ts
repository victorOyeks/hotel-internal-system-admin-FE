import "server-only";

/**
 * The admin portal's data seam: platform-service (`/platform/admin/**`, `/platform/marketer/**`),
 * payment-service (`/payment/admin/**`) and identity's platform staff and support access. Every reader
 * answers from the demo fixtures when its domain is not live, so demo mode keeps working.
 */

import { z } from "zod";
import { api } from "@hospio/api/api/client";
import type {
	AdminPayment,
	Alert,
	ChangeRow,
	Commission,
	CommissionRow,
	FailedPayout,
	FeeStatementResponse,
	Integration,
	MarketerAgreement,
	MarketerProfile,
	PayoutBatch,
	PlatformActivity,
	PlatformChange,
	Referral,
	Settlement,
	SupportTicket,
	SupportTicketComment,
} from "@hospio/api/api/routes-admin";
import { PlatformActivity as PlatformActivitySchema } from "@hospio/api/api/routes-admin";
import {
	type UserSummary,
	UserSummary as UserSummarySchema,
} from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import { demoDelay } from "@hospio/api/demo/mode";
import * as platform from "@hospio/api/demo/fixtures/platform";
import * as extra from "@hospio/api/demo/fixtures/platform-extra";
import { at } from "@hospio/api/demo/fixtures/hotel";
import type { AdminUserRow } from "./types";
import { live } from "./live";
import {
	type AdminActivityRow,
	type AdminChangeRow,
	type AdminPaymentRow,
	type AlertRow,
	type CommissionLine,
	type FailedPayoutItem,
	type FeeRuleRow,
	type FeeStatementItem,
	type FeeStatementStatus,
	type HealthRow,
	type HotelOverviewData,
	type IntegrationItem,
	type MarketerAgreementRow,
	type MarketerBusinessItem,
	type MarketerDetailData,
	type MarketerMeData,
	type MarketerProfileRow,
	type MarketerStatus,
	type OverviewData,
	type Paged,
	type PaymentSummaryData,
	type PayoutBatchDetail,
	type PayoutBatchItem,
	type PlatformSettingsData,
	type ReferralItem,
	type ReferralStage,
	type SettlementItem,
	type SupportAccessGrantItem,
	type TeamMemberRow,
	type TicketDetailData,
	type TicketItem,
	type TicketPriority,
	type TicketStatus,
	type UsageData,
	emptyPage,
} from "./admin-types";

const give = async <T>(value: T): Promise<T> => {
	await demoDelay(40);
	return value;
};

const n = (v: number | null | undefined) => Number(v ?? 0);
const s = (v: string | null | undefined) => v ?? undefined;
const clean = (q: Record<string, string | number | boolean | undefined>) =>
	Object.fromEntries(
		Object.entries(q).filter(
			([, v]) => v !== undefined && v !== "" && v !== null,
		),
	) as Record<string, string | number | boolean>;

const toPage = <A, B>(
	p: {
		content: A[];
		number: number;
		size: number;
		totalElements: number;
		totalPages: number;
	},
	map: (a: A) => B,
): Paged<B> => ({
	content: p.content.map(map),
	page: p.number,
	size: p.size,
	total: p.totalElements,
	totalPages: p.totalPages,
});

/** A client-side page over a demo array, so paged screens behave the same in demo mode. */
const slicePage = <T>(rows: T[], page = 0, size = 25): Paged<T> => ({
	content: rows.slice(page * size, page * size + size),
	page,
	size,
	total: rows.length,
	totalPages: Math.max(1, Math.ceil(rows.length / size)),
});

function fail(where: string, error: unknown) {
	console.error(`${where}:`, error);
}

// ---- mappers -------------------------------------------------------------------------------------

export const toAlertRow = (a: Alert): AlertRow => ({
	id: a.id,
	businessId: s(a.businessId),
	businessName: a.businessName ?? "Platform",
	hotelId: s(a.hotelId),
	kind: a.kind ?? "",
	title: a.title,
	detail: a.detail ?? "",
	tone: a.tone === "danger" || a.tone === "grey" ? a.tone : "warning",
	at: a.openedAt ?? a.createdAt ?? new Date().toISOString(),
});

export const toChangeRow = (
	c: PlatformChange,
	businessName?: string | null,
	madeByName?: string | null,
	undone?: boolean,
): AdminChangeRow => ({
	id: c.id,
	businessId: c.businessId ?? "",
	hotelId: s(c.hotelId),
	businessName: businessName ?? c.businessName ?? "—",
	area: c.area ?? "",
	description: c.description ?? "",
	reason: c.reason ?? "",
	madeBy: madeByName ?? c.madeByName ?? c.madeBy ?? "H.M.S",
	at: c.createdAt ?? new Date().toISOString(),
	undoUntil: c.undoUntil ?? c.createdAt ?? new Date().toISOString(),
	undone: undone ?? c.undone ?? !!c.undoneAt,
	beforeJson: s(c.beforeJson),
	afterJson: s(c.afterJson),
});
const fromChangeRow = (r: ChangeRow) =>
	toChangeRow(r.change, r.businessName, r.madeByName, r.undone);

export const toActivityRow = (a: PlatformActivity): AdminActivityRow => ({
	id: a.id,
	at: a.occurredAt,
	by: a.actorName ?? "System",
	action: a.summary ?? a.eventType ?? "",
	target: a.businessId ? "Business" : "—",
	eventType: a.eventType ?? "",
	businessId: s(a.businessId),
});

const feeStatus = (v: string): FeeStatementStatus =>
	v === "PART_PAID" || v === "PAID" || v === "OVERDUE" ? v : "DUE";
export const toStatementItem = (f: FeeStatementResponse): FeeStatementItem => ({
	id: f.id,
	businessId: f.businessId,
	businessName: f.businessName ?? "—",
	month: f.month,
	baseAmount: n(f.baseAmount),
	feeAmount: n(f.feeAmount),
	paidAmount: n(f.paidAmount),
	outstanding:
		f.outstanding == null ? n(f.feeAmount) - n(f.paidAmount) : n(f.outstanding),
	status: feeStatus(f.status),
	dueOn: s(f.dueOn),
	sentAt: s(f.sentAt),
	lines: (f.lines ?? []).map((l) => ({
		hotelId: s(l.hotelId),
		hotelName: l.hotelName ?? "Hotel",
		base: n(l.base),
		fee: n(l.fee),
	})),
	payments: (f.payments ?? []).map((p) => ({
		id: p.id,
		amount: n(p.amount),
		paidOn: s(p.paidOn),
		reference: s(p.reference),
		recordedBy: p.recordedByName ?? p.recordedBy ?? "—",
	})),
	createdAt: s(f.createdAt),
});

const settlementStatus = (v: string): SettlementItem["status"] =>
	v === "SETTLED" || v === "FAILED" ? v : "PENDING";
export const toSettlementItem = (x: Settlement): SettlementItem => ({
	id: x.id,
	businessId: x.businessId ?? "",
	businessName: x.businessName ?? "—",
	hotelId: s(x.hotelId),
	provider: x.provider ?? "—",
	periodDate: x.periodDate,
	gross: n(x.gross),
	providerFees: n(x.providerFees),
	hmsShare: n(x.hmsShare),
	net: n(x.net),
	paymentCount: n(x.paymentCount),
	status: settlementStatus(x.status),
	settledAt: s(x.settledAt),
	payoutBatchId: s(x.payoutBatchId),
	failureReason: s(x.failureReason),
});
const batchStatus = (v: string): PayoutBatchItem["status"] =>
	v === "PAID" || v === "PART_FAILED" ? v : "PROCESSING";
export const toBatchItem = (b: PayoutBatch): PayoutBatchItem => ({
	id: b.id,
	ref: b.ref,
	createdBy: b.createdByName ?? b.createdBy ?? "System",
	status: batchStatus(b.status),
	total: n(b.total),
	businessCount: b.businessCount,
	settlementCount: n(b.settlementCount),
	paidAt: s(b.paidAt),
	paidOn: s(b.paidOn),
	paidReference: s(b.paidReference),
	createdAt: b.createdAt,
});
export const toFailedItem = (f: FailedPayout): FailedPayoutItem => ({
	id: f.id,
	settlementId: s(f.settlementId),
	payoutBatchId: s(f.payoutBatchId),
	businessId: f.businessId ?? "",
	businessName: f.businessName ?? "—",
	amount: n(f.amount),
	bankLabel: f.bankLabel ?? "—",
	reason: f.reason ?? "—",
	attempts: f.attempts,
	lastTriedAt: s(f.lastTriedAt),
	resolvedAt: s(f.resolvedAt),
});
export const toAdminPaymentRow = (p: AdminPayment): AdminPaymentRow => ({
	id: p.id,
	reference: `PAY-${p.id.slice(0, 6).toUpperCase()}`,
	guestName: p.guestName ?? "Walk-in",
	method: p.method,
	amount: n(p.amount),
	status: p.status,
	providerRef: s(p.providerRef),
	description: p.description ?? "Payment",
	takenBy: p.requestedByName ?? p.requestedBy ?? "—",
	createdAt: p.createdAt,
	bookingId: s(p.bookingId),
	folioId: s(p.folioId),
	terminalId: s(p.terminalId),
});

const priority = (v: string): TicketPriority =>
	v === "LOW" || v === "HIGH" || v === "URGENT" ? v : "NORMAL";
const ticketStatus = (v: string): TicketStatus =>
	v === "IN_PROGRESS" || v === "RESOLVED" ? v : "OPEN";
export const toTicketItem = (t: SupportTicket): TicketItem => ({
	id: t.id,
	businessId: t.businessId ?? "",
	businessName: t.businessName ?? "—",
	hotelId: s(t.hotelId),
	subject: t.subject,
	body: t.body ?? "",
	priority: priority(t.priority),
	status: ticketStatus(t.status),
	openedBy: s(t.openedBy),
	openedByName: t.openedByName ?? "Hotel",
	openedAt: t.openedAt ?? t.createdAt ?? new Date().toISOString(),
	assignedTo: s(t.assignedTo),
	assignedToName: s(t.assignedToName),
	resolution: s(t.resolution),
	resolvedAt: s(t.resolvedAt),
	lastActivityAt: s(t.lastActivityAt),
});
export const toCommentItem = (c: SupportTicketComment) => ({
	id: c.id,
	authorId: s(c.authorId),
	authorName: c.authorName ?? "H.M.S",
	body: c.body,
	internal: c.internal,
	createdAt: c.createdAt ?? new Date().toISOString(),
});

const marketerStatus = (v: string): MarketerStatus =>
	v === "ACTIVE" || v === "ENDED" ? v : "PENDING";
export const toMarketerProfileRow = (
	p: MarketerProfile,
	extra: {
		businesses?: number;
		earnedTotal?: number | null;
		due?: number | null;
	} = {},
): MarketerProfileRow => ({
	id: p.id,
	userId: s(p.userId),
	fullName: p.fullName,
	email: p.email ?? "",
	phone: p.phone ?? "",
	status: marketerStatus(p.status),
	sharePct: n(p.sharePct),
	months: n(p.months),
	bankName: s(p.bankName),
	bankAccount: s(p.bankAccount),
	bankAccountName: s(p.bankAccountName),
	joined: (p.joinedAt ?? p.createdAt ?? new Date().toISOString()).slice(0, 10),
	endedAt: s(p.endedAt),
	referralCode: s(p.referralCode),
	businesses: extra.businesses ?? 0,
	earnedTotal: n(extra.earnedTotal),
	due: n(extra.due),
});
const toAgreementRow = (a: MarketerAgreement): MarketerAgreementRow => ({
	id: a.id,
	businessId: a.businessId ?? "",
	sharePct: n(a.sharePct),
	months: n(a.months),
	whtPct: n(a.whtPct),
	status: a.status,
	startedOn: s(a.startedOn),
	endedOn: s(a.endedOn),
});
const referralStage = (v: string): ReferralStage =>
	v === "CONTACTED" || v === "ONBOARDING" || v === "LIVE" || v === "LOST"
		? v
		: "LEAD";
export const toReferralItem = (r: Referral): ReferralItem => ({
	id: r.id,
	profileId: s(r.profileId),
	hotelName: r.hotelName,
	ownerName: r.ownerName ?? "—",
	phone: r.phone ?? "",
	email: s(r.email),
	city: r.city ?? "",
	stage: referralStage(r.stage),
	note: s(r.note),
	businessId: s(r.businessId),
	sentAt: r.sentAt ?? r.createdAt ?? new Date().toISOString(),
	updatedAt: s(r.updatedAt),
});
export const toCommissionLine = (
	c: Commission,
	marketerName?: string | null,
	businessName?: string | null,
): CommissionLine => ({
	id: c.id,
	businessId: s(c.businessId),
	profileId: s(c.profileId),
	marketerName: marketerName ?? "—",
	businessName: businessName ?? "—",
	month: c.month,
	baseAmount: n(c.baseAmount),
	gross: n(c.gross),
	wht: n(c.wht),
	net: n(c.net),
	status: c.status,
	paidOn: s(c.paidOn) ?? (c.paidAt ? c.paidAt.slice(0, 10) : undefined),
	paidReference: s(c.paidReference),
});
const fromCommissionRow = (r: CommissionRow) =>
	toCommissionLine(r.commission, r.marketerName, r.businessName);

const integrationStatus = (v: string): IntegrationItem["status"] =>
	v === "CONNECTED" || v === "DISCONNECTED" || v === "ERROR"
		? v
		: "NOT_CONFIGURED";
const toIntegrationItem = (i: Integration): IntegrationItem => ({
	key: i.key,
	name: i.name,
	kind: i.kind ?? "",
	status: integrationStatus(i.status),
	detail: i.detail ?? "",
	lastCheck: s(i.lastCheck),
});

const PLATFORM_ROLES = ["SUPER_ADMIN", "SUPPORT", "FINANCE_ADMIN"] as const;
export function toTeamMemberRow(u: UserSummary): TeamMemberRow {
	const platformGrants = u.grants.filter((g) =>
		(PLATFORM_ROLES as readonly string[]).includes(g.role),
	);
	const main = platformGrants.find((g) => !g.paused) ?? platformGrants[0];
	const role = (main?.role ?? "SUPPORT") as AdminUserRow["role"];
	const paused =
		u.status === "PAUSED" ||
		u.status === "SUSPENDED" ||
		(platformGrants.length > 0 && platformGrants.every((g) => g.paused));
	return {
		id: u.id,
		userId: u.id,
		fullName: u.fullName,
		email: u.email,
		phone: u.phone ?? "",
		role,
		status: paused ? "PAUSED" : "ACTIVE",
		lastSignIn: u.lastSignInAt ?? undefined,
		twoStep: u.twoStepEnabled ?? false,
		grantId: main?.id,
		inviteStatus: u.inviteStatus ?? "NONE",
		mustChangePassword: u.mustChangePassword ?? false,
	};
}

// ---- demo fallbacks ------------------------------------------------------------------------------

const demoBizId = (name: string) =>
	platform.demoBusinesses.find((b) => b.name === name)?.id ?? "biz-1";

const demoStatements: FeeStatementItem[] = platform.demoFeeStatements.map(
	(f) => ({
		id: f.id,
		businessId: demoBizId(f.businessName),
		businessName: f.businessName,
		month: f.month,
		baseAmount: f.base,
		feeAmount: f.fee,
		paidAmount: f.paid,
		outstanding: f.fee - f.paid,
		status: f.status,
		dueOn: `${f.month}-05`,
		lines: [{ hotelName: f.businessName, base: f.base, fee: f.fee }],
		payments:
			f.paid > 0
				? [
						{
							id: `${f.id}-p1`,
							amount: f.paid,
							paidOn: `${f.month}-04`,
							reference: "Bank transfer",
							recordedBy: "Bode Fashola",
						},
					]
				: [],
	}),
);

const demoTickets: TicketItem[] = platform.demoTickets.map((t) => ({
	id: t.id,
	businessId: demoBizId(t.businessName),
	businessName: t.businessName,
	subject: t.subject,
	body: t.body,
	priority: t.priority,
	status: t.status,
	openedByName: t.openedBy,
	openedAt: t.openedAt,
	assignedToName: t.assignedTo,
	assignedTo: platform.demoAdminUsers.find((a) => a.fullName === t.assignedTo)
		?.id,
	resolution: t.resolution,
	lastActivityAt: t.openedAt,
}));

const demoChanges: AdminChangeRow[] = platform.demoPlatformChanges.map((c) => ({
	...c,
	businessId: demoBizId(c.businessName),
	undone: c.undone ?? false,
}));

const demoAlerts: AlertRow[] = extra.demoSystemAlerts.map((a) => ({
	id: a.id,
	businessId: demoBizId(a.businessName),
	businessName: a.businessName,
	kind: "DEMO",
	title: a.title,
	detail: a.detail,
	tone: a.tone,
	at: a.at,
}));

const demoActivity: AdminActivityRow[] = extra.demoAdminActivity.map((a) => ({
	...a,
	eventType: "ADMIN",
}));

const demoMarketers: MarketerProfileRow[] = platform.demoMarketers.map((m) => ({
	...m,
	referralCode: m.fullName.toLowerCase().replace(/\s+/g, "-"),
	bankName: "GTBank",
	bankAccount: "0123456789",
	bankAccountName: m.fullName,
}));

const demoReferrals: ReferralItem[] = extra.demoReferrals.map((r) => ({
	id: r.id,
	profileId: r.marketerId,
	hotelName: r.hotelName,
	ownerName: r.ownerName,
	phone: r.phone,
	city: r.city,
	stage: r.stage,
	note: r.note,
	sentAt: r.sentOn,
}));

const demoCommissions: CommissionLine[] = extra.demoCommissions.map((c) => ({
	id: c.id,
	profileId: c.marketerId,
	marketerName:
		platform.demoMarketers.find((m) => m.id === c.marketerId)?.fullName ?? "—",
	businessName: c.businessName,
	businessId: demoBizId(c.businessName),
	month: c.month,
	baseAmount: c.hmsShare,
	gross: c.commission,
	wht: c.wht,
	net: c.net,
	status: c.status,
	paidOn: c.paidOn,
}));

const demoSettlements: SettlementItem[] = extra.demoSettlements.map((x) => ({
	id: x.id,
	businessId: x.businessId,
	businessName: x.businessName,
	provider: x.provider,
	periodDate: x.period,
	gross: x.gross,
	providerFees: x.providerFees,
	hmsShare: x.hmsShare,
	net: x.net,
	paymentCount: 0,
	status: x.status,
	settledAt: x.settledAt,
	payoutBatchId: extra.demoPayoutBatches.find((b) => b.ref === x.payoutBatch)
		?.id,
}));

const demoBatches: PayoutBatchItem[] = extra.demoPayoutBatches.map((b) => ({
	id: b.id,
	ref: b.ref,
	createdBy: b.by,
	status: b.status,
	total: b.total,
	businessCount: b.businesses,
	settlementCount: demoSettlements.filter((x) => x.payoutBatchId === b.id)
		.length,
	paidAt: b.status === "PAID" ? b.createdAt : undefined,
	createdAt: b.createdAt,
}));

const demoFailed: FailedPayoutItem[] = extra.demoFailedPayouts.map((f) => ({
	id: f.id,
	businessId: demoBizId(f.businessName),
	businessName: f.businessName,
	amount: f.amount,
	bankLabel: f.bank,
	reason: f.reason,
	attempts: f.attempts,
	lastTriedAt: f.lastTriedAt,
}));

const demoIntegrations: IntegrationItem[] = extra.demoIntegrations.map((i) => ({
	key: i.key,
	name: i.name,
	kind: i.kind,
	status: i.status,
	detail: i.detail,
	lastCheck: i.lastCheck,
}));

const demoTeam: TeamMemberRow[] = platform.demoAdminUsers.map((u) => ({
	...u,
	userId: u.id,
	phone: "",
	grantId: `${u.id}-g0`,
	inviteStatus: "ACCEPTED",
	mustChangePassword: false,
}));

/** The demo marketer: whoever signs in walks through Kunle Oshodi's portal. */
const demoMe = demoMarketers[0];

// ---- the seam ------------------------------------------------------------------------------------

export const adminData = {
	/** GET /platform/admin/overview: everything the dashboard shows. */
	overview: async (): Promise<OverviewData> => {
		if (!live("platform")) {
			const bz = platform.demoBusinesses;
			const byStage: Record<string, number> = {};
			for (const b of bz) byStage[b.stage] = (byStage[b.stage] ?? 0) + 1;
			return give({
				businesses: { total: bz.length, byStage },
				hotels: bz.reduce((a, b) => a + b.hotels, 0),
				rooms: bz.reduce((a, b) => a + b.rooms, 0),
				mrr: bz.reduce((a, b) => a + b.mrr, 0),
				dueFees: demoStatements
					.filter((f) => f.status !== "PAID")
					.reduce((a, f) => a + f.outstanding, 0),
				overdueFees: demoStatements
					.filter((f) => f.status === "OVERDUE")
					.reduce((a, f) => a + f.outstanding, 0),
				openTickets: demoTickets.filter((t) => t.status !== "RESOLVED").length,
				onboardingInProgress: platform.demoOnboarding.filter(
					(o) => o.status === "IN_PROGRESS",
				).length,
				readyForHandover: platform.demoOnboarding.filter(
					(o) => o.status === "READY_FOR_HANDOVER",
				).length,
				alerts: demoAlerts,
				recentChanges: demoChanges,
				recentActivity: demoActivity,
				health: {
					good: bz.filter((b) => b.health >= 70).length,
					watch: bz.filter((b) => b.health >= 40 && b.health < 70).length,
					atRisk: bz.filter((b) => b.health < 40 && b.stage !== "LEAD").length,
				},
			});
		}
		const { data: res, error } = await api(
			"@get/platform/admin/overview",
			await withSession(),
		);
		if (error || !res) {
			fail("platform-service overview", error);
			return {
				businesses: { total: 0, byStage: {} },
				hotels: 0,
				rooms: 0,
				mrr: 0,
				dueFees: 0,
				overdueFees: 0,
				openTickets: 0,
				onboardingInProgress: 0,
				readyForHandover: 0,
				alerts: [],
				recentChanges: [],
				recentActivity: [],
				health: { good: 0, watch: 0, atRisk: 0 },
			};
		}
		const o = res.data;
		return {
			businesses: {
				total: o.businesses.total,
				byStage: o.businesses.byStage ?? {},
			},
			hotels: o.hotels,
			rooms: o.rooms,
			mrr: n(o.mrr),
			dueFees: n(o.dueFees),
			overdueFees: n(o.overdueFees),
			openTickets: o.openTickets,
			onboardingInProgress: o.onboardingInProgress,
			readyForHandover: o.readyForHandover,
			alerts: (o.alerts ?? []).map(toAlertRow),
			recentChanges: (o.recentChanges ?? []).map(fromChangeRow),
			recentActivity: (o.recentActivity ?? []).map(toActivityRow),
			health: o.health ?? { good: 0, watch: 0, atRisk: 0 },
		};
	},

	team: {
		/** identity users with scope=platform: the H.M.S staff (SUPER_ADMIN, SUPPORT, FINANCE_ADMIN). */
		list: async (q?: string): Promise<TeamMemberRow[]> => {
			if (!live("identity"))
				return give(
					demoTeam.filter(
						(u) =>
							!q ||
							`${u.fullName} ${u.email}`
								.toLowerCase()
								.includes(q.toLowerCase()),
					),
				);
			// The typed `@get/identity/users` route strips `scope`, so this goes through the untyped path and parses here.
			const { data: res, error } = await api("/identity/users", {
				...(await withSession()),
				query: clean({ scope: "platform", q }),
			});
			if (error || !res) {
				fail("identity-service platform users", error);
				return [];
			}
			const parsed = z
				.object({ data: z.array(UserSummarySchema) })
				.safeParse(res);
			if (!parsed.success) {
				fail("identity-service platform users", parsed.error);
				return [];
			}
			return parsed.data.data
				.map(toTeamMemberRow)
				.sort((a, b) => a.fullName.localeCompare(b.fullName));
		},
	},

	fees: {
		statements: async (
			query: {
				businessId?: string;
				status?: string;
				month?: string;
				page?: number;
				size?: number;
			} = {},
		): Promise<Paged<FeeStatementItem>> => {
			if (!live("platform"))
				return give(
					slicePage(
						demoStatements.filter(
							(f) =>
								(!query.businessId || f.businessId === query.businessId) &&
								(!query.status || f.status === query.status) &&
								(!query.month || f.month === query.month),
						),
						query.page,
						query.size,
					),
				);
			const { data: res, error } = await api(
				"@get/platform/admin/fees/statements",
				{
					...(await withSession()),
					query: clean({
						...query,
						page: query.page ?? 0,
						size: query.size ?? 25,
					}),
				},
			);
			if (error || !res) {
				fail("platform-service statements", error);
				return emptyPage(query.size);
			}
			return toPage(res.data, toStatementItem);
		},
		/** Every statement that is not paid, for the KPIs (first 200). */
		open: async (): Promise<FeeStatementItem[]> => {
			if (!live("platform"))
				return give(demoStatements.filter((f) => f.status !== "PAID"));
			const [due, part, overdue] = await Promise.all(
				["DUE", "PART_PAID", "OVERDUE"].map((status) =>
					adminData.fees.statements({ status, size: 200 }),
				),
			);
			return [...due.content, ...part.content, ...overdue.content];
		},
		statement: async (id: string): Promise<FeeStatementItem | null> => {
			if (!live("platform"))
				return give(demoStatements.find((f) => f.id === id) ?? null);
			const { data: res, error } = await api(
				"@get/platform/admin/fees/statements/:id",
				{ ...(await withSession()), params: { id } },
			);
			if (error || !res) return null;
			return toStatementItem(res.data);
		},
		rules: async (businessId: string): Promise<FeeRuleRow[]> => {
			if (!live("platform")) {
				const b = platform.demoBusinesses.find((x) => x.id === businessId);
				return give(
					b?.feeValue
						? [
								{
									id: `rule-${b.id}`,
									businessId: b.id,
									model: b.feeModel.includes("%")
										? "PERCENT_OF_PAYMENTS"
										: "PER_ROOM_NIGHT",
									value: b.feeValue,
									startsOn: b.since,
								},
							]
						: [],
				);
			}
			const { data: res, error } = await api("@get/platform/admin/fees/rules", {
				...(await withSession()),
				query: { businessId },
			});
			if (error || !res) return [];
			return res.data.map((r) => ({
				id: r.id,
				businessId: r.businessId ?? businessId,
				model: r.model,
				value: n(r.value),
				startsOn: s(r.startsOn),
				endsOn: s(r.endsOn),
			}));
		},
	},

	payments: {
		settlements: async (
			query: {
				businessId?: string;
				status?: string;
				from?: string;
				to?: string;
				page?: number;
				size?: number;
			} = {},
		): Promise<Paged<SettlementItem>> => {
			if (!live("payment"))
				return give(
					slicePage(
						demoSettlements.filter(
							(x) =>
								(!query.businessId || x.businessId === query.businessId) &&
								(!query.status || x.status === query.status) &&
								(!query.from || x.periodDate >= query.from) &&
								(!query.to || x.periodDate <= query.to),
						),
						query.page,
						query.size,
					),
				);
			const { data: res, error } = await api("@get/payment/admin/settlements", {
				...(await withSession()),
				query: clean({
					...query,
					page: query.page ?? 0,
					size: query.size ?? 25,
				}),
			});
			if (error || !res) {
				fail("payment-service settlements", error);
				return emptyPage(query.size);
			}
			return toPage(res.data, toSettlementItem);
		},
		batches: async (
			query: { page?: number; size?: number } = {},
		): Promise<Paged<PayoutBatchItem>> => {
			if (!live("payment"))
				return give(slicePage(demoBatches, query.page, query.size));
			const { data: res, error } = await api(
				"@get/payment/admin/payouts/batches",
				{
					...(await withSession()),
					query: { page: query.page ?? 0, size: query.size ?? 25 },
				},
			);
			if (error || !res) {
				fail("payment-service batches", error);
				return emptyPage(query.size);
			}
			return toPage(res.data, toBatchItem);
		},
		batch: async (id: string): Promise<PayoutBatchDetail | null> => {
			if (!live("payment")) {
				const b = demoBatches.find((x) => x.id === id);
				return give(
					b
						? {
								batch: b,
								settlements: demoSettlements.filter(
									(x) => x.payoutBatchId === id,
								),
							}
						: null,
				);
			}
			const { data: res, error } = await api(
				"@get/payment/admin/payouts/batches/:id",
				{ ...(await withSession()), params: { id } },
			);
			if (error || !res) return null;
			return {
				batch: toBatchItem(res.data.batch),
				settlements: (res.data.settlements ?? []).map(toSettlementItem),
			};
		},
		failed: async (
			query: { page?: number; size?: number } = {},
		): Promise<Paged<FailedPayoutItem>> => {
			if (!live("payment"))
				return give(slicePage(demoFailed, query.page, query.size));
			const { data: res, error } = await api(
				"@get/payment/admin/payouts/failed",
				{
					...(await withSession()),
					query: { page: query.page ?? 0, size: query.size ?? 25 },
				},
			);
			if (error || !res) {
				fail("payment-service failed payouts", error);
				return emptyPage(query.size);
			}
			return toPage(res.data, toFailedItem);
		},
		/** The cross-business payment list (view only). */
		list: async (
			query: {
				businessId?: string;
				hotelId?: string;
				status?: string;
				from?: string;
				to?: string;
				page?: number;
				size?: number;
			} = {},
		): Promise<Paged<AdminPaymentRow>> => {
			if (!live("payment")) return give(emptyPage<AdminPaymentRow>(query.size));
			const { data: res, error } = await api("@get/payment/admin/payments", {
				...(await withSession()),
				query: clean({
					...query,
					page: query.page ?? 0,
					size: query.size ?? 25,
				}),
			});
			if (error || !res) {
				fail("payment-service admin payments", error);
				return emptyPage(query.size);
			}
			return toPage(res.data, toAdminPaymentRow);
		},
		/** GET /payment/admin/summary for one business (or the whole platform when the server allows no businessId). */
		summary: async (
			query: { businessId?: string; from?: string; to?: string } = {},
		): Promise<PaymentSummaryData> => {
			if (!live("payment")) {
				const rows = demoSettlements.filter(
					(x) => !query.businessId || x.businessId === query.businessId,
				);
				const providers = Array.from(new Set(rows.map((r) => r.provider)));
				return give({
					gross: rows.reduce((a, r) => a + r.gross, 0),
					count: rows.length,
					byProvider: providers.map((p) => ({
						provider: p,
						gross: rows
							.filter((r) => r.provider === p)
							.reduce((a, r) => a + r.gross, 0),
						count: rows.filter((r) => r.provider === p).length,
					})),
					byHotel: [],
				});
			}
			const { data: res, error } = await api("@get/payment/admin/summary", {
				...(await withSession()),
				query: clean(query),
			});
			if (error || !res)
				return { gross: 0, count: 0, byProvider: [], byHotel: [] };
			return {
				gross: n(res.data.gross),
				count: res.data.count,
				byProvider: (res.data.byProvider ?? []).map((p) => ({
					provider: p.provider ?? "—",
					gross: n(p.gross),
					count: p.count,
				})),
				byHotel: (res.data.byHotel ?? []).map((h) => ({
					hotelId: h.hotelId ?? "",
					gross: n(h.gross),
					count: h.count,
				})),
			};
		},
	},

	support: {
		tickets: async (
			query: {
				status?: string;
				priority?: string;
				businessId?: string;
				assignedTo?: string;
				q?: string;
				page?: number;
				size?: number;
			} = {},
		): Promise<Paged<TicketItem>> => {
			if (!live("platform"))
				return give(
					slicePage(
						demoTickets.filter(
							(t) =>
								(!query.status || t.status === query.status) &&
								(!query.priority || t.priority === query.priority) &&
								(!query.businessId || t.businessId === query.businessId) &&
								(!query.assignedTo || t.assignedTo === query.assignedTo) &&
								(!query.q ||
									`${t.subject} ${t.body} ${t.businessName}`
										.toLowerCase()
										.includes(query.q.toLowerCase())),
						),
						query.page,
						query.size,
					),
				);
			const { data: res, error } = await api(
				"@get/platform/admin/support/tickets",
				{
					...(await withSession()),
					query: clean({
						...query,
						page: query.page ?? 0,
						size: query.size ?? 25,
					}),
				},
			);
			if (error || !res) {
				fail("platform-service tickets", error);
				return emptyPage(query.size);
			}
			return toPage(res.data, toTicketItem);
		},
		ticket: async (id: string): Promise<TicketDetailData | null> => {
			if (!live("platform")) {
				const t = demoTickets.find((x) => x.id === id);
				return give(
					t
						? {
								ticket: t,
								comments:
									t.status === "RESOLVED"
										? [
												{
													id: `${t.id}-c1`,
													authorName: t.assignedToName ?? "H.M.S",
													body: t.resolution ?? "Resolved",
													internal: false,
													createdAt: at(-1, 15),
												},
											]
										: [],
							}
						: null,
				);
			}
			const { data: res, error } = await api(
				"@get/platform/admin/support/tickets/:id",
				{ ...(await withSession()), params: { id } },
			);
			if (error || !res) return null;
			return {
				ticket: toTicketItem(res.data.ticket),
				comments: (res.data.comments ?? []).map(toCommentItem),
			};
		},
	},

	marketers: {
		list: async (
			query: { status?: string; q?: string } = {},
		): Promise<MarketerProfileRow[]> => {
			if (!live("platform"))
				return give(
					demoMarketers.filter(
						(m) =>
							(!query.status || m.status === query.status) &&
							(!query.q ||
								`${m.fullName} ${m.email}`
									.toLowerCase()
									.includes(query.q.toLowerCase())),
					),
				);
			const { data: res, error } = await api("@get/platform/admin/marketers", {
				...(await withSession()),
				query: clean(query),
			});
			if (error || !res) {
				fail("platform-service marketers", error);
				return [];
			}
			return res.data.map((r) => toMarketerProfileRow(r.profile, r));
		},
		get: async (id: string): Promise<MarketerDetailData | null> => {
			if (!live("platform")) {
				const m = demoMarketers.find((x) => x.id === id);
				if (!m) return give(null);
				const commissions = demoCommissions.filter((c) => c.profileId === id);
				return give({
					profile: m,
					agreements: platform.demoBusinesses
						.filter((b) => b.marketer === m.fullName)
						.map((b) => ({
							id: `ag-${b.id}`,
							businessId: b.id,
							sharePct: m.sharePct,
							months: m.months,
							whtPct: 5,
							status: "ACTIVE",
							startedOn: b.since,
						})),
					referrals: demoReferrals.filter((r) => r.profileId === id),
					commissions,
					earnedTotal: m.earnedTotal,
					due: m.due,
					paid: commissions
						.filter((c) => c.status === "PAID")
						.reduce((a, c) => a + c.net, 0),
				});
			}
			const { data: res, error } = await api(
				"@get/platform/admin/marketers/:id",
				{ ...(await withSession()), params: { id } },
			);
			if (error || !res) return null;
			const d = res.data;
			return {
				profile: toMarketerProfileRow(d.profile, {
					businesses: d.agreements?.length ?? 0,
					earnedTotal: d.earnedTotal,
					due: d.due,
				}),
				agreements: (d.agreements ?? []).map(toAgreementRow),
				referrals: (d.referrals ?? []).map(toReferralItem),
				commissions: (d.commissions ?? []).map(fromCommissionRow),
				earnedTotal: n(d.earnedTotal),
				due: n(d.due),
				paid: n(d.paid),
			};
		},
		referrals: async (
			query: {
				profileId?: string;
				stage?: string;
				page?: number;
				size?: number;
			} = {},
		): Promise<Paged<ReferralItem>> => {
			if (!live("platform"))
				return give(
					slicePage(
						demoReferrals.filter(
							(r) =>
								(!query.profileId || r.profileId === query.profileId) &&
								(!query.stage || r.stage === query.stage),
						),
						query.page,
						query.size,
					),
				);
			const { data: res, error } = await api("@get/platform/admin/referrals", {
				...(await withSession()),
				query: clean({
					...query,
					page: query.page ?? 0,
					size: query.size ?? 50,
				}),
			});
			if (error || !res) return emptyPage(query.size);
			return toPage(res.data, toReferralItem);
		},
		commissions: async (
			query: {
				profileId?: string;
				status?: string;
				month?: string;
				page?: number;
				size?: number;
			} = {},
		): Promise<Paged<CommissionLine>> => {
			if (!live("platform"))
				return give(
					slicePage(
						demoCommissions.filter(
							(c) =>
								(!query.profileId || c.profileId === query.profileId) &&
								(!query.status || c.status === query.status) &&
								(!query.month || c.month === query.month),
						),
						query.page,
						query.size,
					),
				);
			const { data: res, error } = await api(
				"@get/platform/admin/commissions",
				{
					...(await withSession()),
					query: clean({
						...query,
						page: query.page ?? 0,
						size: query.size ?? 50,
					}),
				},
			);
			if (error || !res) return emptyPage(query.size);
			return toPage(res.data, fromCommissionRow);
		},
	},

	/** The marketer portal: the signed-in marketer's own profile, businesses, referrals and commissions. */
	marketer: {
		me: async (): Promise<MarketerMeData | null> => {
			if (!live("platform"))
				return give({
					profile: demoMe,
					totals: {
						earnedTotal: demoMe.earnedTotal,
						due: demoMe.due,
						paid: demoMe.earnedTotal,
						businesses: demoMe.businesses,
						referrals: demoReferrals.filter((r) => r.profileId === demoMe.id)
							.length,
					},
				});
			const { data: res, error } = await api(
				"@get/platform/marketer/me",
				await withSession(),
			);
			if (error || !res) {
				fail("platform-service marketer me", error);
				return null;
			}
			const t = res.data.totals;
			return {
				profile: toMarketerProfileRow(res.data.profile, {
					businesses: t.businesses,
					earnedTotal: t.earnedTotal,
					due: t.due,
				}),
				totals: {
					earnedTotal: n(t.earnedTotal),
					due: n(t.due),
					paid: n(t.paid),
					businesses: t.businesses,
					referrals: t.referrals,
				},
			};
		},
		businesses: async (): Promise<MarketerBusinessItem[]> => {
			if (!live("platform"))
				return give(
					platform.demoBusinesses
						.filter((b) => b.marketer === demoMe.fullName)
						.map((b) => ({
							id: b.id,
							name: b.name,
							city: b.city,
							stage: b.stage,
							hotels: b.hotels,
							since: b.since,
							sharePct: demoMe.sharePct,
							lastMonthShare: Math.round((b.mrr * demoMe.sharePct) / 100),
							lastMonth: "2026-10",
						})),
				);
			const { data: res, error } = await api(
				"@get/platform/marketer/businesses",
				await withSession(),
			);
			if (error || !res) return [];
			return res.data.map((b) => ({
				id: b.id,
				name: b.name,
				city: b.city ?? "",
				stage: b.stage ?? "LIVE",
				hotels: b.hotels,
				since: s(b.since),
				sharePct: n(b.sharePct),
				lastMonthShare: n(b.lastMonthShare),
				lastMonth: s(b.lastMonth),
			}));
		},
		referrals: async (): Promise<ReferralItem[]> => {
			if (!live("platform"))
				return give(demoReferrals.filter((r) => r.profileId === demoMe.id));
			const { data: res, error } = await api(
				"@get/platform/marketer/referrals",
				await withSession(),
			);
			if (error || !res) return [];
			return res.data
				.map(toReferralItem)
				.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
		},
		commissions: async (month?: string): Promise<CommissionLine[]> => {
			if (!live("platform"))
				return give(
					demoCommissions.filter(
						(c) => c.profileId === demoMe.id && (!month || c.month === month),
					),
				);
			const { data: res, error } = await api(
				"@get/platform/marketer/commissions",
				{ ...(await withSession()), query: clean({ month }) },
			);
			if (error || !res) return [];
			return res.data
				.map(fromCommissionRow)
				.sort((a, b) => b.month.localeCompare(a.month));
		},
	},

	changes: {
		list: async (
			query: {
				businessId?: string;
				madeBy?: string;
				from?: string;
				to?: string;
				page?: number;
				size?: number;
			} = {},
		): Promise<Paged<AdminChangeRow>> => {
			if (!live("platform"))
				return give(
					slicePage(
						demoChanges.filter(
							(c) =>
								(!query.businessId || c.businessId === query.businessId) &&
								(!query.madeBy || c.madeBy === query.madeBy),
						),
						query.page,
						query.size,
					),
				);
			const { data: res, error } = await api("@get/platform/admin/changes", {
				...(await withSession()),
				query: clean({
					...query,
					page: query.page ?? 0,
					size: query.size ?? 25,
				}),
			});
			if (error || !res) {
				fail("platform-service changes", error);
				return emptyPage(query.size);
			}
			return toPage(res.data, fromChangeRow);
		},
	},

	/** GET /platform/activity: the activity log, platform actors only with `byPlatform`, one business with `businessId`. */
	activity: async (
		query: {
			businessId?: string;
			byPlatform?: boolean;
			page?: number;
			size?: number;
		} = {},
	): Promise<Paged<AdminActivityRow>> => {
		if (!live("platform"))
			return give(slicePage(demoActivity, query.page, query.size));
		const { data: res, error } = await api("/platform/activity", {
			...(await withSession()),
			query: clean({ ...query, page: query.page ?? 0, size: query.size ?? 25 }),
		});
		if (error || !res) {
			fail("platform-service activity", error);
			return emptyPage(query.size);
		}
		const parsed = z
			.object({
				data: z.object({
					content: z.array(PlatformActivitySchema),
					number: z.number(),
					size: z.number(),
					totalElements: z.number(),
					totalPages: z.number(),
				}),
			})
			.safeParse(res);
		if (!parsed.success) {
			fail("platform-service activity", parsed.error);
			return emptyPage(query.size);
		}
		return toPage(parsed.data.data, toActivityRow);
	},

	settings: {
		get: async (): Promise<PlatformSettingsData> => {
			if (!live("platform"))
				return give(
					extra.demoPlatformSettings as unknown as PlatformSettingsData,
				);
			const { data: res, error } = await api(
				"@get/platform/admin/settings",
				await withSession(),
			);
			if (error || !res) {
				fail("platform-service settings", error);
				return { general: {}, fees: {}, security: {} };
			}
			return {
				general: res.data.general ?? {},
				fees: res.data.fees ?? {},
				security: res.data.security ?? {},
			};
		},
		integrations: async (): Promise<IntegrationItem[]> => {
			if (!live("platform")) return give(demoIntegrations);
			const { data: res, error } = await api(
				"@get/platform/admin/integrations",
				await withSession(),
			);
			if (error || !res) {
				fail("platform-service integrations", error);
				return [];
			}
			return res.data.map(toIntegrationItem);
		},
	},

	alerts: {
		list: async (
			query: { businessId?: string; open?: boolean } = { open: true },
		): Promise<AlertRow[]> => {
			if (!live("platform"))
				return give(
					demoAlerts.filter(
						(a) => !query.businessId || a.businessId === query.businessId,
					),
				);
			const { data: res, error } = await api("@get/platform/admin/alerts", {
				...(await withSession()),
				query: clean({
					businessId: query.businessId,
					open: query.open ?? true,
				}),
			});
			if (error || !res) return [];
			return res.data.map(toAlertRow);
		},
	},

	health: {
		list: async (businessId?: string): Promise<HealthRow[]> => {
			if (!live("platform"))
				return give(
					platform.demoBusinesses
						.filter((b) => !businessId || b.id === businessId)
						.map((b) => ({
							businessId: b.id,
							score: b.health,
							factors: { adoption: b.adoption },
							computedAt: at(0, 6),
						})),
				);
			const { data: res, error } = await api("@get/platform/admin/health", {
				...(await withSession()),
				query: clean({ businessId }),
			});
			if (error || !res) return [];
			return res.data.map((h) => {
				let factors: Record<string, unknown> = {};
				try {
					factors = h.factors
						? (JSON.parse(h.factors) as Record<string, unknown>)
						: {};
				} catch {
					factors = {};
				}
				return {
					businessId: h.businessId ?? "",
					score: h.score,
					factors,
					computedAt: s(h.computedAt),
				};
			});
		},
	},

	/** GET /platform/admin/businesses/{id}/usage: the Usage tab. */
	usage: async (businessId: string): Promise<UsageData | null> => {
		if (!live("platform")) {
			const b = platform.demoBusinesses.find((x) => x.id === businessId);
			const weeks = Array.from({ length: 8 }, (_, i) => ({
				weekStart: new Date(Date.now() - (7 - i) * 7 * 86_400_000)
					.toISOString()
					.slice(0, 10),
				bookings: 20 + i * 4,
				payments: 30 + i * 5,
				messages: 10 + i * 2,
			}));
			return give({
				businessId,
				activeUsers7d: Math.round((b?.adoption ?? 50) / 10),
				activeUsers30d: Math.round((b?.adoption ?? 50) / 6),
				bookings30d: 140,
				payments30d: 210,
				messages30d: 60,
				weeks,
				features: {
					pos: true,
					whatsapp: businessId !== "biz-5",
					nightAudit: true,
				},
			});
		}
		const { data: res, error } = await api(
			"@get/platform/admin/businesses/:id/usage",
			{ ...(await withSession()), params: { id: businessId } },
		);
		if (error || !res) {
			fail("platform-service usage", error);
			return null;
		}
		const u = res.data;
		return {
			businessId: u.businessId,
			activeUsers7d: u.activeUsers7d,
			activeUsers30d: u.activeUsers30d,
			bookings30d: u.bookings30d,
			payments30d: u.payments30d,
			messages30d: u.messages30d,
			weeks: u.weeks ?? [],
			features: u.features ?? {},
		};
	},

	/** GET /platform/admin/businesses/{id}/hotels/{hotelId}/overview: one hotel's day, gathered from the services. */
	hotelOverview: async (
		businessId: string,
		hotelId: string,
	): Promise<HotelOverviewData | null> => {
		if (!live("platform"))
			return give({
				hotelId,
				businessId,
				name: "Hotel",
				managerName: "—",
				rooms: 40,
				occupiedRooms: 27,
				occupancyPct: 68,
				arrivalsToday: 6,
				departuresToday: 4,
				openFolios: 27,
				paymentsTodayCount: 12,
				paymentsTodayGross: 485000,
			});
		const { data: res, error } = await api(
			"@get/platform/admin/businesses/:id/hotels/:hotelId/overview",
			{ ...(await withSession()), params: { id: businessId, hotelId } },
		);
		if (error || !res) {
			fail("platform-service hotel overview", error);
			return null;
		}
		const h = res.data;
		return {
			hotelId: h.hotelId,
			businessId: s(h.businessId),
			name: h.name ?? "Hotel",
			managerName: s(h.managerName),
			rooms: n(h.rooms),
			occupiedRooms: n(h.occupiedRooms),
			occupancyPct: n(h.occupancyPct),
			arrivalsToday: n(h.arrivalsToday),
			departuresToday: n(h.departuresToday),
			openFolios: n(h.openFolios),
			paymentsTodayCount: n(h.paymentsTodayCount),
			paymentsTodayGross: n(h.paymentsTodayGross),
		};
	},

	/** GET /identity/support-access?businessId=: who looked at a business as its owner, and why. */
	supportAccess: async (
		businessId: string,
	): Promise<SupportAccessGrantItem[]> => {
		if (!live("identity")) return give([]);
		const { data: res, error } = await api("@get/identity/support-access", {
			...(await withSession()),
			query: { businessId },
		});
		if (error || !res) return [];
		return res.data.map((g) => ({
			id: g.id,
			adminId: s(g.adminId),
			adminName: g.adminName ?? "H.M.S",
			businessId: g.businessId ?? businessId,
			reason: g.reason ?? "",
			createdAt: s(g.createdAt),
			expiresAt: s(g.expiresAt),
			expired: g.expired,
		}));
	},
};

export type AdminData = typeof adminData;
