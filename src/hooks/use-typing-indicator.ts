"use client";

import { useCallback, useRef } from "react";
import { useAtomValue } from "jotai";
import { chatWs } from "@/lib/chat-websocket";
import { typingIndicatorsAtom } from "@/lib/chat-store";

export function useTypingIndicator(conversationId: string | null) {
	const typingMap = useAtomValue(typingIndicatorsAtom);
	const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isTypingRef = useRef(false);

	const typingUsers = conversationId
		? (typingMap[conversationId] ?? [])
		: [];

	const sendTyping = useCallback(
		(typing: boolean) => {
			if (!conversationId) return;

			if (typing && !isTypingRef.current) {
				isTypingRef.current = true;
				chatWs.sendTypingIndicator(conversationId, true);
			}

			if (typingTimeout.current) {
				clearTimeout(typingTimeout.current);
			}

			if (typing) {
				typingTimeout.current = setTimeout(() => {
					isTypingRef.current = false;
					chatWs.sendTypingIndicator(conversationId, false);
				}, 3000);
			} else {
				isTypingRef.current = false;
				chatWs.sendTypingIndicator(conversationId, false);
			}
		},
		[conversationId],
	);

	return { typingUsers, sendTyping };
}
