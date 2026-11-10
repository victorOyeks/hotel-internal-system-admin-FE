import "server-only";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "./live";
import {
	emptyPage,
	failedPage,
	type ListQuery,
	type PageResult,
	pageQuery,
	toPaged,
} from "./paging";
import type {
	GuestConversationRow,
	GuestMessageRow,
	MessageTemplateRow,
	OnShiftRow,
} from "./guest-message-types";

type Nullable<T> = { [K in keyof T]?: T[K] | null };

/** messaging-service's ConversationView as a screen row. */
export function toConversationRow(
	c: Nullable<{
		id: string;
		guestName: string;
		guestEmail: string;
		guestPhone: string;
		contact: string;
		channel: string;
		subject: string;
		bookingId: string;
		bookingRef: string;
		roomNumber: string;
		roomType: string;
		checkIn: string;
		checkOut: string;
		assignedToId: string;
		assignedToName: string;
		status: string;
		waiting: boolean;
		lastMessageAt: string;
		preview: string;
		doneAt: string;
		doneByName: string;
	}>,
): GuestConversationRow {
	const u = <T>(v: T | null | undefined) => (v == null ? undefined : v);
	return {
		id: c.id ?? "",
		guestName: c.guestName ?? "Guest",
		guestEmail: u(c.guestEmail),
		guestPhone: u(c.guestPhone),
		contact: u(c.contact),
		channel: u(c.channel),
		subject: u(c.subject),
		bookingId: u(c.bookingId),
		bookingRef: u(c.bookingRef),
		roomNumber: u(c.roomNumber),
		roomType: u(c.roomType),
		checkIn: u(c.checkIn),
		checkOut: u(c.checkOut),
		assignedToId: u(c.assignedToId),
		assignedToName: u(c.assignedToName),
		status: c.status === "DONE" ? "DONE" : "OPEN",
		waiting: !!c.waiting,
		lastAt: u(c.lastMessageAt),
		preview: u(c.preview),
		doneAt: u(c.doneAt),
		doneByName: u(c.doneByName),
	};
}

export function toMessageRow(
	m: Nullable<{
		id: string;
		direction: string;
		body: string;
		by: string;
		at: string;
		channel: string;
		status: string;
		error: string;
	}>,
): GuestMessageRow {
	return {
		id: m.id ?? "",
		direction: m.direction === "IN" ? "IN" : "OUT",
		body: m.body ?? "",
		by: m.by ?? (m.direction === "IN" ? "Guest" : "—"),
		at: m.at ?? undefined,
		channel: m.channel ?? undefined,
		status: m.status ?? undefined,
		error: m.error ?? undefined,
	};
}

export function toTemplateRow(
	t: Nullable<{
		id: string;
		name: string;
		subject: string;
		body: string;
		channel: string;
		updatedAt: string;
	}>,
): MessageTemplateRow {
	return {
		id: t.id ?? "",
		name: t.name ?? "Template",
		subject: t.subject ?? undefined,
		body: t.body ?? "",
		channel: t.channel ?? undefined,
		updatedAt: t.updatedAt ?? undefined,
	};
}

/** Guest conversations at the sidebar's hotel (messaging-service), a page at a time with counts per tab. */
export const guestMessagesData = {
	conversations: async (
		query: ListQuery = {},
	): Promise<PageResult<GuestConversationRow>> => {
		if (!live("messaging")) return { ok: true, data: emptyPage() };
		const { data: res, error } = await api("@get/messaging/conversations", {
			...(await withSession()),
			query: pageQuery({ ...query, kind: "GUEST" }),
		});
		if (error || !res) {
			console.error("messaging-service conversations:", error);
			return failedPage(errorMessage(error, "Messages didn't load"));
		}
		return { ok: true, data: toPaged(res.data, toConversationRow) };
	},

	templates: async (): Promise<MessageTemplateRow[]> => {
		if (!live("messaging")) return [];
		const { data: res, error } = await api(
			"@get/messaging/templates/messages",
			await withSession(),
		);
		if (error || !res) {
			console.error("messaging-service templates:", error);
			return [];
		}
		return res.data.map(toTemplateRow);
	},

	/** Who is on today's rota (managers and the owner only; empty for anyone else or when it can't be read). */
	onShift: async (): Promise<OnShiftRow[]> => {
		if (!live("messaging")) return [];
		const { data: res, error } = await api(
			"@get/messaging/shift-notice/recipients",
			await withSession(),
		);
		if (error || !res) return [];
		return res.data.map((p) => ({
			userId: p.userId,
			name: p.name,
			role: p.role ?? undefined,
			startsAt: p.startsAt ?? undefined,
			endsAt: p.endsAt ?? undefined,
			clockedIn: !!p.clockedIn,
		}));
	},
};
