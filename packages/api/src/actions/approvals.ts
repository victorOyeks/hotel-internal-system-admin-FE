"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";
import {
	deliveriesOf,
	revalidateOps,
	type WithDeliveries,
} from "./ops-helpers";

/** platform-service approvals: decide (approve, decline, ask a question) and escalate to the owner. */

export type ApprovalOutcome = {
	id: string;
	status: "PENDING" | "APPROVED" | "DECLINED" | "QUESTION";
	approverLevel?: "MANAGER" | "OWNER";
};

const status = (s: string): ApprovalOutcome["status"] =>
	s === "APPROVED" || s === "DECLINED" || s === "QUESTION" ? s : "PENDING";

export async function decideApproval(
	id: string,
	decision: "APPROVED" | "DECLINED" | "QUESTION",
	note?: string,
): Promise<ActionResult<WithDeliveries<ApprovalOutcome>>> {
	if (!live("platform")) {
		await demoDelay(400);
		return { ok: true, data: { id, status: decision } };
	}
	const { data, error } = await api("@post/platform/approvals/:id/decide", {
		...(await withSession()),
		params: { id },
		body: { decision, note: note?.trim() || null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The decision could not be saved"),
		};
	revalidateOps();
	return {
		ok: true,
		data: {
			id: data.data.id,
			status: status(data.data.status),
			approverLevel: data.data.approverLevel === "OWNER" ? "OWNER" : "MANAGER",
			deliveries: deliveriesOf(data),
		},
	};
}

/** Manager: pass a manager-level approval up to the owner. */
export async function escalateApproval(
	id: string,
	note?: string,
): Promise<ActionResult<WithDeliveries<ApprovalOutcome>>> {
	if (!live("platform")) {
		await demoDelay(400);
		return {
			ok: true,
			data: { id, status: "PENDING", approverLevel: "OWNER" },
		};
	}
	const { data, error } = await api("@post/platform/approvals/:id/escalate", {
		...(await withSession()),
		params: { id },
		body: { note: note?.trim() || null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "It could not be sent to the owner"),
		};
	revalidateOps();
	return {
		ok: true,
		data: {
			id: data.data.id,
			status: status(data.data.status),
			approverLevel: "OWNER",
			deliveries: deliveriesOf(data),
		},
	};
}
