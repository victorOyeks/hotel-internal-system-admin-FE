"use server";

import { verifySession } from "./dal";
import { env } from "@/env";
import { parseError } from "./action-utils";

const API_BASE = `${env.NEXT_PUBLIC_API_URL}/api/chat`;

async function chatFetch<T>(
	path: string,
	options: RequestInit = {},
): Promise<{ success: true; data: T } | { success: false; error: string }> {
	try {
		const session = await verifySession();
		const url = `${API_BASE}${path}`;
		const response = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${session.token}`,
				...options.headers,
			},
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({ message: "Request failed" }));
			return { success: false, error: err.message || `HTTP ${response.status}` };
		}

		const json = await response.json();
		return { success: true, data: json.data ?? json };
	} catch (error) {
		return { success: false, error: parseError(error) };
	}
}

export async function getOrCreateOneOnOneConversation(otherUserId: string) {
	return chatFetch(`/conversations/one-on-one/${otherUserId}`, {
		method: "POST",
	});
}

export async function createGroupConversation(
	conversationName: string,
	participantUserIds: string[],
) {
	return chatFetch(
		`/conversations/group?conversationName=${encodeURIComponent(conversationName)}`,
		{
			method: "POST",
			body: JSON.stringify(participantUserIds),
		},
	);
}

export async function getConversations(page = 0, size = 20) {
	return chatFetch(`/conversations?page=${page}&size=${size}`, {
		method: "GET",
	});
}

export async function searchConversations(
	searchTerm: string,
	page = 0,
	size = 20,
) {
	return chatFetch(
		`/conversations/search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&size=${size}`,
		{ method: "GET" },
	);
}

export async function sendMessage(
	conversationId: string,
	content: string,
	messageType = "TEXT",
	replyToMessageId?: string,
) {
	const params = new URLSearchParams({
		content,
		messageType,
	});
	if (replyToMessageId) {
		params.set("replyToMessageId", replyToMessageId);
	}
	return chatFetch(
		`/conversations/${conversationId}/messages?${params.toString()}`,
		{ method: "POST" },
	);
}

export async function getMessages(
	conversationId: string,
	page = 0,
	size = 50,
) {
	return chatFetch(
		`/conversations/${conversationId}/messages?page=${page}&size=${size}`,
		{ method: "GET" },
	);
}

export async function markConversationAsRead(conversationId: string) {
	return chatFetch(`/conversations/${conversationId}/read`, {
		method: "PUT",
	});
}

export async function getUnreadCount(conversationId: string) {
	return chatFetch<number>(
		`/conversations/${conversationId}/unread-count`,
		{ method: "GET" },
	);
}

export async function getTotalUnreadCount() {
	return chatFetch<number>("/unread-count", { method: "GET" });
}

export async function deleteMessage(messageId: string) {
	return chatFetch(`/messages/${messageId}`, { method: "DELETE" });
}

export async function editMessage(messageId: string, newContent: string) {
	return chatFetch(
		`/messages/${messageId}?newContent=${encodeURIComponent(newContent)}`,
		{ method: "PUT" },
	);
}

export async function getConversationPresence(conversationId: string) {
	return chatFetch(`/conversations/${conversationId}/presence`, {
		method: "GET",
	});
}

export async function getOnlineUsers() {
	return chatFetch("/presence/online", { method: "GET" });
}

export async function checkUserOnline(userId: string) {
	return chatFetch<boolean>(`/presence/${userId}`, { method: "GET" });
}

export async function batchPresenceCheck(userIds: string[]) {
	return chatFetch("/presence/batch", {
		method: "POST",
		body: JSON.stringify(userIds),
	});
}

export async function getHotelStaff(hotelId: string, search?: string) {
	try {
		const session = await verifySession();
		const params = new URLSearchParams({ hotelId, size: "100" });
		if (search?.trim()) {
			params.set("search", search.trim());
		}
		const response = await fetch(
			`${env.NEXT_PUBLIC_API_URL}/api/chat/hotel-staff?${params.toString()}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.token}`,
				},
			},
		);

		if (!response.ok) {
			const err = await response
				.json()
				.catch(() => ({ message: "Failed to fetch staff" }));
			return { success: false as const, error: err.message || "Request failed" };
		}

		const json = await response.json();
		const data = json.data ?? json;
		return { success: true as const, data: data.content ?? data };
	} catch (error) {
		return { success: false as const, error: parseError(error) };
	}
}

export async function getSessionInfo() {
	const session = await verifySession();
	return {
		token: session.token,
		userId: session.userId,
		fullName: session.fullName,
	};
}
