"use client";

import { ChevronLeftIcon, UsersIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatUserAvatar } from "./chat-user-avatar";
import { useChatPresence } from "@/hooks/use-chat-presence";
import type { ChatConversationResponse } from "@/lib/chat-types";


interface ChatHeaderProps {
	conversation: ChatConversationResponse;
	currentUserId: string;
	showBackButton: boolean;
	onBack: () => void;
	onClose?: () => void;
}

export function ChatHeader({
	conversation,
	currentUserId,
	showBackButton,
	onBack,
	onClose,
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
		<div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 bg-white shrink-0">
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
				<div className="size-12 rounded-full bg-primary-4/15 flex items-center justify-center shrink-0">
					<UsersIcon className="size-6 text-primary-3" />
				</div>
			) : (
				<ChatUserAvatar
					name={name}
					avatarUrl={otherParticipant?.userAvatar}
					userId={otherParticipant?.userId}
					size="md"
					showOnlineIndicator={false}
				/>
			)}

			<div className="flex-1 min-w-0">
				<h3 className="text-base font-semibold text-gray-900 truncate leading-tight">
					{name}
				</h3>
				{isGroup ? (
					<p className="text-xs text-gray-400 mt-0.5">
						{totalCount} members{activeCount > 0 && `, ${activeCount} online`}
					</p>
				) : (
					<div className="flex items-center gap-1.5 mt-0.5">
						<span
							className={`size-2 rounded-full ${online ? "bg-secondary-4" : "bg-gray-300"}`}
						/>
						<span className="text-xs text-gray-400">
							{online ? "Online" : "Away"}
						</span>
					</div>
				)}
			</div>

			{onClose && (
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="size-8 shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
				>
					<XIcon className="size-4" />
				</Button>
			)}
		</div>
	);
}
