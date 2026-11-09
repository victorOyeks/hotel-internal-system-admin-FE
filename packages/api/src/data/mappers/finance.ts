import type { MoneyToday } from "@hospio/api/api/schema";
import type {
	ExpenseItem,
	NightAuditDay,
	OwnerSummary,
	SeriesPoint,
	TillEntryItem,
	TillItem,
	TransactionItem,
} from "@hospio/api/api/routes-ops";
import type {
	ExpenseRow,
	MoneyTodayRow,
	NightAuditRow,
	OwnerSummaryRow,
	SeriesPointRow,
	TillEntryRow,
	TillRow,
	TransactionRow,
} from "@hospio/api/data/types";

/** finance-service responses → the rows the money screens render. Amounts are naira already. */

const TZ = "Africa/Lagos";
/** Today's business date (yyyy-MM-dd) in the hotel's usual timezone. */
export const lagosDate = (d: Date = new Date()) =>
	new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
/** The date `offset` days from today. */
export const lagosDay = (offset: number) =>
	lagosDate(new Date(Date.now() + offset * 86_400_000));

export function toMoneyToday(m: MoneyToday): MoneyTodayRow {
	return {
		revenue: m.revenue,
		byMethod: m.byMethod,
		byRole: m.byRole,
		paymentsCount: m.paymentsCount,
		expenses: m.expenses,
		openTills: m.openTills,
		cashInTills: m.cashInTills,
		occupancyPct: m.occupancyPct ?? undefined,
		arrivals: m.arrivals ?? undefined,
		departures: m.departures ?? undefined,
		inHouse: m.inHouse ?? undefined,
		unattachedCash: m.unattachedCash ?? undefined,
		pendingApprovals: m.pendingApprovals ?? undefined,
	};
}

export function toTillRow(t: TillItem): TillRow {
	return {
		id: t.id,
		role: t.role,
		openedBy: t.openedByName ?? t.openedBy ?? "—",
		openedById: t.openedBy ?? undefined,
		openedAt: t.openedAt ?? "",
		openingFloat: t.openingFloat,
		cashIn: t.cashIn ?? 0,
		cashOut: t.cashOut ?? 0,
		expected: t.expectedCash,
		counted: t.countedCash ?? undefined,
		variance: t.variance ?? undefined,
		status: t.status === "CLOSED" ? "CLOSED" : "OPEN",
		closedAt: t.closedAt ?? undefined,
		entries: t.entries ?? undefined,
		note: t.note ?? undefined,
	};
}

export function toTillEntryRow(e: TillEntryItem): TillEntryRow {
	const kind =
		e.kind === "PAY_IN" || e.kind === "PAY_OUT" || e.kind === "REFUND"
			? e.kind
			: e.paymentId
				? "PAYMENT"
				: e.amount < 0
					? "PAY_OUT"
					: "OTHER";
	return {
		id: e.id,
		at: e.createdAt ?? "",
		amount: e.amount,
		method: e.method ?? "CASH",
		description: e.description ?? "",
		kind,
	};
}

const paidFrom = (raw: string | null | undefined): ExpenseRow["paidFrom"] => {
	const v = (raw ?? "").toUpperCase();
	if (v === "CARD") return "CARD";
	if (v === "CASH" || v === "TILL") return "CASH";
	return "TRANSFER";
};

export function toExpenseRow(e: ExpenseItem): ExpenseRow {
	const status =
		e.status === "PENDING_APPROVAL" ||
		e.status === "APPROVED" ||
		e.status === "DECLINED" ||
		e.status === "QUESTION" ||
		e.status === "PAID"
			? e.status
			: "RECORDED";
	return {
		id: e.id,
		date: e.expenseDate ?? (e.createdAt ?? "").slice(0, 10),
		category: e.category,
		description: e.description ?? "",
		amount: e.amount,
		paidFrom: paidFrom(e.paidFrom),
		paidFromRaw: e.paidFrom ?? undefined,
		requestedBy: e.requestedByName ?? e.requestedBy ?? "—",
		requestedById: e.requestedBy ?? undefined,
		status,
		receipt: Boolean(e.receiptKey),
		note: e.decisionNote ?? undefined,
		approverLevel:
			e.approverLevel === "OWNER"
				? "OWNER"
				: e.approverLevel === "MANAGER"
					? "MANAGER"
					: undefined,
		approvalId: e.approvalId ?? undefined,
	};
}

export function toTransactionRow(
	t: TransactionItem,
	i: number,
): TransactionRow {
	const kind =
		t.kind === "EXPENSE" ||
		t.kind === "REFUND" ||
		t.kind === "DEPOSIT" ||
		t.kind === "PAYMENT"
			? t.kind
			: "TILL";
	return {
		id: `${t.at}-${i}`,
		at: t.at,
		kind,
		description: t.description ?? "",
		method: t.method ?? "",
		amount: t.amount,
		by: t.by ?? "—",
		reference: t.ref ?? "",
	};
}

export const toSeriesRow = (p: SeriesPoint): SeriesPointRow => ({
	date: p.date,
	revenue: p.revenue,
	expenses: p.expenses,
});

export function toOwnerSummary(s: OwnerSummary): OwnerSummaryRow {
	const hotels = s.hotels.map((h) => ({
		hotelId: h.hotelId,
		name: h.name,
		revenue: h.revenue,
		expenses: h.expenses,
		profit: h.profit ?? h.revenue - h.expenses,
		occupancyPct: h.occupancyPct ?? 0,
	}));
	const revenue =
		s.totals?.revenue ?? hotels.reduce((a, h) => a + h.revenue, 0);
	const expenses =
		s.totals?.expenses ?? hotels.reduce((a, h) => a + h.expenses, 0);
	const occ = hotels.length
		? hotels.reduce((a, h) => a + h.occupancyPct, 0) / hotels.length
		: 0;
	return {
		hotels,
		totals: {
			revenue,
			expenses,
			profit: s.totals?.profit ?? revenue - expenses,
			occupancyPct: s.totals?.occupancyPct ?? Math.round(occ),
		},
	};
}

/** The checklist rows the night-audit screens render: the API's, or the stored JSON when only that is sent. */
function checklistOf(a: NightAuditDay): NightAuditRow["checklist"] {
	const c = a.checklist;
	if (Array.isArray(c))
		return c.map((i) => ({
			key: i.key,
			label: i.label,
			done: i.done,
			detail: i.detail ?? undefined,
		}));
	return [];
}

/** The stored report is JSON (an object, or a string of one on older rows). */
function parseReport(raw: unknown): Record<string, unknown> | undefined {
	if (typeof raw === "string") {
		try {
			return parseReport(JSON.parse(raw));
		} catch {
			return undefined;
		}
	}
	return raw && typeof raw === "object" && !Array.isArray(raw)
		? (raw as Record<string, unknown>)
		: undefined;
}

export function toNightAuditRow(
	a: NightAuditDay,
	fallbackDate: string,
): NightAuditRow {
	const report = parseReport(a.report);
	// The report carries who closed the day by name; the audit row itself only has their user id.
	const closedByName =
		typeof report?.closedBy === "string" ? report.closedBy : undefined;
	return {
		id: a.id ?? `na-${a.businessDate ?? fallbackDate}`,
		date: a.businessDate ?? fallbackDate,
		status: a.status === "CLOSED" ? "CLOSED" : "OPEN",
		revenue: a.revenue ?? 0,
		cashCounted: a.cashCounted ?? undefined,
		variance: a.variance ?? undefined,
		roomsOccupied: a.roomsOccupied ?? 0,
		arrivals: a.arrivals ?? 0,
		departures: a.departures ?? 0,
		noShows: a.noShows ?? 0,
		inHouse: a.inHouse ?? undefined,
		rooms: a.rooms ?? undefined,
		closedBy: closedByName ?? a.closedBy ?? undefined,
		closedAt: a.closedAt ?? undefined,
		note: a.note ?? undefined,
		checklist: checklistOf(a),
		report,
	};
}
