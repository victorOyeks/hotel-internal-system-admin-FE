"use client";

import { atom } from "jotai";
import type {
	ChatConversationResponse,
	ChatMessageResponse,
	TypingIndicatorDTO,
} from "./chat-types";

export const activeConversationIdAtom = atom<string | null>(null);

export const activeConversationAtom =
	atom<ChatConversationResponse | null>(null);

export const typingIndicatorsAtom = atom<
	Record<string, TypingIndicatorDTO[]>
>({});

export const onlineUsersAtom = atom<string[]>([]);

export const replyToMessageAtom = atom<{
	id: string;
	senderName: string;
	content: string;
	messageType: string;
} | null>(null);

export const editingMessageAtom = atom<ChatMessageResponse | null>(null);

export const wsConnectionStatusAtom = atom<
	"connecting" | "connected" | "disconnected" | "error"
>("disconnected");

export const mobileChatViewAtom = atom<"sidebar" | "chat">("sidebar");

export const chatHotelIdAtom = atom<string>("");

export const chatUserIdAtom = atom<string>("");

export const chatFullNameAtom = atom<string>("");

export const totalUnreadCountAtom = atom<number>(0);

// Incrementing this triggers a refetch of unread conversation count
export const unreadRefetchTriggerAtom = atom<number>(0);
