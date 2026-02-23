"use client";

import { useState, useMemo, useEffect } from "react";
import { PenSquareIcon, ArrowLeftIcon } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
	onBack?: () => void;
}

export function ConversationSidebar({
	currentUserId,
	onNewConversation,
	onBack,
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

	const totalUnread = useMemo(() => {
		return (conversationsData?.content ?? []).reduce(
			(sum, c) => sum + c.unreadCount,
			0,
		);
	}, [conversationsData]);

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
		<div className="flex flex-col h-full overflow-hidden bg-white border-r border-gray-100 pb-[env(safe-area-inset-bottom)]">
			<div className="flex items-center gap-2 p-3 border-b border-gray-100 shrink-0">
				{onBack && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onBack}
						className="size-8 shrink-0 text-primary-3 hover:text-primary-2 hover:bg-primary-6/50"
					>
						<ArrowLeftIcon className="size-4" />
					</Button>
				)}
				<div className="flex items-center gap-1.5 shrink-0">
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
					{totalUnread > 0 && (
						<Badge className="bg-primary-4 text-white text-[10px] h-5 min-w-5 flex items-center justify-center px-1.5 rounded-full">
							{totalUnread > 99 ? "99+" : totalUnread}
						</Badge>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<ConversationSearch
						value={searchTerm}
						onChange={setSearchTerm}
					/>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onNewConversation}
					className="size-8 shrink-0 text-primary-3 hover:text-primary-2 hover:bg-primary-6/50"
				>
					<PenSquareIcon className="size-4" />
				</Button>
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
