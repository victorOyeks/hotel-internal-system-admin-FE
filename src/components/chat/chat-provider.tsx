"use client";

import type { ReactNode } from "react";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";

interface ChatProviderProps {
	token: string;
	hotelId: string;
	userId: string;
	children: ReactNode;
}

export function ChatProvider({
	token,
	hotelId,
	userId,
	children,
}: ChatProviderProps) {
	useChatWebSocket(token, hotelId, userId);

	return <>{children}</>;
}
