"use client";

import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { onlineUsersAtom } from "@/lib/chat-store";

export function useChatPresence() {
	const onlineUsers = useAtomValue(onlineUsersAtom);

	const isOnline = useCallback(
		(userId: string) => onlineUsers.includes(userId),
		[onlineUsers],
	);

	return { onlineUsers, isOnline };
}
