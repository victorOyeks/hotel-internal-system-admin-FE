import "server-only";

/**
 * Manager leftovers, housekeeping leftovers and receipts (hospio-backend/docs/manager-leftovers.md): the activity log a page
 * at a time, expense categories, budget against actual, bills, one lost & found item, the places an item can be found in,
 * and receipts. `data` in ./index spreads these into `activity`, `finance`, `housekeeping` and `receipts`.
 */

import { api, errorMessage } from "@hospio/api/api/client";
import type { BillItem, ReceiptItem } from "@hospio/api/api/routes-ml";
import { withSession } from "@hospio/api/api/server";
import { demoDelay } from "@hospio/api/demo/mode";
import * as ops from "@hospio/api/demo/fixtures/ops";
import { demoExpenseCategories } from "@hospio/api/demo/fixtures/manager-ops";
import {
	actionOf,
	departmentOfTopic,
	readableSummary,
} from "./activity-labels";
import { live } from "./live";
import { toLostFoundRow } from "./mappers/housekeeping";
import { categoryLabel } from "./mappers/finance";
import {
	failedPage,
	type ListQuery,
	type PageResult,
	PAGE_SIZE,
	pageQuery,
	slicePage,
	toPaged,
} from "./paging";
import type { ActivityRow, LostFoundRow } from "./types";

const give = async <T>(value: T): Promise<T> => {
	await demoDelay(40);
	return value;
};

/** Payload keys the entry panel leaves out: ids and stamps every event carries. */
const PAYLOAD_SKIP = new Set([
	"eventId",
	"businessId",
	"hotelId",
	"actorId",
	"actorName",
	"occurredAt",
	"type",
	"summary",
]);

function payloadOf(raw?: string | null): Record<string, unknown> | undefined {
	if (!raw) return undefined;
	try {
		const p = JSON.parse(raw) as Record<string, unknown>;
		const out = Object.fromEntries(
			Object.entries(p).filter(
				([k, v]) =>
					!PAYLOAD_SKIP.has(k) &&
					!/Id$/.test(k) &&
					v !== null &&
					v !== "" &&
					typeof v !== "object",
			),
		);
		return Object.keys(out).length ? out : undefined;
	} catch {
		return undefined;
	}
}

export type ActivityEntryWire = {
	id: string;
	eventType: string;
	actorName: string | null;
	summary: string;
	occurredAt: string;
	topic?: string | null;
	payload?: string | null;
};

export const toActivityRow = (e: ActivityEntryWire): ActivityRow => ({
	id: e.id,
	at: e.occurredAt,
	actor: e.actorName?.replace(/^system:.*/, "Hospio") || "Hospio",
	actorRole: "",
	department: departmentOfTopic(e.topic, e.actorName),
	action: actionOf(e.eventType),
	summary: readableSummary(e.summary),
	eventType: e.eventType,
	byPlatform: !!e.actorName?.startsWith("H.M.S"),
	payload: payloadOf(e.payload),
});

import type {
	BillRow,
	ExpenseCategoryRow,
	BudgetView,
	ReceiptRow,
} from "./ml-types";

export type {
	BillRow,
	BudgetRow,
	BudgetView,
	ExpenseCategoryRow,
	ReceiptRow,
} from "./ml-types";

export const toBillRow = (b: BillItem): BillRow => ({
	id: b.id,
	payee: b.payee,
	category: b.category,
	categoryLabel: b.categoryLabel ?? categoryLabel(b.category),
	amount: b.amount,
	dueDate: b.dueDate,
	repeats:
		b.repeats === "WEEKLY" || b.repeats === "MONTHLY" ? b.repeats : "NONE",
	status: b.status === "PAID" || b.status === "CANCELLED" ? b.status : "UNPAID",
	overdue: !!b.overdue,
	note: b.note ?? undefined,
	paidAt: b.paidAt ?? undefined,
	paidBy: b.paidByName ?? undefined,
	paidFrom: b.paidFrom ?? undefined,
	expenseId: b.expenseId ?? undefined,
	createdBy: b.createdByName ?? undefined,
	createdAt: b.createdAt ?? undefined,
});

export const toReceiptRow = (r: ReceiptItem): ReceiptRow => ({
	number: r.number,
	issuedAt: r.issuedAt ?? undefined,
	paymentId: r.paymentId,
	amount: r.amount,
	method: r.method,
	reference: r.reference ?? undefined,
	takenBy: r.takenBy ?? undefined,
	role: r.role ?? undefined,
	guestName: r.guestName ?? undefined,
	guestPhone: r.guestPhone ?? undefined,
	guestEmail: r.guestEmail ?? undefined,
	description: r.description ?? undefined,
	orderId: r.orderId ?? undefined,
	folioId: r.folioId ?? undefined,
	bookingId: r.bookingId ?? undefined,
	paidAt: r.paidAt ?? undefined,
	sentTo: r.sentTo ?? undefined,
});

const demoCategories: ExpenseCategoryRow[] = demoExpenseCategories.map(
	(label) => ({
		id: label,
		code: label
			.toUpperCase()
			.replace(/&/g, " AND ")
			.replace(/[^A-Z0-9]+/g, "_")
			.replace(/^_|_$/g, ""),
		label,
		active: true,
	}),
);

export const mlData = {
	activity: {
		/**
		 * One page of the activity log (platform-service), newest first: `q` (summary, person, event), `department`,
		 * `from`/`to` (Lagos days). The manager sees their hotel; the owner without a hotel the business.
		 */
		page: async (q: ListQuery = {}): Promise<PageResult<ActivityRow>> => {
			if (!live("platform")) {
				const rows = ops.demoActivity.filter(
					(r) =>
						(!q.department || r.department === q.department) &&
						(!q.q ||
							`${r.summary} ${r.actor} ${r.action}`
								.toLowerCase()
								.includes(String(q.q).toLowerCase())),
				);
				return give({
					ok: true,
					data: slicePage(rows, q.page ?? 0, q.size ?? PAGE_SIZE),
				});
			}
			const { data: res, error } = await api("@get/platform/activity", {
				...(await withSession()),
				query: pageQuery(q) as { page: number; size: number },
			});
			if (error || !res) {
				console.error("platform-service activity:", error);
				return failedPage(
					errorMessage(error, "The activity log didn't load"),
					q.size,
				);
			}
			return { ok: true, data: toPaged(res.data, toActivityRow) };
		},
		/** One entry (a link to one off the page). */
		get: async (id: string): Promise<ActivityRow | null> => {
			if (!live("platform"))
				return give(ops.demoActivity.find((a) => a.id === id) ?? null);
			const { data: res } = await api("@get/platform/activity/:id", {
				...(await withSession()),
				params: { id },
			}).catch(() => ({
				data: null,
			}));
			return res ? toActivityRow(res.data) : null;
		},
	},
	finance: {
		/** The hotel's expense categories in list order (`all` adds archived ones for the manager's list). */
		categories: async (all = false): Promise<ExpenseCategoryRow[]> => {
			if (!live("finance")) return give(demoCategories);
			const { data: res, error } = await api(
				"@get/finance/expense-categories",
				{
					...(await withSession()),
					query: all ? { all: true } : {},
				},
			);
			if (error || !res) {
				console.error("finance-service expense categories:", error);
				return [];
			}
			return res.data.map((c) => ({
				id: c.id,
				code: c.code,
				label: c.label,
				active: c.active,
			}));
		},
		/** Budget against actual for a month (yyyy-MM): every category's budget, what was spent and what is left. */
		budget: async (month: string): Promise<BudgetView | null> => {
			if (!live("finance")) return give(null);
			const { data: res, error } = await api("@get/finance/budgets/overview", {
				...(await withSession()),
				query: { month },
			});
			if (error || !res) {
				console.error("finance-service budget overview:", error);
				return null;
			}
			return {
				month: res.data.month,
				rows: res.data.rows.map((r) => ({
					category: r.category,
					label: r.label,
					budget: r.budget,
					spent: r.spent,
					left: r.left,
					pct: r.pct === null || r.pct === undefined ? null : Number(r.pct),
				})),
				totals: res.data.totals,
			};
		},
		/** One page of bills: `status` (UNPAID, OVERDUE, PAID, CANCELLED), `q`, `from`/`to` on the due date; counts and totals. */
		bills: async (q: ListQuery = {}): Promise<PageResult<BillRow>> => {
			if (!live("finance"))
				return give({
					ok: true,
					data: slicePage<BillRow>([], 0, q.size ?? PAGE_SIZE),
				});
			const { data: res, error } = await api("@get/finance/bills", {
				...(await withSession()),
				query: pageQuery(q),
			});
			if (error || !res) {
				console.error("finance-service bills:", error);
				return failedPage(errorMessage(error, "Bills didn't load"), q.size);
			}
			return { ok: true, data: toPaged(res.data, toBillRow) };
		},
	},
	housekeeping: {
		/** One lost & found item (a link from the front office's notice, off the current page). */
		lostFoundItem: async (id: string): Promise<LostFoundRow | null> => {
			if (!live("housekeeping"))
				return give(ops.demoLostFound.find((r) => r.id === id) ?? null);
			const { data: res } = await api("@get/housekeeping/lost-found/:id", {
				...(await withSession()),
				params: { id },
			}).catch(() => ({ data: null }));
			return res ? toLostFoundRow(res.data) : null;
		},
		/** Where an item can be found: the hotel's rooms, its public areas (Hotel setup) and its floors and blocks (Rooms). */
		places: async (): Promise<{
			rooms: { id: string; number: string }[];
			areas: string[];
		}> => {
			if (!live("property"))
				return give({
					rooms: [],
					areas: ["Lobby", "Restaurant", "Bar", "Pool deck"],
				});
			const s = await withSession();
			const [rooms, propertyAreas, publicAreas] = await Promise.all([
				api("@get/property/rooms", { ...s, query: {} }).catch(() => ({
					data: null,
				})),
				api("@get/property/areas", s).catch(() => ({ data: null })),
				api("@get/hotel-config/setup/lists/:listName", {
					...s,
					params: { listName: "PUBLIC_AREAS" },
					query: {},
				}).catch(() => ({
					data: null,
				})),
			]);
			const roomList = (
				(rooms.data?.data ?? []) as { id: string; number: string }[]
			)
				.map((r) => ({ id: r.id, number: r.number }))
				.sort((a, b) =>
					a.number.localeCompare(b.number, undefined, { numeric: true }),
				);
			const named = [
				...(
					(publicAreas.data?.data ?? []) as {
						label?: string | null;
						active?: boolean | null;
					}[]
				)
					.filter((a) => a.active !== false && a.label)
					.map((a) => a.label as string),
				...((propertyAreas.data?.data ?? []) as { name: string }[]).map(
					(a) => a.name,
				),
			];
			return { rooms: roomList, areas: Array.from(new Set(named)) };
		},
	},
	receipts: {
		forPayment: async (
			paymentId: string,
		): Promise<
			{ ok: true; data: ReceiptRow } | { ok: false; error: string }
		> => {
			const { data: res, error } = await api("@get/payment/receipts/:id", {
				...(await withSession()),
				params: { id: paymentId },
			});
			if (error || !res)
				return {
					ok: false,
					error: errorMessage(error, "The receipt could not be read"),
				};
			return { ok: true, data: toReceiptRow(res.data) };
		},
		forRef: async (ref: {
			orderId?: string;
			folioId?: string;
		}): Promise<ReceiptRow[]> => {
			const { data: res, error } = await api("@get/payment/receipts", {
				...(await withSession()),
				query: ref,
			});
			if (error || !res) {
				console.error("payment-service receipts:", error);
				return [];
			}
			return res.data.map(toReceiptRow);
		},
	},
};
