"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { Delivery } from "@hospio/api/api/routes-admin";
import { withSession } from "@hospio/api/api/server";
import {
	toConversationRow,
	toMessageRow,
	toTemplateRow,
} from "@hospio/api/data/guest-messages";
import type {
	GuestChannel,
	GuestConversationRow,
	GuestMessageRow,
	MessageTemplateRow,
} from "@hospio/api/data/guest-message-types";
import { live } from "@hospio/api/data/live";

/**
 * Guest messaging (Manager · Messaging, Front office · Messages, the booking's Message guest): messaging-service at
 * the sidebar's hotel. Email is sent for real; WhatsApp and SMS are saved and shown on screen (coming soon).
 */

const NOT_LIVE: ActionResult<never> = {
	ok: false,
	error: "Messages are not connected in this preview",
};

function refresh() {
	revalidatePath("/", "layout");
}

export type Conversation = {
	conversation: GuestConversationRow;
	messages: GuestMessageRow[];
};

export type GuestSent = {
	conversation: GuestConversationRow;
	message: GuestMessageRow;
	deliveries?: Delivery[] | null;
	/** The service's one-line answer ("Email sent to …", "Saved · WhatsApp is coming soon …"). */
	note: string;
};

export async function openConversation(
	id: string,
): Promise<ActionResult<Conversation>> {
	if (!live("messaging")) return NOT_LIVE;
	const { data, error } = await api("@get/messaging/conversations/:id", {
		...(await withSession()),
		params: { id },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "That conversation could not be opened"),
		};
	return {
		ok: true,
		data: {
			conversation: toConversationRow(data.data.conversation),
			messages: data.data.messages.map(toMessageRow),
		},
	};
}

export async function replyToGuest(
	id: string,
	body: string,
	channel?: GuestChannel,
	subject?: string,
): Promise<ActionResult<GuestSent>> {
	if (!live("messaging")) return NOT_LIVE;
	const { data, error } = await api("@post/messaging/conversations/:id/reply", {
		...(await withSession()),
		params: { id },
		body: {
			body: body.trim(),
			channel: channel ?? null,
			subject: subject ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The message could not be sent"),
		};
	refresh();
	return {
		ok: true,
		data: {
			conversation: toConversationRow(data.data.conversation),
			message: toMessageRow(data.data.message),
			deliveries: data.data.deliveries,
			note: data.message ?? "Saved",
		},
	};
}

export type NewGuestMessage = {
	bookingId?: string;
	guestName?: string;
	guestEmail?: string;
	guestPhone?: string;
	channel: GuestChannel;
	subject?: string;
	body: string;
};

/** A new message to a guest: the booking's conversation, or one by name and contact. */
export async function startGuestMessage(
	input: NewGuestMessage,
): Promise<ActionResult<GuestSent>> {
	if (!live("messaging")) return NOT_LIVE;
	const { data, error } = await api("@post/messaging/conversations/guest", {
		...(await withSession()),
		body: {
			bookingId: input.bookingId ?? null,
			guestName: input.guestName ?? null,
			guestEmail: input.guestEmail?.trim() || null,
			guestPhone: input.guestPhone?.trim() || null,
			channel: input.channel,
			subject: input.subject?.trim() || null,
			body: input.body.trim(),
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The message could not be sent"),
		};
	refresh();
	return {
		ok: true,
		data: {
			conversation: toConversationRow(data.data.conversation),
			message: toMessageRow(data.data.message),
			deliveries: data.data.deliveries,
			note: data.message ?? "Saved",
		},
	};
}

export async function logGuestReply(
	id: string,
	body: string,
): Promise<ActionResult<Conversation>> {
	if (!live("messaging")) return NOT_LIVE;
	const { data, error } = await api(
		"@post/messaging/conversations/:id/guest-reply",
		{ ...(await withSession()), params: { id }, body: { body: body.trim() } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The guest's reply could not be added"),
		};
	refresh();
	return {
		ok: true,
		data: {
			conversation: toConversationRow(data.data.conversation),
			messages: data.data.messages.map(toMessageRow),
		},
	};
}

export async function assignConversation(
	id: string,
	userId: string,
): Promise<ActionResult<GuestConversationRow>> {
	if (!live("messaging")) return NOT_LIVE;
	const { data, error } = await api("@put/messaging/conversations/:id/assign", {
		...(await withSession()),
		params: { id },
		body: { userId },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "It could not be reassigned"),
		};
	refresh();
	return { ok: true, data: toConversationRow(data.data) };
}

export async function markConversationDone(
	id: string,
	done: boolean,
): Promise<ActionResult<GuestConversationRow>> {
	if (!live("messaging")) return NOT_LIVE;
	const session = await withSession();
	const { data, error } = done
		? await api("@post/messaging/conversations/:id/close", {
				...session,
				params: { id },
			})
		: await api("@post/messaging/conversations/:id/reopen", {
				...session,
				params: { id },
			});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				done ? "It could not be marked done" : "It could not be reopened",
			),
		};
	refresh();
	return { ok: true, data: toConversationRow(data.data) };
}

export async function messageTemplates(): Promise<
	ActionResult<MessageTemplateRow[]>
> {
	if (!live("messaging")) return { ok: true, data: [] };
	const { data, error } = await api(
		"@get/messaging/templates/messages",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Templates didn't load"),
		};
	return { ok: true, data: data.data.map(toTemplateRow) };
}

export async function saveMessageTemplate(input: {
	id?: string;
	name: string;
	subject?: string;
	body: string;
}): Promise<ActionResult<MessageTemplateRow>> {
	if (!live("messaging")) return NOT_LIVE;
	const session = await withSession();
	const body = {
		name: input.name.trim(),
		subject: input.subject?.trim() || null,
		body: input.body.trim(),
	};
	const { data, error } = input.id
		? await api("@put/messaging/templates/messages/:id", {
				...session,
				params: { id: input.id },
				body,
			})
		: await api("@post/messaging/templates/messages", { ...session, body });
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The template could not be saved"),
		};
	refresh();
	return { ok: true, data: toTemplateRow(data.data) };
}

export async function deleteMessageTemplate(
	id: string,
): Promise<ActionResult<null>> {
	if (!live("messaging")) return NOT_LIVE;
	const { error } = await api("@delete/messaging/templates/messages/:id", {
		...(await withSession()),
		params: { id },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "The template could not be deleted"),
		};
	refresh();
	return { ok: true, data: null };
}

/** The template filled from a conversation's booking (or a booking): placeholders without a value stay and are listed. */
export async function fillTemplate(
	id: string,
	from: { conversationId?: string; bookingId?: string },
): Promise<
	ActionResult<{ subject?: string; body: string; missing: string[] }>
> {
	if (!live("messaging")) return NOT_LIVE;
	const { data, error } = await api("@post/messaging/templates/:id/fill", {
		...(await withSession()),
		params: { id },
		body: {
			conversationId: from.conversationId ?? null,
			bookingId: from.bookingId ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The template could not be filled"),
		};
	return {
		ok: true,
		data: {
			subject: data.data.subject ?? undefined,
			body: data.data.body,
			missing: data.data.missing,
		},
	};
}

/** An in-app notice to everyone on today's rota at this hotel. */
export async function messageEveryoneOnShift(
	body: string,
): Promise<ActionResult<{ count: number; names: string[] }>> {
	if (!live("messaging")) return NOT_LIVE;
	const { data, error } = await api("@post/messaging/shift-notice", {
		...(await withSession()),
		body: { body: body.trim() },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The message could not be sent"),
		};
	refresh();
	return { ok: true, data: data.data };
}
