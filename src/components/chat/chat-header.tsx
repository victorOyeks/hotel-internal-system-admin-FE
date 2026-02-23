"use client";

import { ChevronLeftIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatUserAvatar } from "./chat-user-avatar";
import { useChatPresence } from "@/hooks/use-chat-presence";
import type { ChatConversationResponse } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
	conversation: ChatConversationResponse;
	currentUserId: string;
	showBackButton: boolean;
	onBack: () => void;
}

export function ChatHeader({
	conversation,
	currentUserId,
	showBackButton,
	onBack,
}: ChatHeaderProps) {
	const { isOnline } = useChatPresence();
	const isGroup = conversation.conversationType === "GROUP";

	const otherParticipant = isGroup
		? null
		: conversation.participants.find((p) => p.userId !== currentUserId);

	const name = isGroup
		? conversation.conversationName ?? "Group Chat"
		: otherParticipant?.userName ?? "Unknown";

	const online = otherParticipant ? isOnline(otherParticipant.userId) : false;
	const activeCount = isGroup
		? conversation.participants.filter((p) => p.isActive && isOnline(p.userId))
				.length
		: 0;
	const totalCount = isGroup
		? conversation.participants.filter((p) => p.isActive).length
		: 0;

	return (
		<div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
			{showBackButton && (
				<Button
					variant="ghost"
					size="icon"
					onClick={onBack}
					className="size-8 -ml-1 shrink-0"
				>
					<ChevronLeftIcon className="size-5" />
				</Button>
			)}

			{isGroup ? (
				<div className="size-10 rounded-full bg-primary-4/15 flex items-center justify-center shrink-0">
					<UsersIcon className="size-5 text-primary-3" />
				</div>
			) : (
				<ChatUserAvatar
					name={name}
					avatarUrl={otherParticipant?.userAvatar}
					userId={otherParticipant?.userId}
					size="md"
				/>
			)}

			<div className="flex-1 min-w-0">
				<h3 className="text-sm font-semibold text-gray-900 truncate">
					{name}
				</h3>
				{isGroup ? (
					<p className="text-xs text-muted-foreground">
						{totalCount} members{activeCount > 0 && `, ${activeCount} online`}
					</p>
				) : (
					<p
						className={cn(
							"text-xs",
							online ? "text-secondary-4" : "text-muted-foreground",
						)}
					>
						{online ? "Online" : "Offline"}
					</p>
				)}
			</div>
		</div>
	);
}
