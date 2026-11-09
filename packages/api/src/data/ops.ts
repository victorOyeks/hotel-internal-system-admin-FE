import "server-only";

/**
 * The operating day's data seam (docs/operating-day.md in hospio-backend): rota, leave, clock, tills,
 * expenses, night audit, money series, approvals and housekeeping tasks. `data` in ./index spreads
 * these into `staff`, `finance`, `approvals` and `housekeeping`, so the screens read through one seam.
 * Each reader answers from the demo fixtures when its domain is not live and logs and returns an empty
 * result when the service fails, like the readers in ./index.
 */

import { api } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { demoDelay } from "@hospio/api/demo/mode";
import * as hotel from "@hospio/api/demo/fixtures/hotel";
import * as ops from "@hospio/api/demo/fixtures/ops";
import * as owner from "@hospio/api/demo/fixtures/owner";
import * as managerOps from "@hospio/api/demo/fixtures/manager-ops";
import { live } from "./live";
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
};

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
		expenses: async (
			query: { status?: string; from?: string; to?: string } = {},
		): Promise<ExpenseRow[]> => {
			if (!live("finance"))
				return give(
					query.status
						? ops.demoExpenses.filter((e) => e.status === query.status)
						: ops.demoExpenses,
				);
			const q = Object.fromEntries(
				Object.entries({ from: lagosDay(-90), ...query }).filter(([, v]) => v),
			) as Record<string, string>;
			const { data: res, error } = await api("@get/finance/expenses", {
				...(await withSession()),
				query: q,
			});
			if (error || !res) return failed("finance-service expenses", error, []);
			return res.data
				.map(toExpenseRow)
				.sort((a, b) => b.date.localeCompare(a.date));
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
		myTill: async (): Promise<TillRow | null> => {
			if (!live("finance"))
				return give(
					ops.demoTills.find(
						(t) => t.role === "FRONT_OFFICE" && t.status === "OPEN",
					) ?? null,
				);
			const { data: res, error } = await api(
				"@get/finance/tills/mine",
				await withSession(),
			);
			if (error || !res) return failed("finance-service my till", error, null);
			return res.data ? toTillRow(res.data) : null;
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
		/** Tonight's audit (computed checklist) first, then closed audits, newest first. */
		nightAudits: async (): Promise<NightAuditRow[]> => {
			if (!live("finance")) return give(ops.demoNightAudits);
			const s = await withSession();
			const date = lagosDate();
			const [now, past] = await Promise.all([
				api("@get/finance/night-audit", { ...s, query: { date } }),
				api("@get/finance/night-audit/past", s),
			]);
			const rows = (past.data?.data ?? []).map((a) => toNightAuditRow(a, date));
			if (past.error) console.error("finance-service past audits:", past.error);
			if (now.error || !now.data)
				return failed("finance-service night audit", now.error, rows);
			const tonight = toNightAuditRow(now.data.data, date);
			return [
				tonight,
				...rows
					.filter((r) => r.date !== tonight.date && r.status === "CLOSED")
					.sort((a, b) => b.date.localeCompare(a.date)),
			];
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
		/** Every approval of the hotel (pending first), for the manager and owner screens. */
		list: async (): Promise<ApprovalRow[]> => {
			if (!live("platform")) return give(ops.demoApprovals);
			const { data: res, error } = await api(
				"@get/platform/approvals/all",
				await withSession(),
			);
			if (error || !res) return failed("platform-service approvals", error, []);
			const rank = (a: ApprovalRow) =>
				a.status === "PENDING" ? 0 : a.status === "QUESTION" ? 1 : 2;
			return res.data
				.map(toApprovalRow)
				.sort(
					(a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt),
				);
		},
		get: async (id: string): Promise<ApprovalRow | null> =>
			(await opsData.approvals.list()).find((a) => a.id === id) ?? null,
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
		lostFound: async (): Promise<LostFoundRow[]> => {
			if (!live("housekeeping")) return give(ops.demoLostFound);
			const { data: res, error } = await api(
				"@get/housekeeping/lost-found",
				await withSession(),
			);
			if (error || !res)
				return failed("housekeeping-service lost and found", error, []);
			return res.data.map(toLostFoundRow);
		},
	},
};
