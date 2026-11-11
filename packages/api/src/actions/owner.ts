"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { Delivery } from "@hospio/api/api/routes-admin";
import { atHotel, withSession } from "@hospio/api/api/server";
import { getHotels } from "@hospio/api/dal";
import { live } from "@hospio/api/data/live";
import { ownerData } from "@hospio/api/data/owner";
import type {
	OwnerThreadMessage,
	OwnerThreadRow,
} from "@hospio/api/data/types";
import { demoDelay } from "@hospio/api/demo/mode";
import { decideApproval } from "./approvals";
import { changeAccess } from "./identity";

/**
 * Owner portal writes (docs/owner-portal.md in hospio-backend): staff accounts, staff threads, requests to Hospio360 support,
 * report schedules. Each returns the service's sentence on refusal. Writes on one hotel's data go to that hotel
 * (`atHotel`), never to the sidebar's branch; business-wide ones send no hotel.
 */

const OWNER_PATHS = [
	"/hotel-owner",
	"/manager/staff",
	"/manager/roles",
	"/shared/inbox",
];
function refresh() {
	for (const p of OWNER_PATHS) revalidatePath(p, "layout");
}

const NOT_LIVE: ActionResult<never> = {
	ok: false,
	error: "This is not connected on this environment",
};

/** The hotel must be one of the caller's: the services refuse it too, this says it in words first. */
async function mine(hotelId: string): Promise<string | null> {
	const hotels = await getHotels();
	return hotels.some((h) => h.id === hotelId)
		? null
		: "That hotel is not one of yours";
}

const business = <T>(work: () => Promise<T>) => atHotel(null, work);

// ---- staff accounts (identity) -------------------------------------------------------------------

export type StaffDetailsInput = {
	fullName?: string;
	phone?: string;
	email?: string;
	jobTitle?: string;
};

export async function updateStaffDetails(
	userId: string,
	input: StaffDetailsInput,
): Promise<ActionResult<null>> {
	if (!live("identity")) return NOT_LIVE;
	const { error } = await business(async () =>
		api("@put/identity/users/:id/details", {
			...(await withSession()),
			params: { id: userId },
			body: input,
		}),
	);
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The details could not be saved"),
		};
	refresh();
	return { ok: true, data: null };
}

export async function suspendStaff(
	userId: string,
	reason: string,
): Promise<ActionResult<null>> {
	if (!live("identity")) return NOT_LIVE;
	const { error } = await business(async () =>
		api("@post/identity/users/:id/suspend", {
			...(await withSession()),
			params: { id: userId },
			body: { reason },
		}),
	);
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "They could not be suspended"),
		};
	refresh();
	return { ok: true, data: null };
}

export async function pauseStaff(
	userId: string,
	days: number,
	reason?: string,
): Promise<ActionResult<{ pausedUntil?: string | null }>> {
	if (!live("identity")) return NOT_LIVE;
	const { data, error } = await business(async () =>
		api("@post/identity/users/:id/pause", {
			...(await withSession()),
			params: { id: userId },
			body: { days, reason: reason?.trim() || null },
		}),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Their access could not be paused"),
		};
	refresh();
	return { ok: true, data: { pausedUntil: data.data.pausedUntil } };
}

export async function reinstateStaff(
	userId: string,
): Promise<ActionResult<null>> {
	if (!live("identity")) return NOT_LIVE;
	const { error } = await business(async () =>
		api("@post/identity/users/:id/reinstate", {
			...(await withSession()),
			params: { id: userId },
		}),
	);
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "They could not be reinstated"),
		};
	refresh();
	return { ok: true, data: null };
}

/**
 * Shared devices (docs/shared-devices.md): the owner clears a person's PIN, or reminds someone with none to set one. Sent
 * business-wide like the other account changes; identity checks the person works for the owner. Never sets a PIN.
 */
export async function resetPinAsOwner(userId: string): Promise<ActionResult<null>> {
	if (!live("identity")) return NOT_LIVE;
	if (!userId || userId === "undefined") return { ok: false, error: "That person was not found" };
	const { error } = await business(async () =>
		api("@post/identity/users/:id/reset-pin", {
			...(await withSession()),
			params: { id: userId },
		}),
	);
	if (error) return { ok: false, error: errorMessage(error, "The PIN could not be reset") };
	refresh();
	return { ok: true, data: null };
}

export async function remindPinAsOwner(userId: string): Promise<ActionResult<null>> {
	if (!live("identity")) return NOT_LIVE;
	if (!userId || userId === "undefined") return { ok: false, error: "That person was not found" };
	const { error } = await business(async () =>
		api("@post/identity/users/:id/remind-pin", {
			...(await withSession()),
			params: { id: userId },
		}),
	);
	if (error) return { ok: false, error: errorMessage(error, "The reminder could not be sent") };
	return { ok: true, data: null };
}

/** Remove from one hotel: every role they hold there goes (the person's other hotels are untouched). */
export async function removeFromHotel(
	userId: string,
	grantIds: string[],
	hotelName: string,
): Promise<ActionResult<null>> {
	if (grantIds.length === 0)
		return { ok: false, error: `They have no role at ${hotelName} to remove` };
	for (const grantId of grantIds) {
		const r = await business(() =>
			changeAccess(userId, grantId, {
				change: "REMOVE",
				reason: `Removed from ${hotelName} by the owner`,
				allowLastRole: true,
			}),
		);
		if (!r.ok) return r;
	}
	refresh();
	return { ok: true, data: null };
}

// ---- staff threads (messaging) -------------------------------------------------------------------

export type StartThreadInput = {
	hotelId: string;
	toUserId?: string;
	toHotelManagers?: boolean;
	subject?: string;
	body: string;
	whatsapp?: boolean;
};

export async function startThread(
	input: StartThreadInput,
): Promise<
	ActionResult<{ thread: OwnerThreadRow; deliveries?: Delivery[] | null }>
> {
	if (!live("messaging")) {
		await demoDelay(300);
		return NOT_LIVE;
	}
	const wrong = await mine(input.hotelId);
	if (wrong) return { ok: false, error: wrong };
	const { data, error } = await atHotel(input.hotelId, async () =>
		api("@post/messaging/threads", {
			...(await withSession()),
			body: {
				toUserId: input.toUserId ?? null,
				toHotelManagers: !!input.toHotelManagers,
				subject: input.subject?.trim() || null,
				body: input.body.trim(),
				whatsapp: !!input.whatsapp,
			},
		}),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The message could not be sent"),
		};
	refresh();
	const names = new Map((await getHotels()).map((h) => [h.id, h.name]));
	const t = data.data.thread;
	return {
		ok: true,
		data: {
			thread: {
				id: t.id,
				hotelId: t.hotelId ?? undefined,
				hotelName: t.hotelId ? names.get(t.hotelId) : undefined,
				subject: t.subject ?? "Message",
				audience: t.audience === "MANAGERS" ? "MANAGERS" : "PERSON",
				withName: t.withName ?? "—",
				mine: t.mine,
				lastAt: t.lastMessageAt ?? t.createdAt ?? new Date().toISOString(),
				preview: t.lastPreview ?? "",
				unread: t.unread,
			},
			deliveries: data.data.deliveries,
		},
	};
}

export async function messageAllManagers(input: {
	subject?: string;
	body: string;
	whatsapp?: boolean;
}): Promise<ActionResult<{ count: number; deliveries?: Delivery[] | null }>> {
	if (!live("messaging")) return NOT_LIVE;
	const { data, error } = await business(async () =>
		api("@post/messaging/threads/managers", {
			...(await withSession()),
			body: {
				subject: input.subject?.trim() || null,
				body: input.body.trim(),
				whatsapp: !!input.whatsapp,
			},
		}),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The message could not be sent"),
		};
	refresh();
	return {
		ok: true,
		data: { count: data.data.count, deliveries: data.data.deliveries },
	};
}

/** A thread's messages; opening it marks it read for me. */
export async function openThread(
	id: string,
): Promise<
	ActionResult<{ thread: OwnerThreadRow; messages: OwnerThreadMessage[] }>
> {
	const res = await ownerData.thread(id);
	if (!res)
		return { ok: false, error: "That conversation could not be opened" };
	return { ok: true, data: res };
}

export async function replyThread(
	id: string,
	body: string,
): Promise<ActionResult<null>> {
	if (!live("messaging")) return NOT_LIVE;
	const { error } = await business(async () =>
		api("@post/messaging/threads/:id/reply", {
			...(await withSession()),
			params: { id },
			body: { body: body.trim() },
		}),
	);
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The reply could not be sent"),
		};
	refresh();
	return { ok: true, data: null };
}

// ---- guest messages (messaging) ------------------------------------------------------------------

export type GuestMessageInput = {
	/** The booking the message is about: the guest, contact and stay come from it (templates fill from it too). */
	bookingId?: string;
	guestId?: string;
	guestName: string;
	contact: string;
	channel: "WHATSAPP" | "SMS" | "EMAIL";
	subject?: string;
	body: string;
};

/**
 * A message to a guest from the hotel's inbox (at the hotel in scope). Email is sent for real; WhatsApp and SMS are saved
 * and shown on screen (coming soon). `note` is the service's line ("Email sent to …", "Saved · WhatsApp is coming soon …").
 */
export async function messageGuest(
	input: GuestMessageInput,
): Promise<
	ActionResult<{
		deliveries?: Delivery[] | null;
		note?: string;
		conversationId?: string;
	}>
> {
	if (!live("messaging")) {
		await demoDelay(300);
		return { ok: true, data: {} };
	}
	if (!input.bookingId && !input.contact.trim()) {
		return {
			ok: false,
			error:
				input.channel === "EMAIL"
					? "There is no email for this guest"
					: "There is no phone number for this guest",
		};
	}
	const email = input.channel === "EMAIL" ? input.contact.trim() || null : null;
	const phone = input.channel !== "EMAIL" ? input.contact.trim() || null : null;
	const { data, error } = await api("@post/messaging/conversations/guest", {
		...(await withSession()),
		body: {
			bookingId: input.bookingId ?? null,
			guestId: input.guestId ?? null,
			guestName: input.guestName,
			guestEmail: email,
			guestPhone: phone,
			channel: input.channel,
			subject: input.subject ?? null,
			body: input.body.trim(),
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The message could not be sent"),
		};
	return {
		ok: true,
		data: {
			deliveries: data.data.deliveries,
			note: data.message ?? undefined,
			conversationId: data.data.conversation.id,
		},
	};
}

// ---- approvals across hotels ---------------------------------------------------------------------

/** The owner decides an approval of any hotel: sent without a hotel so it is found whichever hotel raised it. */
export async function decideAsOwner(
	id: string,
	decision: "APPROVED" | "DECLINED" | "QUESTION",
	note?: string,
): ReturnType<typeof decideApproval> {
	const r = await business(() => decideApproval(id, decision, note));
	if (r.ok) refresh();
	return r;
}

// ---- requests to Hospio360 support (platform) --------------------------------------------------------

export async function requestUndo(
	changeId: string,
	note?: string,
): Promise<ActionResult<null>> {
	if (!live("platform")) return NOT_LIVE;
	const { error } = await business(async () =>
		api("@post/platform/changes/:id/request-undo", {
			...(await withSession()),
			params: { id: changeId },
			body: { note: note?.trim() || null },
		}),
	);
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The request could not be sent"),
		};
	refresh();
	return { ok: true, data: null };
}

export async function requestOwnershipTransfer(input: {
	newOwnerName: string;
	newOwnerEmail: string;
	newOwnerPhone?: string;
	note?: string;
}): Promise<ActionResult<null>> {
	if (!live("platform")) return NOT_LIVE;
	const { error } = await business(async () =>
		api("@post/platform/support/ownership-transfer", {
			...(await withSession()),
			body: {
				newOwnerName: input.newOwnerName.trim(),
				newOwnerEmail: input.newOwnerEmail.trim(),
				newOwnerPhone: input.newOwnerPhone?.trim() || null,
				note: input.note?.trim() || null,
			},
		}),
	);
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The request could not be sent"),
		};
	refresh();
	return { ok: true, data: null };
}

// ---- report schedules (platform) -----------------------------------------------------------------

export type ScheduleInput = {
	kind: string;
	every: "DAILY" | "WEEKLY" | "MONTHLY";
	sendAt: string;
	hotelId?: string;
	managers?: boolean;
};

export async function scheduleReport(
	input: ScheduleInput,
): Promise<ActionResult<null>> {
	if (!live("platform")) return NOT_LIVE;
	if (input.hotelId) {
		const wrong = await mine(input.hotelId);
		if (wrong) return { ok: false, error: wrong };
	}
	const { error } = await business(async () =>
		api("@post/platform/reports/schedules", {
			...(await withSession()),
			body: {
				...input,
				hotelId: input.hotelId ?? null,
				managers: !!input.managers,
			},
		}),
	);
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The schedule could not be saved"),
		};
	refresh();
	return { ok: true, data: null };
}

export async function stopSchedule(id: string): Promise<ActionResult<null>> {
	if (!live("platform")) return NOT_LIVE;
	const { error } = await business(async () =>
		api("@post/platform/reports/schedules/:id/stop", {
			...(await withSession()),
			params: { id },
		}),
	);
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The schedule could not be stopped"),
		};
	refresh();
	return { ok: true, data: null };
}

export async function runSchedule(
	id: string,
): Promise<ActionResult<{ deliveries?: Delivery[] | null }>> {
	if (!live("platform")) return NOT_LIVE;
	const { data, error } = await business(async () =>
		api("@post/platform/reports/schedules/:id/run", {
			...(await withSession()),
			params: { id },
		}),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The report could not be sent"),
		};
	refresh();
	return { ok: true, data: { deliveries: data.data.deliveries } };
}
