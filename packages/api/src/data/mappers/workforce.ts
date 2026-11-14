import type { Shift } from "@hospio/api/api/schema";
import type {
	ClockMe,
	LeaveItem,
	ShiftRequestItem,
} from "@hospio/api/api/routes-ops";
import type {
	ClockStatus,
	LeaveRow,
	ShiftRequestRow,
	ShiftRow,
} from "@hospio/api/data/types";

/** finance-service workforce responses → the rows the rota, leave and My shifts screens render. */

const hhmm = (t: string | null | undefined) => (t ?? "").slice(0, 5);

/** Days from `from` to `to`, inclusive, when the service does not send `days` yet. */
export function inclusiveDays(from: string, to: string): number {
	const a = Date.parse(`${from}T00:00:00Z`);
	const b = Date.parse(`${to}T00:00:00Z`);
	if (Number.isNaN(a) || Number.isNaN(b)) return 1;
	return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

type ShiftLike = Omit<Shift, "userName"> & { userName?: string | null };

const shiftStatus = (s: ShiftLike): ShiftRow["status"] => {
	if (
		s.status === "CANCELLED" ||
		s.status === "SWAPPED" ||
		s.status === "COVERED"
	)
		return s.status;
	if (
		s.attendance === "PRESENT" ||
		s.attendance === "LATE" ||
		s.attendance === "ABSENT"
	)
		return s.attendance;
	return "SCHEDULED";
};

export function toShiftRow(s: ShiftLike): ShiftRow {
	return {
		id: s.id,
		staffId: s.userId,
		staffName: s.userName ?? "—",
		role: s.role,
		date: s.shiftDate,
		starts: hhmm(s.startsAt),
		ends: hhmm(s.endsAt),
		status: shiftStatus(s),
		clockedIn: s.clockedIn ?? undefined,
	};
}

export function toLeaveRow(l: LeaveItem): LeaveRow {
	const status =
		l.status === "APPROVED" ||
		l.status === "DECLINED" ||
		l.status === "CHANGE_REQUESTED" ||
		l.status === "WITHDRAWN"
			? l.status
			: "PENDING";
	return {
		id: l.id,
		staffId: l.userId ?? "",
		staffName: l.userName ?? "—",
		role: l.role ?? "",
		from: l.fromDate,
		to: l.toDate,
		days: l.days ?? inclusiveDays(l.fromDate, l.toDate),
		reason: l.reason ?? "",
		status,
		note: l.decisionNote ?? undefined,
	};
}

/** `shiftsById` lets a request show the shift it is about (date and times) when the service sends only the id. */
export function toShiftRequestRow(
	r: ShiftRequestItem,
	shiftsById: Map<string, ShiftRow> = new Map(),
): ShiftRequestRow {
	const shift = r.shiftId ? shiftsById.get(r.shiftId) : undefined;
	const starts = r.startsAt ? hhmm(r.startsAt) : shift?.starts;
	const ends = r.endsAt ? hhmm(r.endsAt) : shift?.ends;
	const status =
		r.status === "APPROVED" || r.status === "DECLINED" ? r.status : "PENDING";
	return {
		id: r.id,
		staffId: r.userId ?? undefined,
		shiftId: r.shiftId ?? undefined,
		staffName: r.userName ?? "—",
		role: r.role ?? shift?.role ?? "",
		kind: r.kind === "SWAP" ? "SWAP" : "COVER",
		date: r.shiftDate ?? shift?.date ?? "",
		shift: starts && ends ? `${starts}–${ends}` : "—",
		withName: r.withUserName ?? undefined,
		reason: r.reason ?? undefined,
		status,
	};
}

export function toClockStatus(c: ClockMe): ClockStatus {
	return {
		clockedIn: c.clockedIn,
		since: c.since ?? undefined,
		todayMinutes: c.todayMinutes ?? 0,
	};
}
