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
}

export function ChatArea({
	conversation,
	currentUserId,
	showBackButton,
	onBack,
}: ChatAreaProps) {
	return (
		<div className="flex flex-col h-full overflow-hidden bg-gray-50/30">
			<ChatHeader
				conversation={conversation}
				currentUserId={currentUserId}
				showBackButton={showBackButton}
				onBack={onBack}
			/>
			<MessageList
				conversationId={conversation.id}
				currentUserId={currentUserId}
				isGroup={conversation.conversationType === "GROUP"}
			/>
			<MessageInput conversationId={conversation.id} />
		</div>
	);
}
