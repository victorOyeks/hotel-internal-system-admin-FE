"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { toMarketerProfileRow, toReferralItem } from "@hospio/api/data/admin";
import type {
	CommissionStatementData,
	MarketerProfileRow,
	ReferralItem,
} from "@hospio/api/data/admin-types";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";

/** The marketer portal's writes (`/platform/marketer/**`): bank details, a new referral, the month's statement. */

function revalidateMarketer() {
	for (const p of [
		"/marketer",
		"/marketer/businesses",
		"/marketer/commissions",
		"/marketer/refer",
	])
		revalidatePath(p);
}

export async function saveMarketerBank(
	input: { bankName: string; bankAccount: string; bankAccountName: string },
	fallback?: MarketerProfileRow,
): Promise<ActionResult<MarketerProfileRow>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Profile not found" };
		return { ok: true, data: { ...fallback, ...input } };
	}
	const { data, error } = await api("@put/platform/marketer/me/bank", {
		...(await withSession()),
		body: input,
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The bank details could not be saved"),
		};
	revalidateMarketer();
	return { ok: true, data: toMarketerProfileRow(data.data, fallback) };
}

export async function createReferral(input: {
	hotelName: string;
	ownerName?: string;
	phone?: string;
	email?: string;
	city?: string;
	note?: string;
}): Promise<ActionResult<ReferralItem>> {
	if (!live("platform")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: `rf-${Date.now()}`,
				hotelName: input.hotelName,
				ownerName: input.ownerName ?? "—",
				phone: input.phone ?? "",
				email: input.email,
				city: input.city ?? "",
				stage: "LEAD",
				note: input.note,
				sentAt: new Date().toISOString(),
			},
		};
	}
	const { data, error } = await api("@post/platform/marketer/referrals", {
		...(await withSession()),
		body: {
			hotelName: input.hotelName,
			ownerName: input.ownerName ?? null,
			phone: input.phone ?? null,
			email: input.email ?? null,
			city: input.city ?? null,
			note: input.note ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The referral could not be sent"),
		};
	revalidateMarketer();
	return { ok: true, data: toReferralItem(data.data) };
}

/** GET /platform/marketer/commissions/statement?month=: the month's statement as text, for the download. */
export async function loadCommissionStatement(
	month: string,
): Promise<ActionResult<CommissionStatementData>> {
	if (!live("platform")) {
		await demoDelay(300);
		return {
			ok: true,
			data: {
				month,
				marketerName: "Kunle Oshodi",
				gross: 124200,
				wht: 6210,
				net: 117990,
				text: `Hospio360 · Commission statement · ${month}\n\nMarketer: Kunle Oshodi\nGross commission: ₦124,200\nWithholding tax (5%): -₦6,210\nNet paid: ₦117,990\n\nThis is a demo statement.`,
			},
		};
	}
	const { data, error } = await api(
		"@get/platform/marketer/commissions/statement",
		{ ...(await withSession()), query: { month } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The statement could not be prepared"),
		};
	const d = data.data;
	return {
		ok: true,
		data: {
			month: d.month,
			marketerName: d.marketerName ?? "",
			gross: Number(d.gross ?? 0),
			wht: Number(d.wht ?? 0),
			net: Number(d.net ?? 0),
			text: d.text,
		},
	};
}
