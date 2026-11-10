"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { Delivery } from "@hospio/api/api/routes-admin";
import { withSession } from "@hospio/api/api/server";
import {
	adminData,
	toChangeRow,
	toCommentItem,
	toCommissionLine,
	toMarketerProfileRow,
	toReferralItem,
	toStatementItem,
	toTicketItem,
} from "@hospio/api/data/admin";
import type {
	AdminChangeRow,
	AlertRow,
	CommissionLine,
	FeeRuleRow,
	FeeStatementItem,
	GenerateStatementsResult,
	HealthRow,
	IntegrationItem,
	MarketerDetailData,
	MarketerInvitedData,
	MarketerProfileRow,
	PlatformSettingsData,
	ReferralItem,
	ReferralStage,
	SettingsGroup,
	SupportAccessGrantItem,
	TicketCommentItem,
	TicketDetailData,
	TicketItem,
	TicketPriority,
	WithDeliveries,
} from "@hospio/api/data/admin-types";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * platform-service writes for the admin portal (fees, support, marketers, changes, settings, alerts,
 * health) and identity's support access. In demo mode each call echoes a plausible result after a short
 * pause so the screens behave the same. Responses that carry `deliveries` keep them: the screen shows
 * what would have been emailed or texted.
 */

const ADMIN_PATHS = [
	"/admin",
	"/admin/fees",
	"/admin/support",
	"/admin/marketers",
	"/admin/changes",
	"/admin/settings",
	"/admin/businesses",
	"/admin/payments",
];
function revalidateAdmin(businessId?: string | null) {
	for (const p of ADMIN_PATHS) revalidatePath(p);
	if (businessId) revalidatePath(`/admin/businesses/${businessId}`, "layout");
}

const demoDeliveries = (
	to: string,
	subject: string,
	text: string,
	kind: Delivery["kind"],
): Delivery[] => [{ channel: "EMAIL", to, subject, text, kind, ref: null }];

// ---- fees ----------------------------------------------------------------------------------------

export async function saveFeeRule(input: {
	businessId: string;
	model: string;
	value: number;
	startsOn: string;
	endsOn?: string;
}): Promise<ActionResult<FeeRuleRow>> {
	if (!live("platform")) {
		await demoDelay(400);
		return { ok: true, data: { id: `rule-${Date.now()}`, ...input } };
	}
	const { data, error } = await api("@post/platform/admin/fees/rules", {
		...(await withSession()),
		body: { ...input, endsOn: input.endsOn ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The fee model could not be saved"),
		};
	revalidateAdmin(input.businessId);
	const r = data.data;
	return {
		ok: true,
		data: {
			id: r.id,
			businessId: r.businessId ?? input.businessId,
			model: r.model,
			value: Number(r.value),
			startsOn: r.startsOn ?? undefined,
			endsOn: r.endsOn ?? undefined,
		},
	};
}

/** GET /platform/admin/fees/rules?businessId= for the fee model modal. */
export async function loadFeeRules(
	businessId: string,
): Promise<ActionResult<FeeRuleRow[]>> {
	return { ok: true, data: await adminData.fees.rules(businessId) };
}

export async function loadStatement(
	id: string,
): Promise<ActionResult<FeeStatementItem>> {
	const s = await adminData.fees.statement(id);
	return s
		? { ok: true, data: s }
		: { ok: false, error: "That statement is no longer there" };
}

/** POST /platform/admin/fees/statements/generate: statements for every live business (or one) for the month. */
export async function generateStatements(input: {
	month: string;
	businessId?: string;
}): Promise<ActionResult<GenerateStatementsResult>> {
	if (!live("platform")) {
		await demoDelay(700);
		return {
			ok: true,
			data: {
				created: 3,
				skipped: 2,
				notes: [
					"Royal Suites Ltd already had a statement",
					"Eko Garden Hotels already had a statement",
				],
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/fees/statements/generate",
		{
			...(await withSession()),
			body: { month: input.month, businessId: input.businessId ?? null },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The statements could not be generated"),
		};
	revalidateAdmin();
	return {
		ok: true,
		data: {
			created: data.data.created,
			skipped: data.data.skipped,
			notes: data.data.notes ?? [],
		},
	};
}

export async function createStatement(input: {
	businessId: string;
	month: string;
	baseAmount: number;
}): Promise<ActionResult<FeeStatementItem>> {
	if (!live("platform")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: `fs-${Date.now()}`,
				businessId: input.businessId,
				businessName: "Business",
				month: input.month,
				baseAmount: input.baseAmount,
				feeAmount: 0,
				paidAmount: 0,
				outstanding: 0,
				status: "DUE",
				lines: [],
				payments: [],
			},
		};
	}
	const { data, error } = await api("@post/platform/admin/fees/statements", {
		...(await withSession()),
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The statement could not be created"),
		};
	revalidateAdmin(input.businessId);
	return { ok: true, data: toStatementItem(data.data) };
}

export async function recordFeePayment(
	statementId: string,
	input: { amount: number; paidOn?: string; reference?: string },
	fallback?: FeeStatementItem,
): Promise<ActionResult<FeeStatementItem>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Statement not found" };
		const paid = fallback.paidAmount + input.amount;
		return {
			ok: true,
			data: {
				...fallback,
				paidAmount: paid,
				outstanding: Math.max(0, fallback.feeAmount - paid),
				status: paid >= fallback.feeAmount ? "PAID" : "PART_PAID",
				payments: [
					...fallback.payments,
					{
						id: `fp-${Date.now()}`,
						amount: input.amount,
						paidOn: input.paidOn ?? new Date().toISOString().slice(0, 10),
						reference: input.reference,
						recordedBy: "You",
					},
				],
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/fees/statements/:id/payments",
		{
			...(await withSession()),
			params: { id: statementId },
			body: {
				amount: input.amount,
				paidOn: input.paidOn ?? null,
				reference: input.reference ?? null,
			},
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The payment could not be recorded"),
		};
	revalidateAdmin(data.data.businessId);
	return { ok: true, data: toStatementItem(data.data) };
}

/** POST /platform/admin/fees/statements/{id}/send: the statement to the owner (echoed as deliveries on staging). */
export async function sendFeeStatement(
	statementId: string,
	fallback?: FeeStatementItem,
): Promise<
	ActionResult<WithDeliveries<{ statementId: string; sentAt: string }>>
> {
	if (!live("platform")) {
		await demoDelay(500);
		return {
			ok: true,
			data: {
				statementId,
				sentAt: new Date().toISOString(),
				deliveries: demoDeliveries(
					"owner@example.com",
					`Your H.M.S statement for ${fallback?.month ?? "this month"}`,
					`Hello,\n\nYour statement for ${fallback?.month ?? "this month"} is ready: ${fallback ? `₦${fallback.feeAmount.toLocaleString("en-NG")}` : ""} due on the 5th.\n\nH.M.S`,
					"FEE_STATEMENT",
				),
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/fees/statements/:id/send",
		{ ...(await withSession()), params: { id: statementId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The statement could not be sent"),
		};
	revalidateAdmin();
	return {
		ok: true,
		data: {
			statementId,
			sentAt: new Date().toISOString(),
			deliveries: data.data.deliveries ?? [],
		},
	};
}

// ---- support -------------------------------------------------------------------------------------

export async function loadTicket(
	id: string,
): Promise<ActionResult<TicketDetailData>> {
	const t = await adminData.support.ticket(id);
	return t
		? { ok: true, data: t }
		: { ok: false, error: "That ticket is no longer there" };
}

export async function openTicketForBusiness(
	input: {
		businessId: string;
		hotelId?: string;
		subject: string;
		body?: string;
		priority?: TicketPriority;
	},
	businessName = "Business",
): Promise<ActionResult<TicketItem>> {
	if (!live("platform")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: `tk-${Math.floor(4421 + Math.random() * 500)}`,
				businessId: input.businessId,
				businessName,
				hotelId: input.hotelId,
				subject: input.subject,
				body: input.body ?? "",
				priority: input.priority ?? "NORMAL",
				status: "OPEN",
				openedByName: "H.M.S (phone)",
				openedAt: new Date().toISOString(),
			},
		};
	}
	const { data, error } = await api("@post/platform/admin/support/tickets", {
		...(await withSession()),
		body: {
			businessId: input.businessId,
			hotelId: input.hotelId ?? null,
			subject: input.subject,
			body: input.body ?? null,
			priority: input.priority ?? "NORMAL",
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The ticket could not be created"),
		};
	revalidateAdmin(input.businessId);
	return { ok: true, data: toTicketItem(data.data) };
}

export async function assignTicket(
	ticketId: string,
	adminId: string,
	fallback?: TicketItem,
	adminName?: string,
): Promise<ActionResult<TicketItem>> {
	if (!live("platform")) {
		await demoDelay(300);
		if (!fallback) return { ok: false, error: "Ticket not found" };
		return {
			ok: true,
			data: {
				...fallback,
				assignedTo: adminId,
				assignedToName: adminName ?? fallback.assignedToName,
				status: fallback.status === "OPEN" ? "IN_PROGRESS" : fallback.status,
			},
		};
	}
	const { data, error } = await api(
		"@put/platform/admin/support/tickets/:id/assign",
		{ ...(await withSession()), params: { id: ticketId }, body: { adminId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The ticket could not be assigned"),
		};
	revalidateAdmin();
	return { ok: true, data: toTicketItem(data.data) };
}

export async function setTicketPriority(
	ticketId: string,
	priority: TicketPriority,
	fallback?: TicketItem,
): Promise<ActionResult<TicketItem>> {
	if (!live("platform")) {
		await demoDelay(300);
		if (!fallback) return { ok: false, error: "Ticket not found" };
		return { ok: true, data: { ...fallback, priority } };
	}
	const { data, error } = await api(
		"@put/platform/admin/support/tickets/:id/priority",
		{ ...(await withSession()), params: { id: ticketId }, body: { priority } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The priority could not be changed"),
		};
	revalidateAdmin();
	return { ok: true, data: toTicketItem(data.data) };
}

/** POST .../comments: an internal note, or a reply that goes to the person who opened the ticket. */
export async function commentTicket(
	ticketId: string,
	input: { body: string; internal: boolean },
	authorName = "You",
): Promise<ActionResult<WithDeliveries<{ comment: TicketCommentItem }>>> {
	if (!live("platform")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				comment: {
					id: `c-${Date.now()}`,
					authorName,
					body: input.body,
					internal: input.internal,
					createdAt: new Date().toISOString(),
				},
				deliveries: input.internal
					? []
					: demoDeliveries(
							"opener@example.com",
							"An update on your ticket",
							input.body,
							"TICKET_UPDATE",
						),
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/support/tickets/:id/comments",
		{ ...(await withSession()), params: { id: ticketId }, body: input },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The comment could not be posted"),
		};
	revalidateAdmin();
	return {
		ok: true,
		data: {
			comment: toCommentItem(data.data.comment),
			deliveries: data.data.deliveries ?? [],
		},
	};
}

export async function resolveTicket(
	ticketId: string,
	resolution: string,
	fallback?: TicketItem,
): Promise<ActionResult<WithDeliveries<{ ticket: TicketItem }>>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Ticket not found" };
		return {
			ok: true,
			data: {
				ticket: {
					...fallback,
					status: "RESOLVED",
					resolution,
					resolvedAt: new Date().toISOString(),
				},
				deliveries: demoDeliveries(
					"opener@example.com",
					`Resolved: ${fallback.subject}`,
					resolution,
					"TICKET_UPDATE",
				),
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/support/tickets/:id/resolve",
		{
			...(await withSession()),
			params: { id: ticketId },
			body: { resolution },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The ticket could not be resolved"),
		};
	revalidateAdmin();
	return {
		ok: true,
		data: {
			ticket: toTicketItem(data.data.ticket),
			deliveries: data.data.deliveries ?? [],
		},
	};
}

export async function reopenTicket(
	ticketId: string,
	fallback?: TicketItem,
): Promise<ActionResult<TicketItem>> {
	if (!live("platform")) {
		await demoDelay(300);
		if (!fallback) return { ok: false, error: "Ticket not found" };
		return {
			ok: true,
			data: {
				...fallback,
				status: "OPEN",
				resolution: undefined,
				resolvedAt: undefined,
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/support/tickets/:id/reopen",
		{ ...(await withSession()), params: { id: ticketId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The ticket could not be reopened"),
		};
	revalidateAdmin();
	return { ok: true, data: toTicketItem(data.data) };
}

// ---- marketers -----------------------------------------------------------------------------------

export async function loadMarketer(
	id: string,
): Promise<ActionResult<MarketerDetailData>> {
	const m = await adminData.marketers.get(id);
	return m
		? { ok: true, data: m }
		: { ok: false, error: "That marketer is no longer there" };
}

/** POST /platform/admin/marketers/invite: the identity login (MARKETER) and the profile; the login is shown once. */
export async function inviteMarketer(input: {
	fullName: string;
	email: string;
	phone?: string;
	sharePct?: number;
	months?: number;
}): Promise<ActionResult<MarketerInvitedData>> {
	if (!live("platform")) {
		await demoDelay(500);
		const profile: MarketerProfileRow = {
			id: `mk-${Date.now()}`,
			fullName: input.fullName,
			email: input.email,
			phone: input.phone ?? "",
			status: "PENDING",
			sharePct: input.sharePct ?? 20,
			months: input.months ?? 24,
			joined: new Date().toISOString().slice(0, 10),
			referralCode: input.fullName.toLowerCase().replace(/\s+/g, "-"),
			businesses: 0,
			earnedTotal: 0,
			due: 0,
		};
		const temporaryPassword = `Hospio-${Math.floor(1000 + Math.random() * 9000)}`;
		return {
			ok: true,
			data: {
				profile,
				login: {
					userId: `u-${Date.now()}`,
					temporaryPassword,
					temporaryPasswordExpiresAt: new Date(
						Date.now() + 72 * 3_600_000,
					).toISOString(),
					inviteToken: `demo-invite-${Date.now().toString(36)}`,
					inviteExpiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
				},
				deliveries: demoDeliveries(
					input.email,
					"You are invited to H.M.S as a marketer",
					`Hi ${input.fullName.split(" ")[0]},\n\nYour temporary password is ${temporaryPassword}. Sign in at the marketer portal and set your own.\n\nH.M.S`,
					"INVITE",
				),
			},
		};
	}
	const { data, error } = await api("@post/platform/admin/marketers/invite", {
		...(await withSession()),
		body: {
			fullName: input.fullName,
			email: input.email,
			phone: input.phone ?? null,
			sharePct: input.sharePct ?? null,
			months: input.months ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				error?.status === 409
					? "Someone already has this email"
					: "The marketer could not be invited",
			),
		};
	revalidateAdmin();
	const d = data.data;
	return {
		ok: true,
		data: {
			profile: toMarketerProfileRow(d.profile),
			login: d.login
				? {
						userId: d.login.userId,
						temporaryPassword: d.login.temporaryPassword ?? undefined,
						temporaryPasswordExpiresAt:
							d.login.temporaryPasswordExpiresAt ?? undefined,
						inviteToken: d.login.inviteToken ?? undefined,
						inviteExpiresAt: d.login.inviteExpiresAt ?? undefined,
					}
				: undefined,
			deliveries: d.deliveries ?? [],
		},
	};
}

/** PUT /platform/admin/marketers/{id}: share, months or status (ACTIVE to approve or reactivate, ENDED to end). */
export async function updateMarketer(
	id: string,
	input: {
		sharePct?: number;
		months?: number;
		status?: "PENDING" | "ACTIVE" | "ENDED";
	},
	fallback?: MarketerProfileRow,
): Promise<ActionResult<MarketerProfileRow>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Marketer not found" };
		return {
			ok: true,
			data: {
				...fallback,
				sharePct: input.sharePct ?? fallback.sharePct,
				months: input.months ?? fallback.months,
				status: input.status ?? fallback.status,
			},
		};
	}
	const { data, error } = await api("@put/platform/admin/marketers/:id", {
		...(await withSession()),
		params: { id },
		body: {
			sharePct: input.sharePct ?? null,
			months: input.months ?? null,
			status: input.status ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The marketer could not be updated"),
		};
	revalidateAdmin();
	return { ok: true, data: toMarketerProfileRow(data.data, fallback) };
}

export async function setReferralStage(
	id: string,
	stage: ReferralStage,
	note?: string,
	fallback?: ReferralItem,
): Promise<ActionResult<ReferralItem>> {
	if (!live("platform")) {
		await demoDelay(300);
		if (!fallback) return { ok: false, error: "Referral not found" };
		return {
			ok: true,
			data: {
				...fallback,
				stage,
				note: note ?? fallback.note,
				updatedAt: new Date().toISOString(),
			},
		};
	}
	const { data, error } = await api("@put/platform/admin/referrals/:id/stage", {
		...(await withSession()),
		params: { id },
		body: { stage, note: note ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The referral could not be moved"),
		};
	revalidateAdmin();
	return { ok: true, data: toReferralItem(data.data) };
}

/** POST /platform/admin/commissions/{id}/pay: marks one commission line paid with the bank reference. */
export async function payCommission(
	id: string,
	input: { reference?: string; paidOn?: string },
	fallback?: CommissionLine,
): Promise<ActionResult<CommissionLine>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Commission not found" };
		return {
			ok: true,
			data: {
				...fallback,
				status: "PAID",
				paidOn: input.paidOn ?? new Date().toISOString().slice(0, 10),
				paidReference: input.reference,
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/commissions/:id/pay",
		{
			...(await withSession()),
			params: { id },
			body: {
				reference: input.reference ?? null,
				paidOn: input.paidOn ?? null,
			},
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The commission could not be marked paid"),
		};
	revalidateAdmin();
	return {
		ok: true,
		data: toCommissionLine(
			data.data,
			fallback?.marketerName,
			fallback?.businessName,
		),
	};
}

// ---- changes by H.M.S ----------------------------------------------------------------------------

export type RecordChangeInput = {
	businessId: string;
	hotelId?: string;
	area: string;
	description: string;
	reason: string;
	before?: unknown;
	after?: unknown;
};

/**
 * POST /platform/admin/changes: the web app records a change after each edit made as H.M.S (business,
 * hotel, setup, users) with the reason and before/after snapshots; the owner can ask support to undo it within 7 days.
 * Exported for the business page's "Edit as H.M.S" flow.
 */
export async function recordChange(
	input: RecordChangeInput,
): Promise<ActionResult<AdminChangeRow>> {
	if (input.reason.trim().length < 8)
		return { ok: false, error: "Give a reason of at least 8 characters" };
	if (!live("platform")) {
		await demoDelay(300);
		return {
			ok: true,
			data: {
				id: `pc-${Date.now()}`,
				businessId: input.businessId,
				hotelId: input.hotelId,
				businessName: "Business",
				area: input.area,
				description: input.description,
				reason: input.reason,
				madeBy: "You",
				at: new Date().toISOString(),
				undoUntil: new Date(Date.now() + 7 * 86_400_000).toISOString(),
				undone: false,
			},
		};
	}
	const { data, error } = await api("@post/platform/admin/changes", {
		...(await withSession()),
		body: {
			businessId: input.businessId,
			hotelId: input.hotelId ?? null,
			area: input.area,
			description: input.description,
			reason: input.reason,
			beforeJson:
				input.before === undefined ? null : JSON.stringify(input.before),
			afterJson: input.after === undefined ? null : JSON.stringify(input.after),
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The change could not be recorded"),
		};
	revalidateAdmin(input.businessId);
	return { ok: true, data: toChangeRow(data.data) };
}

/** POST /platform/changes/{id}/undo: restores the previous value while the 7-day window is open. */
export async function undoChange(
	id: string,
	fallback?: AdminChangeRow,
): Promise<ActionResult<AdminChangeRow>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Change not found" };
		return { ok: true, data: { ...fallback, undone: true } };
	}
	const { data, error } = await api("@post/platform/changes/:id/undo", {
		...(await withSession()),
		params: { id },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				error?.status === 409
					? "The undo window has closed"
					: "The change could not be undone",
			),
		};
	revalidateAdmin(data.data.businessId);
	return {
		ok: true,
		data: toChangeRow(
			data.data,
			fallback?.businessName,
			fallback?.madeBy,
			true,
		),
	};
}

// ---- settings, integrations, alerts, health ------------------------------------------------------

export async function saveSettings(
	group: SettingsGroup,
	values: Record<string, unknown>,
): Promise<ActionResult<Record<string, unknown>>> {
	if (!live("platform")) {
		await demoDelay(400);
		return { ok: true, data: values };
	}
	const { data, error } = await api("@put/platform/admin/settings/:group", {
		...(await withSession()),
		params: { group },
		body: values,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				error?.status === 403
					? "Only a Super admin changes platform settings"
					: "The settings could not be saved",
			),
		};
	revalidatePath("/admin/settings");
	return { ok: true, data: data.data };
}

export async function loadSettings(): Promise<
	ActionResult<PlatformSettingsData>
> {
	return { ok: true, data: await adminData.settings.get() };
}

/** Re-reads GET /platform/admin/integrations (the server checks each connection when asked). */
export async function loadIntegrations(): Promise<
	ActionResult<IntegrationItem[]>
> {
	return { ok: true, data: await adminData.settings.integrations() };
}

export async function dismissAlert(
	id: string,
	fallback?: AlertRow,
): Promise<ActionResult<AlertRow | null>> {
	if (!live("platform")) {
		await demoDelay(300);
		return { ok: true, data: fallback ?? null };
	}
	const { error } = await api("@post/platform/admin/alerts/:id/dismiss", {
		...(await withSession()),
		params: { id },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The alert could not be dismissed"),
		};
	revalidatePath("/admin");
	revalidatePath("/admin/support");
	return { ok: true, data: fallback ?? null };
}

/** POST /platform/admin/health/{businessId}: recompute one business's health score now. */
export async function recomputeHealth(
	businessId: string,
): Promise<ActionResult<HealthRow>> {
	if (!live("platform")) {
		await demoDelay(500);
		return {
			ok: true,
			data: {
				businessId,
				score: 74,
				factors: {},
				computedAt: new Date().toISOString(),
			},
		};
	}
	const { data, error } = await api("@post/platform/admin/health/:businessId", {
		...(await withSession()),
		params: { businessId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The health score could not be recomputed"),
		};
	revalidateAdmin(businessId);
	let factors: Record<string, unknown> = {};
	try {
		factors = data.data.factors
			? (JSON.parse(data.data.factors) as Record<string, unknown>)
			: {};
	} catch {
		factors = {};
	}
	return {
		ok: true,
		data: {
			businessId,
			score: data.data.score,
			factors,
			computedAt: data.data.computedAt ?? undefined,
		},
	};
}

// ---- support access · "View as owner" ------------------------------------------------------------

export type SupportAccessRequested = { grantId: string; expiresAt?: string };

/** POST /identity/support-access: a time-boxed, logged grant to look at a business as its owner (read only). */
export async function requestSupportAccess(input: {
	businessId: string;
	reason: string;
	minutes: number;
}): Promise<ActionResult<SupportAccessRequested>> {
	if (input.reason.trim().length < 8)
		return { ok: false, error: "Give a reason of at least 8 characters" };
	if (!live("identity")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				grantId: `sa-${Date.now()}`,
				expiresAt: new Date(Date.now() + input.minutes * 60_000).toISOString(),
			},
		};
	}
	const { data, error } = await api("@post/identity/support-access", {
		...(await withSession()),
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Support access could not be opened"),
		};
	revalidateAdmin(input.businessId);
	return {
		ok: true,
		data: {
			grantId: data.data.id,
			expiresAt: data.data.expiresAt ?? undefined,
		},
	};
}

/** POST /identity/support-access/{grantId}/token: the owner-view token the hotel app accepts at /auth/support?token=. */
export async function mintSupportToken(
	grantId: string,
): Promise<
	ActionResult<{ accessToken: string; expiresIn: number; hotels: string[] }>
> {
	if (!live("identity")) {
		await demoDelay(300);
		return {
			ok: true,
			data: {
				accessToken: `demo-support-${grantId}`,
				expiresIn: 1800,
				hotels: [],
			},
		};
	}
	const { data, error } = await api(
		"@post/identity/support-access/:grantId/token",
		{ ...(await withSession()), params: { grantId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The access token could not be issued"),
		};
	return {
		ok: true,
		data: {
			accessToken: data.data.accessToken,
			expiresIn: data.data.expiresIn,
			hotels: data.data.hotels ?? [],
		},
	};
}

export async function loadSupportAccess(
	businessId: string,
): Promise<ActionResult<SupportAccessGrantItem[]>> {
	return { ok: true, data: await adminData.supportAccess(businessId) };
}

// ---- helpers for pickers -------------------------------------------------------------------------

/** A business's hotels for the pickers (New ticket, hotel overview links); read through the tenant seam. */
export async function loadBusinessHotels(
	businessId: string,
): Promise<ActionResult<{ id: string; name: string; city: string }[]>> {
	const { data } = await import("@hospio/api/data");
	const hotels = await data.platform.businessHotels(businessId);
	return {
		ok: true,
		data: hotels.map((h) => ({ id: h.id, name: h.name, city: h.city })),
	};
}
