"use client";

import { useState, useMemo, useEffect } from "react";
import { PenSquareIcon } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationSearch } from "./conversation-search";
import { ConversationList } from "./conversation-list";
import {
	useChatConversations,
	useChatConversationsSearch,
} from "@/hooks/use-chat-conversations";
import {
	activeConversationIdAtom,
	activeConversationAtom,
	mobileChatViewAtom,
	wsConnectionStatusAtom,
} from "@/lib/chat-store";
import type { ChatConversationResponse } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
	currentUserId: string;
	onNewConversation: () => void;
}

export function ConversationSidebar({
	currentUserId,
	onNewConversation,
}: ConversationSidebarProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [, setActiveConversationId] = useAtom(activeConversationIdAtom);
	const [, setActiveConversation] = useAtom(activeConversationAtom);
	const [, setMobileView] = useAtom(mobileChatViewAtom);
	const connectionStatus = useAtomValue(wsConnectionStatusAtom);

	const { data: conversationsData, isLoading: conversationsLoading } =
		useChatConversations();
	const { data: searchData, isLoading: searchLoading } =
		useChatConversationsSearch(searchTerm);

	const conversations = useMemo(() => {
		if (searchTerm.length >= 2 && searchData) {
			return searchData.content;
		}
		return conversationsData?.content ?? [];
	}, [searchTerm, searchData, conversationsData]);

	const isLoading =
		searchTerm.length >= 2 ? searchLoading : conversationsLoading;

	const handleSelect = (conversation: ChatConversationResponse) => {
		setActiveConversationId(conversation.id);
		setActiveConversation(conversation);
		setMobileView("chat");
	};

	const activeConversationId = useAtomValue(activeConversationIdAtom);

	// Keep activeConversation in sync with fresh query data
	useEffect(() => {
		if (activeConversationId && conversationsData?.content) {
			const conv = conversationsData.content.find(
				(c) => c.id === activeConversationId,
			);
			if (conv) {
				setActiveConversation(conv);
			}
		}
	}, [activeConversationId, conversationsData, setActiveConversation]);

	return (
		<div className="flex flex-col h-full overflow-hidden bg-white border-r border-gray-100">
			<div className="p-4 border-b border-gray-100 shrink-0">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-semibold text-primary-1">
							Messages
						</h2>
						<span
							className={cn(
								"size-2 rounded-full",
								connectionStatus === "connected"
									? "bg-secondary-4"
									: connectionStatus === "connecting"
										? "bg-yellow-400 animate-pulse"
										: "bg-gray-300",
							)}
						/>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onNewConversation}
						className="size-8 text-primary-3 hover:text-primary-2 hover:bg-primary-6/50"
					>
						<PenSquareIcon className="size-4" />
					</Button>
				</div>
				<ConversationSearch
					value={searchTerm}
					onChange={setSearchTerm}
				/>
			</div>
			<ScrollArea className="flex-1 min-h-0">
				<ConversationList
					conversations={conversations}
					activeConversationId={activeConversationId}
					currentUserId={currentUserId}
					isLoading={isLoading}
					onSelect={handleSelect}
				/>
			</ScrollArea>
		</div>
	);
}
