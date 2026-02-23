"use client";

import { useCallback, useRef } from "react";
import { useAtomValue } from "jotai";
import { chatWs } from "@/lib/chat-websocket";
import { typingIndicatorsAtom } from "@/lib/chat-store";

export function useTypingIndicator(conversationId: string | null) {
	const typingMap = useAtomValue(typingIndicatorsAtom);
	const stopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const resendInterval = useRef<ReturnType<typeof setInterval> | null>(null);
	const isTypingRef = useRef(false);

	const typingUsers = conversationId
		? (typingMap[conversationId] ?? [])
		: [];

	const clearTimers = useCallback(() => {
		if (stopTimeout.current) {
			clearTimeout(stopTimeout.current);
			stopTimeout.current = null;
		}
		if (resendInterval.current) {
			clearInterval(resendInterval.current);
			resendInterval.current = null;
		}
	}, []);

	const sendTyping = useCallback(
		(typing: boolean) => {
			if (!conversationId) return;

			if (typing) {
				// Send typing=true immediately if not already typing
				if (!isTypingRef.current) {
					isTypingRef.current = true;
					chatWs.sendTypingIndicator(conversationId, true);

					// Re-send typing=true every 3s so the receiver's 5s auto-clear doesn't expire
					resendInterval.current = setInterval(() => {
						chatWs.sendTypingIndicator(conversationId, true);
					}, 3000);
				}

				// Reset the stop timer on every keystroke — send typing=false after 3s of inactivity
				if (stopTimeout.current) {
					clearTimeout(stopTimeout.current);
				}
				stopTimeout.current = setTimeout(() => {
					isTypingRef.current = false;
					clearTimers();
					chatWs.sendTypingIndicator(conversationId, false);
				}, 3000);
			} else {
				isTypingRef.current = false;
				clearTimers();
				chatWs.sendTypingIndicator(conversationId, false);
			}
		},
		[conversationId, clearTimers],
	);

	return { typingUsers, sendTyping };
}
