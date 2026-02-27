"use client";

import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import type { ChatConversationResponse } from "@/lib/chat-types";

interface ChatAreaProps {
	conversation: ChatConversationResponse;
	currentUserId: string;
	showBackButton: boolean;
	onBack: () => void;
	onClose?: () => void;
}

export function ChatArea({
	conversation,
	currentUserId,
	showBackButton,
	onBack,
	onClose,
}: ChatAreaProps) {
	return (
		<div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
			<ChatHeader
				conversation={conversation}
				currentUserId={currentUserId}
				showBackButton={showBackButton}
				onBack={onBack}
				onClose={onClose}
			/>
			<MessageList
				key={conversation.id}
				conversationId={conversation.id}
				currentUserId={currentUserId}
				isGroup={conversation.conversationType === "GROUP"}
				unreadCount={conversation.unreadCount}
			/>
			<MessageInput conversationId={conversation.id} />
		</div>
	);
}
