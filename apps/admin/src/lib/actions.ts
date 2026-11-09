"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { Terminal, TerminalRequest } from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import type { TerminalRow } from "@hospio/api/data/types";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";
import { revalidatePath } from "next/cache";

/**
 * Admin-only server actions that the shared package does not carry yet. Each one names the hotel it
 * acts on with `withSession({ hotelId })`, because a platform admin is never "in" the hotel.
 */

const toRow = (t: Terminal): TerminalRow => ({
	id: t.id,
	name: t.name,
	provider: t.provider,
	ref: t.terminalRef,
	status: t.status === "ONLINE" ? "ONLINE" : "OFFLINE",
	roles: [],
	lastSeen: t.lastSeenAt ?? t.updatedAt ?? t.createdAt ?? "",
	todayCount: 0,
	todayAmount: 0,
});

/** POST /payment/terminals for one hotel (wizard step 8 · Connections). */
export async function createTerminal(
	input: TerminalRequest,
	hotelId: string,
): Promise<ActionResult<TerminalRow>> {
	if (!input.name.trim() || !input.terminalRef.trim())
		return { ok: false, error: "Give the terminal a name and its reference" };
	if (!live("payment")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: `pos-${Date.now()}`,
				name: input.name,
				provider: input.provider,
				ref: input.terminalRef,
				status: "OFFLINE",
				roles: [],
				lastSeen: "",
				todayCount: 0,
				todayAmount: 0,
			},
		};
	}
	const { data, error } = await api("@post/payment/terminals", {
		...(await withSession({ hotelId })),
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The terminal could not be added"),
		};
	revalidatePath("/admin/onboarding");
	return { ok: true, data: toRow(data.data) };
}
