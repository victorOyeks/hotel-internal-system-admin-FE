"use client";

import { Loader2Icon, MessageSquareIcon } from "lucide-react";
import { ConversationItem } from "./conversation-item";
import type { ChatConversationResponse } from "@/lib/chat-types";

interface ConversationListProps {
	conversations: ChatConversationResponse[];
	activeConversationId: string | null;
	currentUserId: string;
	isLoading: boolean;
	onSelect: (conversation: ChatConversationResponse) => void;
}

export function ConversationList({
	conversations,
	activeConversationId,
	currentUserId,
	isLoading,
	onSelect,
}: ConversationListProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2Icon className="size-5 text-primary-4 animate-spin" />
			</div>
		);
	}

	if (conversations.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
				<MessageSquareIcon className="size-10 text-gray-300 mb-3" />
				<p className="text-sm text-muted-foreground">
					No conversations yet
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					Start a new conversation to begin
				</p>
			</div>
		);
	}

	return (
		<div className="px-2 py-1">
			{conversations.map((conversation) => (
				<ConversationItem
					key={conversation.id}
					conversation={conversation}
					isActive={conversation.id === activeConversationId}
					currentUserId={currentUserId}
					onClick={() => onSelect(conversation)}
				/>
			))}
		</div>
	);
}
