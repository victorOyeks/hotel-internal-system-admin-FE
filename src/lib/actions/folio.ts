"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions";
import { api, errorMessage } from "@/lib/api/client";
import { withSession } from "@/lib/api/server";
import { live } from "@/lib/data/live";
import { toFolioRow } from "@/lib/data/mappers/reservation";
import type { FolioRow } from "@/lib/data/types";
import { demoDelay } from "@/lib/demo/mode";

/**
 * Guest folios (folio-service): post a charge at the desk, give a discount or void a line (manager),
 * split a folio or move charges to another room. In demo mode the caller's own updated row is echoed back.
 */

const FOLIO_PATHS = ["/manager/folios", "/manager/bookings", "/manager", "/front-desk", "/front-desk/folios", "/front-desk/bookings"];
function revalidateFolios() {
	for (const p of FOLIO_PATHS) revalidatePath(p);
}

export async function postCharge(folioId: string, input: { description: string; amount: number; tax?: number; category?: string }, fallback: FolioRow): Promise<ActionResult<FolioRow>> {
	if (!live("folio")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api("@post/folio/folios/:id/charges", { ...(await withSession()), params: { id: folioId }, body: { description: input.description, amount: input.amount, taxAmount: input.tax ?? 0, category: input.category ?? "Other" } });
	if (error || !data) return { ok: false, error: errorMessage(error, "The charge could not be posted") };
	revalidateFolios();
	return { ok: true, data: toFolioRow(data.data) };
}

/** Manager only; over the manager's limit the service sends it to the owner and answers accordingly. */
export async function giveDiscount(folioId: string, amount: number, reason: string, fallback: FolioRow): Promise<ActionResult<FolioRow>> {
	if (!live("folio")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api("@post/folio/folios/:id/discount", { ...(await withSession()), params: { id: folioId }, body: { amount, reason } });
	if (error || !data) return { ok: false, error: errorMessage(error, "The discount could not be applied") };
	revalidateFolios();
	return { ok: true, data: toFolioRow(data.data) };
}

/** Manager only. */
export async function voidLine(folioId: string, lineId: string, reason: string, fallback: FolioRow): Promise<ActionResult<FolioRow>> {
	if (!live("folio")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const { data, error } = await api("@post/folio/folios/:id/lines/:lineId/void", { ...(await withSession()), params: { id: folioId, lineId }, body: { reason } });
	if (error || !data) return { ok: false, error: errorMessage(error, "The line could not be voided") };
	revalidateFolios();
	return { ok: true, data: toFolioRow(data.data) };
}

/** Split (no target) or move lines to another folio or another room's folio. Needs Full access. */
export async function moveLines(folioId: string, lineIds: string[], target: { folioId?: string; roomId?: string }, fallback: FolioRow): Promise<ActionResult<FolioRow>> {
	if (!live("folio")) {
		await demoDelay(400);
		return { ok: true, data: fallback };
	}
	const body = { lineIds, targetFolioId: target.folioId ?? null, targetRoomId: target.roomId ?? null };
	const s = await withSession();
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/folio/folios/${folioId}/move-lines`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...(s.auth ? { Authorization: `Bearer ${s.auth.token}` } : {}), ...(s.headers ?? {}) },
		body: JSON.stringify(body),
	});
	const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: unknown } | null;
	if (!res.ok || !json?.status) return { ok: false, error: json?.message ?? "The charges could not be moved" };
	revalidateFolios();
	// The service answers with the source folio; the screen reloads to see the target.
	return { ok: true, data: { ...fallback, lines: fallback.lines.filter((l) => !lineIds.includes(l.id)) } };
}

export async function staySummary(folioId: string): Promise<ActionResult<string>> {
	if (!live("folio")) {
		await demoDelay(300);
		return { ok: true, data: "Stay summary (sample)" };
	}
	const s = await withSession();
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/folio/folios/${folioId}/stay-summary`, {
		headers: { ...(s.auth ? { Authorization: `Bearer ${s.auth.token}` } : {}), ...(s.headers ?? {}) },
	});
	const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: string } | null;
	if (!res.ok || !json?.status) return { ok: false, error: json?.message ?? "The summary could not be produced" };
	return { ok: true, data: json.data ?? "" };
}
