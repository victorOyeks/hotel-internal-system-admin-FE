"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import {
	lagosDate,
	toExpenseRow,
	toNightAuditRow,
	toTillEntryRow,
	toTillRow,
} from "@hospio/api/data/mappers/finance";
import type {
	ExpenseRow,
	NightAuditRow,
	TillEntryRow,
	TillRow,
} from "@hospio/api/data/types";
import { demoDelay } from "@hospio/api/demo/mode";
import {
	deliveriesOf,
	revalidateOps,
	type WithDeliveries,
} from "./ops-helpers";

/** finance-service: tills, bank deposits, expenses and the night audit. In demo mode each call is echoed back after a short pause. */

const demoTill = (
	patch: Partial<TillRow> & Pick<TillRow, "role">,
): TillRow => ({
	id: `till-${Date.now()}`,
	openedBy: "You",
	openedAt: new Date().toISOString(),
	openingFloat: 0,
	cashIn: 0,
	expected: 0,
	status: "OPEN",
	...patch,
});

export async function openTill(input: {
	role: string;
	openingFloat?: number;
}): Promise<ActionResult<TillRow>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: demoTill({
				role: input.role,
				openingFloat: input.openingFloat ?? 0,
				expected: input.openingFloat ?? 0,
			}),
		};
	}
	const { data, error } = await api("@post/finance/tills", {
		...(await withSession()),
		body: { role: input.role, openingFloat: input.openingFloat ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The till could not be opened"),
		};
	revalidateOps();
	return { ok: true, data: toTillRow(data.data) };
}

/** Cash put in or taken out of the till outside a payment: PAY_IN or PAY_OUT with a reason. */
export async function tillMovement(
	tillId: string,
	input: { kind: "PAY_IN" | "PAY_OUT"; amount: number; reason: string },
): Promise<ActionResult<TillEntryRow>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: `te-${Date.now()}`,
				at: new Date().toISOString(),
				amount: input.kind === "PAY_OUT" ? -input.amount : input.amount,
				method: "CASH",
				description: input.reason,
				kind: input.kind,
			},
		};
	}
	const { data, error } = await api("@post/finance/tills/:id/movements", {
		...(await withSession()),
		params: { id: tillId },
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The movement could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: toTillEntryRow(data.data) };
}

/** Close a till with the cash counted. A variance needs a note and the managers are told. */
export async function closeTill(
	tillId: string,
	input: { countedCash: number; note?: string },
	fallback?: TillRow,
): Promise<ActionResult<WithDeliveries<TillRow>>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				...(fallback ?? demoTill({ role: "FRONT_OFFICE" })),
				status: "CLOSED",
				counted: input.countedCash,
				variance: input.countedCash - (fallback?.expected ?? 0),
				note: input.note,
				closedAt: new Date().toISOString(),
			},
		};
	}
	const { data, error } = await api("@post/finance/tills/:id/close", {
		...(await withSession()),
		params: { id: tillId },
		body: { countedCash: input.countedCash, note: input.note?.trim() || null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The till could not be closed"),
		};
	revalidateOps();
	return {
		ok: true,
		data: { ...toTillRow(data.data), deliveries: deliveriesOf(data) },
	};
}

/** Close the till with the count and open a new one for the same role, run by the named colleague. */
export async function handoverTill(
	tillId: string,
	input: {
		countedCash: number;
		note?: string;
		toUserId: string;
		toUserName: string;
	},
	fallback?: TillRow,
): Promise<
	ActionResult<
		WithDeliveries<{ closed: TillRow | null; opened: TillRow | null }>
	>
> {
	if (!live("finance")) {
		await demoDelay(400);
		const closed: TillRow = {
			...(fallback ?? demoTill({ role: "FRONT_OFFICE" })),
			status: "CLOSED",
			counted: input.countedCash,
			variance: input.countedCash - (fallback?.expected ?? 0),
			note: input.note,
			closedAt: new Date().toISOString(),
		};
		return {
			ok: true,
			data: {
				closed,
				opened: demoTill({
					role: closed.role,
					openedBy: input.toUserName,
					openingFloat: input.countedCash,
					expected: input.countedCash,
				}),
			},
		};
	}
	const { data, error } = await api("@post/finance/tills/:id/handover", {
		...(await withSession()),
		params: { id: tillId },
		body: {
			countedCash: input.countedCash,
			note: input.note?.trim() || null,
			toUserId: input.toUserId,
			toUserName: input.toUserName,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The handover could not be done"),
		};
	revalidateOps();
	const r = data.data as {
		closed?: Parameters<typeof toTillRow>[0] | null;
		opened?: Parameters<typeof toTillRow>[0] | null;
	};
	return {
		ok: true,
		data: {
			closed: r.closed ? toTillRow(r.closed) : null,
			opened: r.opened ? toTillRow(r.opened) : null,
			deliveries: deliveriesOf(data),
		},
	};
}

/** Finance: a transfer seen in the bank statement (matched) or not received (unmatched). */
export async function matchPayment(
	paymentId: string,
	matched: boolean,
): Promise<ActionResult> {
	if (!live("finance")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/finance/payments/:paymentId/match", {
		...(await withSession()),
		params: { paymentId },
		query: { matched },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The payment could not be matched"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

/** Cash taken to the bank. */
export async function bankCash(input: {
	amount: number;
	bankAccount?: string;
	reference?: string;
}): Promise<ActionResult> {
	if (!live("finance")) {
		await demoDelay(400);
		return { ok: true, data: null };
	}
	const { error } = await api("@post/finance/deposits", {
		...(await withSession()),
		body: {
			amount: input.amount,
			bankAccount: input.bankAccount ?? null,
			reference: input.reference ?? null,
		},
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The deposit could not be saved"),
		};
	revalidateOps();
	return { ok: true, data: null };
}

export type ExpenseInput = {
	category: string;
	amount: number;
	description: string;
	paidFrom?: string;
	expenseDate?: string;
};

/** Record or request an expense: the service routes it (recorded, a manager, or the owner) from the hotel's limits. */
export async function recordExpense(
	input: ExpenseInput,
	fallback?: ExpenseRow,
): Promise<ActionResult<WithDeliveries<ExpenseRow>>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: fallback ?? {
				id: `ex-${Date.now()}`,
				date: input.expenseDate ?? lagosDate(),
				category: input.category,
				description: input.description,
				amount: input.amount,
				paidFrom: "CASH",
				requestedBy: "You",
				status: "RECORDED",
			},
		};
	}
	const { data, error } = await api("@post/finance/expenses", {
		...(await withSession()),
		body: {
			category: input.category,
			amount: input.amount,
			description: input.description,
			paidFrom: input.paidFrom ?? null,
			expenseDate: input.expenseDate ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The expense could not be saved"),
		};
	revalidateOps();
	return {
		ok: true,
		data: { ...toExpenseRow(data.data), deliveries: deliveriesOf(data) },
	};
}

/** The requester answers a manager's or owner's question; the approval goes back to pending. */
export async function answerExpense(
	id: string,
	note: string,
): Promise<ActionResult<ExpenseRow>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id,
				date: lagosDate(),
				category: "",
				description: "",
				amount: 0,
				paidFrom: "CASH",
				requestedBy: "You",
				status: "PENDING_APPROVAL",
				note,
			},
		};
	}
	const { data, error } = await api("@post/finance/expenses/:id/answer", {
		...(await withSession()),
		params: { id },
		body: { note },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The answer could not be sent"),
		};
	revalidateOps();
	return { ok: true, data: toExpenseRow(data.data) };
}

/** Mark an approved expense paid; a till expense pays out of the till. */
export async function markExpensePaid(
	id: string,
	paidFrom?: string,
): Promise<ActionResult<ExpenseRow>> {
	if (!live("finance")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id,
				date: lagosDate(),
				category: "",
				description: "",
				amount: 0,
				paidFrom: "CASH",
				requestedBy: "",
				status: "PAID",
			},
		};
	}
	const { data, error } = await api("@post/finance/expenses/:id/paid", {
		...(await withSession()),
		params: { id },
		body: { paidFrom: paidFrom ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The expense could not be marked paid"),
		};
	revalidateOps();
	return { ok: true, data: toExpenseRow(data.data) };
}

/** Close the day. `markNoShows` turns arrivals still waiting into no-shows; the owner gets the summary. */
export async function closeDay(input: {
	date?: string;
	cashCounted?: number;
	roomsOccupied?: number;
	note?: string;
	markNoShows?: boolean;
}): Promise<ActionResult<WithDeliveries<NightAuditRow>>> {
	const date = input.date ?? lagosDate();
	if (!live("finance")) {
		await demoDelay(500);
		return {
			ok: true,
			data: {
				id: `na-${date}`,
				date,
				status: "CLOSED",
				revenue: 0,
				roomsOccupied: input.roomsOccupied ?? 0,
				arrivals: 0,
				departures: 0,
				noShows: 0,
				cashCounted: input.cashCounted,
				closedBy: "You",
				closedAt: new Date().toISOString(),
				checklist: [],
			},
		};
	}
	const { data, error } = await api("@post/finance/night-audit/close", {
		...(await withSession()),
		query: { date },
		body: {
			cashCounted: input.cashCounted ?? null,
			roomsOccupied: input.roomsOccupied ?? null,
			note: input.note?.trim() || null,
			markNoShows: input.markNoShows ?? false,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The day could not be closed"),
		};
	revalidateOps();
	return {
		ok: true,
		data: {
			...toNightAuditRow(data.data, date),
			deliveries: deliveriesOf(data),
		},
	};
}
