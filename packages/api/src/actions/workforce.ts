"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import {
	toClockStatus,
	toLeaveRow,
	toShiftRequestRow,
} from "@hospio/api/data/mappers/workforce";
import type {
	ClockStatus,
	LeaveRow,
	ShiftRequestRow,
} from "@hospio/api/data/types";
import { demoDelay } from "@hospio/api/demo/mode";
import {
	deliveriesOf,
	revalidateOps,
	type WithDeliveries,
} from "./ops-helpers";

/**
 * Rota, shift requests, leave and the clock (finance-service `/workforce`). In demo mode each call is
 * echoed back after a short pause so the screens behave the same.
 */

export type ShiftInput = {
	userId: string;
	userName?: string;
	role: string;
	date: string;
	starts: string;
	ends: string;
};

const body = (i: ShiftInput) => ({
	userId: i.userId,
	userName: i.userName ?? null,
	role: i.role,
	shiftDate: i.date,
	startsAt: i.starts,
	endsAt: i.ends,
});

export async function addShift(input: ShiftInput): Promise<ActionResult> {
	if (!live("finance")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/finance/workforce/shifts", {
		...(await withSession()),
		body: body(input),
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The shift could not be added"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

/** Change a shift's person or times: this is how a manager finds cover. */
export async function changeShift(
	id: string,
	input: ShiftInput,
): Promise<ActionResult> {
	if (!live("finance")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@put/finance/workforce/shifts/:id", {
		...(await withSession()),
		params: { id },
		body: body(input),
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The shift could not be changed"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

/** Swap two people's shifts on one day (or hand the shift over when the other person has none). */
export async function swapShifts(
	a: { id: string } & ShiftInput,
	b: ({ id: string } & ShiftInput) | null,
	withPerson: { userId: string; userName?: string },
): Promise<ActionResult> {
	if (!live("finance")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const s = await withSession();
	const first = await api("@put/finance/workforce/shifts/:id", {
		...s,
		params: { id: a.id },
		body: body({
			...a,
			userId: withPerson.userId,
			userName: withPerson.userName,
		}),
	});
	if (first.error)
		return {
			ok: false,
			error: errorMessage(first.error, "The shift could not be swapped"),
		};
	if (b) {
		const second = await api("@put/finance/workforce/shifts/:id", {
			...s,
			params: { id: b.id },
			body: body({ ...b, userId: a.userId, userName: a.userName }),
		});
		if (second.error)
			return {
				ok: false,
				error: errorMessage(second.error, "Their shift could not be swapped"),
			};
	}
	revalidateOps();
	return { ok: true, data: null };
}

export async function cancelShift(id: string): Promise<ActionResult> {
	if (!live("finance")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@delete/finance/workforce/shifts/:id", {
		...(await withSession()),
		params: { id },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The shift could not be cancelled"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

/** Manager: approve or decline a cover or swap request. The staff member gets a delivery. */
export async function decideShiftRequest(
	id: string,
	approved: boolean,
	fallback?: ShiftRequestRow,
): Promise<ActionResult<WithDeliveries<ShiftRequestRow>>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				...(fallback as ShiftRequestRow),
				status: approved ? "APPROVED" : "DECLINED",
			},
		};
	}
	const { data, error } = await api(
		"@post/finance/workforce/shift-requests/:id/decide",
		{ ...(await withSession()), params: { id }, query: { approved } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The request could not be decided"),
		};
	revalidateOps();
	return {
		ok: true,
		data: { ...toShiftRequestRow(data.data), deliveries: deliveriesOf(data) },
	};
}

/** Manager: approve, decline or suggest other dates for a leave request. */
export async function decideLeave(
	id: string,
	decision: "APPROVED" | "DECLINED" | "CHANGE_REQUESTED",
	note?: string,
	fallback?: LeaveRow,
): Promise<ActionResult<WithDeliveries<LeaveRow>>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: { ...(fallback as LeaveRow), status: decision, note },
		};
	}
	const { data, error } = await api(
		"@post/finance/workforce/leave/:id/decide",
		{
			...(await withSession()),
			params: { id },
			body: { decision, note: note?.trim() || null },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The leave request could not be decided"),
		};
	revalidateOps();
	return {
		ok: true,
		data: { ...toLeaveRow(data.data), deliveries: deliveriesOf(data) },
	};
}

/** Staff: ask to swap or be covered on one of their own shifts. */
export async function requestShiftChange(
	shiftId: string,
	input: { kind: "SWAP" | "COVER"; withUserId?: string; reason?: string },
): Promise<ActionResult<ShiftRequestRow>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: `sr-${Date.now()}`,
				shiftId,
				staffName: "You",
				role: "",
				kind: input.kind,
				date: "",
				shift: "",
				reason: input.reason,
				status: "PENDING",
			},
		};
	}
	const { data, error } = await api(
		"@post/finance/workforce/shifts/:id/requests",
		{
			...(await withSession()),
			params: { id: shiftId },
			body: {
				kind: input.kind,
				withUserId: input.withUserId ?? null,
				reason: input.reason?.trim() || null,
			},
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The request could not be sent"),
		};
	revalidateOps();
	return { ok: true, data: toShiftRequestRow(data.data) };
}

/** Staff: ask for leave. */
export async function requestLeave(input: {
	from: string;
	to: string;
	reason?: string;
}): Promise<ActionResult<LeaveRow>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: `leave-${Date.now()}`,
				staffId: "",
				staffName: "You",
				role: "",
				from: input.from,
				to: input.to,
				days: 1,
				reason: input.reason ?? "",
				status: "PENDING",
			},
		};
	}
	const { data, error } = await api("@post/finance/workforce/leave", {
		...(await withSession()),
		body: {
			fromDate: input.from,
			toDate: input.to,
			reason: input.reason?.trim() || null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The leave request could not be sent"),
		};
	revalidateOps();
	return { ok: true, data: toLeaveRow(data.data) };
}

export async function clockIn(
	note?: string,
): Promise<ActionResult<ClockStatus>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				clockedIn: true,
				since: new Date().toISOString(),
				todayMinutes: 0,
			},
		};
	}
	const s = await withSession();
	const { error } = await api("@post/finance/workforce/clock-in", {
		...s,
		body: { note: note?.trim() || null },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "You could not be clocked in"),
		};
	revalidateOps();
	const me = await api("@get/finance/workforce/clock/me", s);
	return {
		ok: true,
		data: me.data
			? toClockStatus(me.data.data)
			: { clockedIn: true, since: new Date().toISOString(), todayMinutes: 0 },
	};
}

export async function clockOut(
	note?: string,
): Promise<ActionResult<ClockStatus>> {
	if (!live("finance")) {
		await demoDelay(400);
		return { ok: true, data: { clockedIn: false, todayMinutes: 0 } };
	}
	const s = await withSession();
	const { error } = await api("@post/finance/workforce/clock-out", {
		...s,
		body: { note: note?.trim() || null },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "You could not be clocked out"),
		};
	revalidateOps();
	const me = await api("@get/finance/workforce/clock/me", s);
	return {
		ok: true,
		data: me.data
			? toClockStatus(me.data.data)
			: { clockedIn: false, todayMinutes: 0 },
	};
}
