"use server";

import { verifySession } from "./dal";
import { env } from "@/env";
import { parseError } from "./action-utils";
import type { NotificationPageResponse } from "./notification-types";

const API_BASE = `${env.NEXT_PUBLIC_API_URL}/api/notifications`;

async function notifFetch<T>(
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
			const err = await response
				.json()
				.catch(() => ({ message: "Request failed" }));
			return {
				success: false,
				error: err.message || `HTTP ${response.status}`,
			};
		}

		const json = await response.json();
		return { success: true, data: json.data ?? json };
	} catch (error) {
		return { success: false, error: parseError(error) };
	}
}

export async function getMyNotifications(page = 0, size = 20) {
	return notifFetch<NotificationPageResponse>(
		`/my-notifications?page=${page}&size=${size}`,
	);
}

export async function getUnreadNotificationCount() {
	return notifFetch<number>("/unread/count");
}

export async function markNotificationRead(notificationId: string) {
	return notifFetch<void>(`/${notificationId}/read`, { method: "PUT" });
}

export async function markAllNotificationsRead() {
	return notifFetch<void>("/mark-all-read", { method: "PUT" });
}
