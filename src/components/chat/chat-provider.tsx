"use client";

import type { ReactNode } from "react";

interface ChatProviderProps {
	token: string;
	hotelId: string;
	userId: string;
	children: ReactNode;
}

/**
 * Chat context wrapper for the Messages page.
 * WebSocket connection is managed globally by ChatGlobalProvider in the dashboard layout.
 */
export function ChatProvider({
	children,
}: ChatProviderProps) {
	return <>{children}</>;
}
