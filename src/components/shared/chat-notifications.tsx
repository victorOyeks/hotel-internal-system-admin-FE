"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { totalUnreadCountAtom, unreadRefetchTriggerAtom } from "@/lib/chat-store";
import {
	notificationsAtom,
	notificationUnreadCountAtom,
	notificationRefetchTriggerAtom,
	notificationPageAtom,
	notificationHasNextAtom,
} from "@/lib/notification-store";
import { getTotalUnreadCount, getSessionInfo } from "@/lib/chat-actions";
import {
	getMyNotifications,
	getUnreadNotificationCount,
} from "@/lib/notification-actions";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";

/**
 * Global provider that runs at the dashboard level.
 * - Connects WebSocket for real-time chat + notification events
 * - Fetches unread counts for sidebar badge (chat) and bell badge (notifications)
 * - Re-fetches when new events arrive via trigger atoms
 * - Polls every 60s as a fallback sync
 */
export function ChatGlobalProvider({ hotelId }: { hotelId: string }) {
	const [session, setSession] = useState<{
		token: string;
		userId: string;
		role: string;
	} | null>(null);

	useEffect(() => {
		getSessionInfo().then((info) => {
			setSession({ token: info.token, userId: info.userId, role: info.role });
		});
	}, []);

	if (!session) return null;

	return (
		<ChatGlobalInner
			token={session.token}
			userId={session.userId}
			hotelId={hotelId}
			role={session.role}
		/>
	);
}

function ChatGlobalInner({
	token,
	userId,
	hotelId,
	role,
}: {
	token: string;
	userId: string;
	hotelId: string;
	role: string;
}) {
	const setTotalUnread = useSetAtom(totalUnreadCountAtom);
	const refetchTrigger = useAtomValue(unreadRefetchTriggerAtom);
	const initialMount = useRef(true);

	const setNotifications = useSetAtom(notificationsAtom);
	const setNotifUnreadCount = useSetAtom(notificationUnreadCountAtom);
	const setNotifPage = useSetAtom(notificationPageAtom);
	const setNotifHasNext = useSetAtom(notificationHasNextAtom);
	const notifRefetchTrigger = useAtomValue(notificationRefetchTriggerAtom);
	const notifInitialMount = useRef(true);

	// Global WebSocket connection — enables sound + desktop notifications on all pages
	useChatWebSocket(token, hotelId, userId, role);

	// ==================== CHAT UNREAD COUNT ====================

	const fetchChatUnreadCount = useCallback(async () => {
		const result = await getTotalUnreadCount(hotelId);
		if (result.success && result.data !== undefined) {
			setTotalUnread(result.data as number);
		}
	}, [setTotalUnread, hotelId]);

	useEffect(() => {
		fetchChatUnreadCount();
		const interval = setInterval(fetchChatUnreadCount, 60_000);
		return () => clearInterval(interval);
	}, [fetchChatUnreadCount]);

	useEffect(() => {
		if (initialMount.current) {
			initialMount.current = false;
			return;
		}
		fetchChatUnreadCount();
	}, [refetchTrigger, fetchChatUnreadCount]);

	// ==================== NOTIFICATION DATA ====================

	const fetchNotificationData = useCallback(async () => {
		const [notifResult, countResult] = await Promise.all([
			getMyNotifications(0, 20),
			getUnreadNotificationCount(),
		]);

		if (notifResult.success) {
			setNotifications(notifResult.data.notifications);
			setNotifHasNext(notifResult.data.hasNext);
			setNotifPage(0);
		}
		if (countResult.success && countResult.data !== undefined) {
			setNotifUnreadCount(countResult.data as number);
		}
	}, [setNotifications, setNotifUnreadCount, setNotifHasNext, setNotifPage]);

	useEffect(() => {
		fetchNotificationData();
		const interval = setInterval(fetchNotificationData, 60_000);
		return () => clearInterval(interval);
	}, [fetchNotificationData]);

	useEffect(() => {
		if (notifInitialMount.current) {
			notifInitialMount.current = false;
			return;
		}
		fetchNotificationData();
	}, [notifRefetchTrigger, fetchNotificationData]);

	return null;
}
