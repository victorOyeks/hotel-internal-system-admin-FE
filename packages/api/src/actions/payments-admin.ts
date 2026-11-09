"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import {
	adminData,
	toBatchItem,
	toSettlementItem,
} from "@hospio/api/data/admin";
import type {
	FailedPayoutItem,
	PayoutBatchDetail,
	PayoutBatchItem,
	RetryPayoutResult,
	RunSettlementsResult,
	SettlementItem,
} from "@hospio/api/data/admin-types";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * payment-service `/payment/admin/**` writes: the settlement run, payout batches and failed payouts.
 * Money roles only (SUPER_ADMIN, FINANCE_ADMIN); the screen hides the buttons for Support.
 */

function revalidatePayments() {
	revalidatePath("/admin/payments");
	revalidatePath("/admin");
}

const toDetail = (d: {
	batch: Parameters<typeof toBatchItem>[0];
	settlements: Parameters<typeof toSettlementItem>[0][] | null;
}): PayoutBatchDetail => ({
	batch: toBatchItem(d.batch),
	settlements: (d.settlements ?? []).map(toSettlementItem),
});

/** POST /payment/admin/settlements/run: one PENDING settlement per business × provider for the day (yesterday by default). */
export async function runSettlements(
	date?: string,
): Promise<ActionResult<RunSettlementsResult>> {
	if (!live("payment")) {
		await demoDelay(700);
		return {
			ok: true,
			data: {
				date:
					date ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
				created: 2,
				skipped: 1,
			},
		};
	}
	const { data, error } = await api("@post/payment/admin/settlements/run", {
		...(await withSession()),
		body: { date: date ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The settlement run failed"),
		};
	revalidatePayments();
	return {
		ok: true,
		data: {
			date: data.data.date ?? undefined,
			created: data.data.created,
			skipped: data.data.skipped,
		},
	};
}

export async function loadBatch(
	id: string,
): Promise<ActionResult<PayoutBatchDetail>> {
	const b = await adminData.payments.batch(id);
	return b
		? { ok: true, data: b }
		: { ok: false, error: "That batch is no longer there" };
}

/** POST /payment/admin/payouts/batches: bundle the chosen PENDING settlements (or every one) into a batch. */
export async function createPayoutBatch(
	settlementIds?: string[],
	fallback?: SettlementItem[],
): Promise<ActionResult<PayoutBatchDetail>> {
	if (!live("payment")) {
		await demoDelay(600);
		const chosen = (fallback ?? []).filter(
			(s) =>
				s.status === "PENDING" &&
				(!settlementIds || settlementIds.includes(s.id)),
		);
		const batch: PayoutBatchItem = {
			id: `pb-${Date.now()}`,
			ref: `PB-${new Date().getFullYear()}-${Math.floor(313 + Math.random() * 50)}`,
			createdBy: "You",
			status: "PROCESSING",
			total: chosen.reduce((a, s) => a + s.net, 0),
			businessCount: new Set(chosen.map((s) => s.businessId)).size,
			settlementCount: chosen.length,
			createdAt: new Date().toISOString(),
		};
		return {
			ok: true,
			data: {
				batch,
				settlements: chosen.map((s) => ({
					...s,
					status: "SETTLED",
					payoutBatchId: batch.id,
				})),
			},
		};
	}
	const { data, error } = await api("@post/payment/admin/payouts/batches", {
		...(await withSession()),
		body: { settlementIds: settlementIds ?? null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				error?.status === 409
					? "There are no pending settlements to pay out"
					: "The payout batch could not be created",
			),
		};
	revalidatePayments();
	return { ok: true, data: toDetail(data.data) };
}

/** POST .../mark-paid: the bank transfer went out; settlements get their settledAt. */
export async function markBatchPaid(
	id: string,
	input: { reference?: string; paidOn?: string },
	fallback?: PayoutBatchDetail,
): Promise<ActionResult<PayoutBatchDetail>> {
	if (!live("payment")) {
		await demoDelay(500);
		if (!fallback) return { ok: false, error: "Batch not found" };
		const now = new Date().toISOString();
		return {
			ok: true,
			data: {
				batch: {
					...fallback.batch,
					status: "PAID",
					paidAt: now,
					paidOn: input.paidOn ?? now.slice(0, 10),
					paidReference: input.reference,
				},
				settlements: fallback.settlements.map((s) =>
					s.status === "FAILED"
						? s
						: { ...s, status: "SETTLED", settledAt: now },
				),
			},
		};
	}
	const { data, error } = await api(
		"@post/payment/admin/payouts/batches/:id/mark-paid",
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
			error: errorMessage(error, "The batch could not be marked paid"),
		};
	revalidatePayments();
	return { ok: true, data: toDetail(data.data) };
}

/** POST .../fail-settlement: the bank bounced one settlement; it becomes a failed payout to retry. */
export async function failSettlement(
	batchId: string,
	input: { settlementId: string; reason?: string; bankLabel?: string },
	fallback?: PayoutBatchDetail,
): Promise<ActionResult<PayoutBatchDetail>> {
	if (!live("payment")) {
		await demoDelay(500);
		if (!fallback) return { ok: false, error: "Batch not found" };
		return {
			ok: true,
			data: {
				batch: { ...fallback.batch, status: "PART_FAILED" },
				settlements: fallback.settlements.map((s) =>
					s.id === input.settlementId
						? { ...s, status: "FAILED", failureReason: input.reason }
						: s,
				),
			},
		};
	}
	const { data, error } = await api(
		"@post/payment/admin/payouts/batches/:id/fail-settlement",
		{
			...(await withSession()),
			params: { id: batchId },
			body: {
				settlementId: input.settlementId,
				reason: input.reason ?? null,
				bankLabel: input.bankLabel ?? null,
			},
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The settlement could not be marked failed"),
		};
	revalidatePayments();
	return { ok: true, data: toDetail(data.data) };
}

/** POST /payment/admin/payouts/failed/{id}/retry?resolve=: another attempt, or resolved when the bank confirmed. */
export async function retryFailedPayout(
	id: string,
	resolve = false,
	fallback?: FailedPayoutItem,
): Promise<ActionResult<RetryPayoutResult>> {
	if (!live("payment")) {
		await demoDelay(500);
		return {
			ok: true,
			data: {
				failedPayoutId: id,
				attempts: (fallback?.attempts ?? 0) + 1,
				resolved: resolve,
			},
		};
	}
	const { data, error } = await api(
		"@post/payment/admin/payouts/failed/:id/retry",
		{ ...(await withSession()), params: { id }, query: { resolve } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The payout could not be retried"),
		};
	revalidatePayments();
	return { ok: true, data: data.data };
}
