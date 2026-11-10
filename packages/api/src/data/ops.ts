import "server-only";

/**
 * The operating day's data seam (docs/operating-day.md in hospio-backend): rota, leave, clock, tills,
 * expenses, night audit, money series, approvals and housekeeping tasks. `data` in ./index spreads
 * these into `staff`, `finance`, `approvals` and `housekeeping`, so the screens read through one seam.
 * Each reader answers from the demo fixtures when its domain is not live and logs and returns an empty
 * result when the service fails, like the readers in ./index.
 */

import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { demoDelay } from "@hospio/api/demo/mode";
import * as hotel from "@hospio/api/demo/fixtures/hotel";
import * as ops from "@hospio/api/demo/fixtures/ops";
import * as owner from "@hospio/api/demo/fixtures/owner";
import { demoSales } from "@hospio/api/demo/fixtures/fnb";
import * as managerOps from "@hospio/api/demo/fixtures/manager-ops";
import { live } from "./live";
import {
	allPages,
	emptyPage,
	failedPage,
	type ListQuery,
	PAGE_SIZE,
	type Paged,
	type PageResult,
	pageQuery,
	slicePage,
	toPaged,
} from "./paging";
import { toApprovalRow } from "./mappers/approvals";
import {
	lagosDate,
	lagosDay,
	toExpenseRow,
	toMoneyToday,
	toNightAuditRow,
	toOwnerSummary,
	toSeriesRow,
	toTillEntryRow,
	toTillRow,
	toTransactionRow,
} from "./mappers/finance";
import { toCleaningTaskRow, toLostFoundRow } from "./mappers/housekeeping";
import {
	toClockStatus,
	toLeaveRow,
	toShiftRequestRow,
	toShiftRow,
} from "./mappers/workforce";
import type {
	ApprovalRow,
	ClockStatus,
	CleaningTaskRow,
	ExpenseRow,
	LeaveRow,
	LostFoundRow,
	MoneyTodayRow,
	MonthSummaryRow,
	NightAuditRow,
	OwnerSummaryRow,
	SeriesPointRow,
	ShiftRequestRow,
	ShiftRow,
	TillEntryRow,
	TillRow,
	TransactionRow,
} from "./types";

const give = async <T>(value: T): Promise<T> => {
	await demoDelay(40);
	return value;
};

/** Log a failed call and answer with the empty value the screen can render. */
function failed<T>(what: string, error: unknown, empty: T): T {
	console.error(`${what}:`, error);
	return empty;
}

const demoToday: MoneyTodayRow = {
	revenue: 1232000,
	byMethod: { CARD: 785000, TRANSFER: 309650, CASH: 137350 },
	paymentsCount: 29,
	expenses: 642500,
	openTills: ops.demoTills.filter((t) => t.status === "OPEN").length,
	cashInTills: ops.demoTills
		.filter((t) => t.status === "OPEN")
		.reduce((s, t) => s + t.expected, 0),
	occupancyPct: 84,
	arrivals: 9,
	departures: 3,
	inHouse: 101,
	unattachedCash: 0,
	pendingApprovals: ops.demoApprovals.filter((a) => a.status === "PENDING")
		.length,
	outletSales: demoSales,
};

// ---- demo paging: the same tabs and filters the services apply ------------------------------------------

const approvalTab = (a: ApprovalRow, tab?: string) =>
	!tab ||
	(tab === "waiting" &&
		a.status === "PENDING" &&
		a.approverLevel === "MANAGER") ||
	(tab === "owner" &&
		a.approverLevel === "OWNER" &&
		(a.status === "PENDING" || a.status === "QUESTION")) ||
	(tab === "decided" &&
		(a.status === "APPROVED" ||
			a.status === "DECLINED" ||
			(a.status === "QUESTION" && a.approverLevel === "MANAGER"))) ||
	(tab === "open" && (a.status === "PENDING" || a.status === "QUESTION"));

function demoApprovalsFor(q: ListQuery): ApprovalRow[] {
	const needle = String(q.q ?? "").toLowerCase();
	return ops.demoApprovals.filter(
		(a) =>
			approvalTab(a, q.tab as string | undefined) &&
			(!q.kind || a.kind === q.kind) &&
			(!needle ||
				`${a.description} ${a.requesterName} ${a.kind}`
					.toLowerCase()
					.includes(needle)),
	);
}

function demoApprovalCounts(): Record<string, number> {
	const out: Record<string, number> = { all: ops.demoApprovals.length };
	for (const t of ["waiting", "owner", "decided", "open"])
		out[t] = ops.demoApprovals.filter((a) => approvalTab(a, t)).length;
	out.questions = ops.demoApprovals.filter(
		(a) => a.status === "QUESTION",
	).length;
	return out;
}

const expenseTab = (e: ExpenseRow, tab?: string) =>
	!tab ||
	tab === "all" ||
	(tab === "approval" && e.status === "PENDING_APPROVAL") ||
	(tab === "questions" && e.status === "QUESTION") ||
	(tab === "paid" && (e.status === "PAID" || e.status === "APPROVED")) ||
	(tab === "requests" &&
		(e.status === "PENDING_APPROVAL" || e.status === "QUESTION"));

function demoExpensesFor(q: ListQuery): ExpenseRow[] {
	const needle = String(q.q ?? "").toLowerCase();
	return ops.demoExpenses.filter(
		(e) =>
			expenseTab(e, q.tab as string | undefined) &&
			(!q.status || e.status === q.status) &&
			(!q.category || e.category === q.category) &&
			(!needle ||
				`${e.description} ${e.category} ${e.requestedBy}`
					.toLowerCase()
					.includes(needle)),
	);
}

function demoExpenseCounts(): Record<string, number> {
	const out: Record<string, number> = {};
	for (const t of ["all", "approval", "questions", "paid", "requests"])
		out[t] = ops.demoExpenses.filter((e) => expenseTab(e, t)).length;
	return out;
}

export const opsData = {
	staff: {
		/** The rota between two dates (default: a week back to three weeks ahead), with attendance. */
		shifts: async (from?: string, to?: string): Promise<ShiftRow[]> => {
			if (!live("finance"))
				return give(
					hotel.demoShifts.filter(
						(s) => (!from || s.date >= from) && (!to || s.date <= to),
					),
				);
			const query = { from: from ?? lagosDay(-7), to: to ?? lagosDay(21) };
			const { data: res, error } = await api("@get/finance/workforce/rota", {
				...(await withSession()),
				query,
			});
			if (error || !res) return failed("finance-service rota", error, []);
			return res.data
				.map(toShiftRow)
				.sort(
					(a, b) =>
						a.date.localeCompare(b.date) || a.starts.localeCompare(b.starts),
				);
		},
		/** The caller's own upcoming shifts. */
		myShifts: async (staffId?: string): Promise<ShiftRow[]> => {
			if (!live("finance"))
				return give(
					hotel.demoShifts.filter((s) => !staffId || s.staffId === staffId),
				);
			const { data: res, error } = await api(
				"@get/finance/workforce/shifts/mine",
				await withSession(),
			);
			if (error || !res) return failed("finance-service my shifts", error, []);
			return res.data.map(toShiftRow);
		},
		/** Leave waiting for a decision. */
		leave: async (): Promise<LeaveRow[]> => {
			if (!live("finance")) return give(hotel.demoLeave);
			const { data: res, error } = await api(
				"@get/finance/workforce/leave/pending",
				await withSession(),
			);
			if (error || !res)
				return failed("finance-service pending leave", error, []);
			return res.data.map(toLeaveRow);
		},
		myLeave: async (): Promise<LeaveRow[]> => {
			if (!live("finance")) return give(hotel.demoLeave.slice(0, 2));
			const { data: res, error } = await api(
				"@get/finance/workforce/leave/mine",
				await withSession(),
			);
			if (error || !res) return failed("finance-service my leave", error, []);
			return res.data.map(toLeaveRow);
		},
		/** Cover and swap requests waiting for a decision. */
		shiftRequests: async (): Promise<ShiftRequestRow[]> => {
			if (!live("finance")) return give(hotel.demoShiftRequests);
			const s = await withSession();
			const [res, shifts] = await Promise.all([
				api("@get/finance/workforce/shift-requests", s),
				opsData.staff.shifts(),
			]);
			if (res.error || !res.data)
				return failed("finance-service shift requests", res.error, []);
			const byId = new Map(shifts.map((x) => [x.id, x]));
			return res.data.data.map((r) => toShiftRequestRow(r, byId));
		},
		/** The caller's clock: on or off, since when, minutes worked today. */
		clock: async (): Promise<ClockStatus> => {
			if (!live("finance"))
				return give({
					clockedIn: true,
					since: hotel.at(0, 6, 58),
					todayMinutes: 0,
				});
			const { data: res, error } = await api(
				"@get/finance/workforce/clock/me",
				await withSession(),
			);
			if (error || !res)
				return failed("finance-service clock", error, {
					clockedIn: false,
					todayMinutes: 0,
				});
			return toClockStatus(res.data);
		},
		/** Who is clocked in today: user id → since. */
		clockedIn: async (date?: string): Promise<Map<string, string>> => {
			const out = new Map<string, string>();
			if (!live("finance")) return out;
			const { data: res } = await api("@get/finance/workforce/clock", {
				...(await withSession()),
				query: date ? { date } : {},
			});
			for (const e of res?.data ?? [])
				if (e.userId && !e.clockOut) out.set(e.userId, e.clockIn ?? "");
			return out;
		},
	},
	finance: {
		/**
		 * One page of the hotel's expenses, newest first by date then by when recorded (finance-service filters, counts and
		 * sums in SQL): `tab` approval, questions, paid or requests; `status`, `category`, `q`, `from`/`to` (90 days back on
		 * the server; waiting ones are listed however old), `sort`. Tab counts and totals cover the whole filtered range.
		 */
		expensesPage: async (
			query: ListQuery = {},
		): Promise<PageResult<ExpenseRow>> => {
			if (!live("finance")) {
				const rows = demoExpensesFor(query);
				return give({
					ok: true,
					data: slicePage(rows, query.page ?? 0, query.size ?? PAGE_SIZE, {
						counts: demoExpenseCounts(),
						totals: {
							all: ops.demoExpenses.reduce((a, e) => a + e.amount, 0),
							recorded: ops.demoExpenses
								.filter((e) => e.status !== "DECLINED")
								.reduce((a, e) => a + e.amount, 0),
							matching: rows.reduce((a, e) => a + e.amount, 0),
						},
					}),
				});
			}
			const { data: res, error } = await api("@get/finance/expenses", {
				...(await withSession()),
				query: pageQuery(query),
			});
			if (error || !res) {
				console.error("finance-service expenses:", error);
				return failedPage(errorMessage(error, "Expenses didn't load"));
			}
			return { ok: true, data: toPaged(res.data, toExpenseRow) };
		},
		/**
		 * Every expense matching the filters (from 90 days back unless `from` is given), read page by page: summaries,
		 * reports and exports that need the whole range. Newest first.
		 */
		expenses: async (
			query: {
				status?: string;
				from?: string;
				to?: string;
				tab?: string;
				category?: string;
				q?: string;
			} = {},
		): Promise<ExpenseRow[]> => {
			if (!live("finance"))
				return give(
					query.status
						? ops.demoExpenses.filter((e) => e.status === query.status)
						: ops.demoExpenses,
				);
			const all = await allPages(async (page, size) => {
				const r = await opsData.finance.expensesPage({ ...query, page, size });
				return r.ok ? r.data : null;
			});
			if (!all.ok) console.error("finance-service expenses: a page failed");
			return all.rows;
		},
		tills: async (): Promise<TillRow[]> => {
			if (!live("finance")) return give(ops.demoTills);
			const { data: res, error } = await api(
				"@get/finance/tills",
				await withSession(),
			);
			if (error || !res) return failed("finance-service tills", error, []);
			return res.data.map(toTillRow);
		},
		/** The open till of the caller's paying role, or null. */
		myTill: async (role = "FRONT_OFFICE"): Promise<TillRow | null> => {
			if (!live("finance"))
				return give(
					ops.demoTills.find((t) => t.role === role && t.status === "OPEN") ??
						null,
				);
			const { data: res, error } = await api(
				"@get/finance/tills/mine",
				await withSession(),
			);
			if (error || !res) return failed("finance-service my till", error, null);
			return res.data ? toTillRow(res.data) : null;
		},
		/** The caller's role's tills closed in the last 7 days. */
		myClosedTills: async (role = "FRONT_OFFICE"): Promise<TillRow[]> => {
			if (!live("finance"))
				return give(
					ops.demoTills.filter((t) => t.role === role && t.status === "CLOSED"),
				);
			const { data: res, error } = await api(
				"@get/finance/tills/mine/closed",
				await withSession(),
			);
			if (error || !res)
				return failed("finance-service my closed tills", error, []);
			return res.data.map(toTillRow);
		},
		tillEntries: async (tillId: string): Promise<TillEntryRow[]> => {
			if (!live("finance")) return give([]);
			const { data: res, error } = await api("@get/finance/tills/:id/entries", {
				...(await withSession()),
				params: { id: tillId },
			});
			if (error || !res)
				return failed("finance-service till entries", error, []);
			return res.data.map(toTillEntryRow);
		},
		/** The day's money movements, newest first. */
		transactions: async (date?: string): Promise<TransactionRow[]> => {
			if (!live("finance")) return give(ops.demoTransactions);
			const { data: res, error } = await api("@get/finance/transactions", {
				...(await withSession()),
				query: { date: date ?? lagosDate() },
			});
			if (error || !res)
				return failed("finance-service transactions", error, []);
			return res.data.map(toTransactionRow);
		},
		/**
		 * Tonight's audit (computed checklist) first, then one page of closed audits, newest first (finance-service pages
		 * them; `page` is 0-based). `total` and `totalPages` are the closed audits'.
		 */
		nightAudits: async (
			day?: string,
			query: ListQuery = {},
		): Promise<{
			rows: NightAuditRow[];
			past: Paged<NightAuditRow>;
			ok: boolean;
			error?: string;
		}> => {
			if (!live("finance")) {
				const past = ops.demoNightAudits.filter((a) => a.status === "CLOSED");
				return give({
					rows: ops.demoNightAudits,
					past: slicePage(past, query.page ?? 0, query.size ?? PAGE_SIZE),
					ok: true,
				});
			}
			const s = await withSession();
			const date = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : lagosDate();
			const [now, past] = await Promise.all([
				api("@get/finance/night-audit", { ...s, query: { date } }),
				api("@get/finance/night-audit/past", {
					...s,
					query: pageQuery({ ...query, status: "CLOSED" }),
				}),
			]);
			const page = past.data
				? toPaged(past.data.data, (a) => toNightAuditRow(a, date))
				: emptyPage<NightAuditRow>();
			if (past.error) console.error("finance-service past audits:", past.error);
			const closed = page.content.filter((r) => r.date !== date);
			if (now.error || !now.data) {
				console.error("finance-service night audit:", now.error);
				return {
					rows: closed,
					past: page,
					ok: false,
					error: errorMessage(now.error, "Tonight's audit didn't load"),
				};
			}
			const tonight = toNightAuditRow(now.data.data, date);
			return {
				rows: [tonight, ...closed],
				past: page,
				ok: !past.error,
				error: past.error
					? errorMessage(past.error, "Past audits didn't load")
					: undefined,
			};
		},
		today: async (date?: string): Promise<MoneyTodayRow> => {
			if (!live("finance")) return give(demoToday);
			const { data: res, error } = await api("@get/finance/today", {
				...(await withSession()),
				query: date ? { date } : {},
			});
			const empty: MoneyTodayRow = {
				revenue: 0,
				byMethod: {},
				paymentsCount: 0,
				expenses: 0,
				openTills: 0,
				cashInTills: 0,
			};
			if (error || !res) return failed("finance-service today", error, empty);
			return toMoneyToday(res.data);
		},
		/** Revenue and expenses per day (default: the last 7 days). */
		/** Revenue this month (or a range) by the desk that took it. */
		income: async (
			from?: string,
			to?: string,
		): Promise<{ source: string; amount: number; pct: number }[]> => {
			if (!live("finance")) return give(managerOps.demoIncomeSources);
			const end = to ?? lagosDate();
			const { data: res, error } = await api("@get/finance/income", {
				...(await withSession()),
				query: { from: from ?? `${end.slice(0, 8)}01`, to: end },
			});
			if (error || !res) return failed("finance-service income", error, []);
			return res.data;
		},
		series: async (from?: string, to?: string): Promise<SeriesPointRow[]> => {
			if (!live("finance")) {
				const wide =
					from && to && Date.parse(to) - Date.parse(from) > 8 * 86_400_000;
				const rows: SeriesPointRow[] = wide
					? owner.ownerDaily.map((d) => ({
							date: d.date,
							revenue: d.revenue,
							expenses: Math.round(d.revenue * 0.7),
						}))
					: managerOps.demoWeekRevenue;
				return give(
					rows.filter(
						(p) => (!from || p.date >= from) && (!to || p.date <= to),
					),
				);
			}
			const { data: res, error } = await api("@get/finance/series", {
				...(await withSession()),
				query: { from: from ?? lagosDay(-6), to: to ?? lagosDate() },
			});
			if (error || !res) return failed("finance-service series", error, []);
			return res.data
				.map(toSeriesRow)
				.sort((a, b) => a.date.localeCompare(b.date));
		},
		/** This month so far and last month, from the daily series. The demo answers with its fixture. */
		month: async (): Promise<MonthSummaryRow> => {
			if (!live("finance")) return give(managerOps.demoMonth);
			const today = lagosDate();
			const first = `${today.slice(0, 8)}01`;
			const prevEnd = lagosDate(
				new Date(Date.parse(`${first}T12:00:00Z`) - 86_400_000),
			);
			const prevStart = `${prevEnd.slice(0, 8)}01`;
			const [now, prev] = await Promise.all([
				opsData.finance.series(first, today),
				opsData.finance.series(prevStart, prevEnd),
			]);
			const revenue = now.reduce((a, p) => a + p.revenue, 0);
			const expenses = now.reduce((a, p) => a + p.expenses, 0);
			const netProfit = revenue - expenses;
			return {
				revenue,
				expenses,
				netProfit,
				lastMonth: prev.reduce((a, p) => a + p.revenue, 0),
				margin: revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0,
			};
		},
		/** Per hotel of the business: revenue, expenses, profit, occupancy (owner only). */
		ownerSummary: async (
			from?: string,
			to?: string,
		): Promise<OwnerSummaryRow> => {
			const empty: OwnerSummaryRow = {
				hotels: [],
				totals: { revenue: 0, expenses: 0, profit: 0, occupancyPct: 0 },
			};
			if (!live("finance")) return give(empty);
			const { data: res, error } = await api("@get/finance/owner/summary", {
				...(await withSession()),
				query: { from: from ?? lagosDate(), to: to ?? lagosDate() },
			});
			if (error || !res)
				return failed("finance-service owner summary", error, empty);
			return toOwnerSummary(res.data);
		},
	},
	approvals: {
		/**
		 * One page of the hotel's approvals (platform-service filters, counts and sums them): `tab` waiting, owner, decided or
		 * open; `kind`, `q`, `from`/`to`, `sort`. Counts per tab and the money waiting over the whole filtered range.
		 */
		page: async (query: ListQuery = {}): Promise<PageResult<ApprovalRow>> => {
			if (!live("platform")) {
				const rows = demoApprovalsFor(query);
				return give({
					ok: true,
					data: slicePage(rows, query.page ?? 0, query.size ?? PAGE_SIZE, {
						counts: demoApprovalCounts(),
					}),
				});
			}
			const { data: res, error } = await api("@get/platform/approvals/all", {
				...(await withSession()),
				query: pageQuery(query),
			});
			if (error || !res) {
				console.error("platform-service approvals:", error);
				return failedPage(errorMessage(error, "Approvals didn't load"));
			}
			return { ok: true, data: toPaged(res.data, toApprovalRow) };
		},
		/** Every open approval (waiting or questioned, any level): the dashboards' "needs a decision". */
		open: async (): Promise<ApprovalRow[]> => {
			if (!live("platform"))
				return give(
					ops.demoApprovals.filter(
						(a) => a.status === "PENDING" || a.status === "QUESTION",
					),
				);
			const all = await allPages(async (page, size) => {
				const r = await opsData.approvals.page({ tab: "open", page, size });
				return r.ok ? r.data : null;
			});
			return all.rows;
		},
		/**
		 * Every approval in the window (open ones however old, decided ones from the last 90 days), newest first, read
		 * page by page: the owner's dashboard and financials, which sort and filter them themselves.
		 */
		list: async (): Promise<ApprovalRow[]> => {
			if (!live("platform")) return give(ops.demoApprovals);
			const all = await allPages(async (page, size) => {
				const r = await opsData.approvals.page({ page, size });
				return r.ok ? r.data : null;
			});
			if (!all.ok) console.error("platform-service approvals: a page failed");
			const rank = (a: ApprovalRow) =>
				a.status === "PENDING" ? 0 : a.status === "QUESTION" ? 1 : 2;
			return all.rows.sort(
				(a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt),
			);
		},
		/** One approval, opened from a link even when it is not on the page shown. */
		get: async (id: string): Promise<ApprovalRow | null> => {
			if (!live("platform"))
				return give(ops.demoApprovals.find((a) => a.id === id) ?? null);
			const { data: res, error } = await api("@get/platform/approvals/:id", {
				...(await withSession()),
				params: { id },
			});
			if (error || !res) {
				if (error?.status !== 404)
					console.error("platform-service approval:", error);
				return null;
			}
			return toApprovalRow(res.data);
		},
	},
	housekeeping: {
		/** Today's cleaning tasks. */
		tasks: async (date?: string): Promise<CleaningTaskRow[]> => {
			if (!live("housekeeping")) return give(ops.demoCleaningTasks);
			const { data: res, error } = await api("@get/housekeeping/tasks", {
				...(await withSession()),
				query: { date: date ?? lagosDate() },
			});
			if (error || !res) return failed("housekeeping-service tasks", error, []);
			return res.data.map(toCleaningTaskRow);
		},
		/** Rooms cleaned and waiting for a supervisor. */
		toInspect: async (): Promise<CleaningTaskRow[]> => {
			if (!live("housekeeping"))
				return give(ops.demoCleaningTasks.filter((t) => t.status === "DONE"));
			const { data: res, error } = await api(
				"@get/housekeeping/tasks/to-inspect",
				await withSession(),
			);
			if (error || !res)
				return failed("housekeeping-service to inspect", error, []);
			return res.data.map(toCleaningTaskRow);
		},
		/** Lost & found, newest found first, one page: `status` FOUND, RETURNED or DISPOSED, `q`, `from`/`to`; `counts` per status. */
		lostFound: async (q: ListQuery = {}): Promise<PageResult<LostFoundRow>> => {
			if (!live("housekeeping")) {
				const rows = ops.demoLostFound.filter(
					(r) =>
						!q.q ||
						`${r.description} ${r.foundWhere}`
							.toLowerCase()
							.includes(q.q.toLowerCase()),
				);
				const counts: Record<string, number> = { all: rows.length };
				for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
				return give({
					ok: true,
					data: slicePage(
						rows.filter((r) => !q.status || r.status === q.status),
						q.page ?? 0,
						q.size ?? PAGE_SIZE,
						{ counts },
					),
				});
			}
			const { data: res, error } = await api("@get/housekeeping/lost-found", {
				...(await withSession()),
				query: pageQuery(q),
			});
			if (error || !res) {
				console.error("housekeeping-service lost and found:", error);
				return failedPage(
					errorMessage(error, "Couldn't load lost & found"),
					q.size,
				);
			}
			return { ok: true, data: toPaged(res.data, toLostFoundRow) };
		},
	},
};
