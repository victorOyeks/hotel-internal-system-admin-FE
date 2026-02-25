"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { totalUnreadCountAtom, unreadRefetchTriggerAtom } from "@/lib/chat-store";
import { getTotalUnreadCount, getSessionInfo } from "@/lib/chat-actions";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";

/**
 * Global chat provider that runs at the dashboard level.
 * - Connects WebSocket for real-time notifications (sound + desktop) on ALL pages
 * - Fetches unread conversation count for the sidebar badge
 * - Re-fetches when a new message arrives via the trigger atom
 * - Polls every 30s as a fallback sync
 */
export function ChatGlobalProvider({ hotelId }: { hotelId: string }) {
	const [session, setSession] = useState<{
		token: string;
		userId: string;
	} | null>(null);

	useEffect(() => {
		getSessionInfo().then((info) => {
			setSession({ token: info.token, userId: info.userId });
		});
	}, []);

	if (!session) return null;

	return (
		<ChatGlobalInner
			token={session.token}
			userId={session.userId}
			hotelId={hotelId}
		/>
	);
}

function ChatGlobalInner({
	token,
	userId,
	hotelId,
}: {
	token: string;
	userId: string;
	hotelId: string;
}) {
	const setTotalUnread = useSetAtom(totalUnreadCountAtom);
	const refetchTrigger = useAtomValue(unreadRefetchTriggerAtom);
	const initialMount = useRef(true);

	// Global WebSocket connection — enables sound + desktop notifications on all pages
	useChatWebSocket(token, hotelId, userId);

	const fetchUnreadCount = useCallback(async () => {
		const result = await getTotalUnreadCount(hotelId);
		if (result.success && result.data !== undefined) {
			setTotalUnread(result.data as number);
		}
	}, [setTotalUnread, hotelId]);

	// Fetch on mount + poll every 60s as fallback sync
	useEffect(() => {
		fetchUnreadCount();
		const interval = setInterval(fetchUnreadCount, 60_000);
		return () => clearInterval(interval);
	}, [fetchUnreadCount]);

	// Re-fetch when a new message triggers the atom (skip initial mount)
	useEffect(() => {
		if (initialMount.current) {
			initialMount.current = false;
			return;
		}
		fetchUnreadCount();
	}, [refetchTrigger, fetchUnreadCount]);

	return null;
}
