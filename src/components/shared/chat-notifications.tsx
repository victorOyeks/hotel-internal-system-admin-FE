"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSetAtom } from "jotai";
import { totalUnreadCountAtom } from "@/lib/chat-store";
import { getTotalUnreadCount } from "@/lib/chat-actions";

/**
 * Fetches total unread message count on mount and polls every 30s.
 * Sets the totalUnreadCountAtom so the sidebar badge stays in sync.
 */
export function ChatUnreadSync() {
	const setTotalUnread = useSetAtom(totalUnreadCountAtom);

	const fetchUnread = useCallback(async () => {
		const result = await getTotalUnreadCount();
		if (result.success && typeof result.data === "number") {
			setTotalUnread(result.data);
		}
	}, [setTotalUnread]);

	useEffect(() => {
		fetchUnread();
		const interval = setInterval(fetchUnread, 30_000);
		return () => clearInterval(interval);
	}, [fetchUnread]);

	return null;
}
