"use client";

import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { ChatUserAvatar } from "./chat-user-avatar";
import { Badge } from "@/components/ui/badge";
import { UsersIcon } from "lucide-react";
import type { ChatConversationResponse } from "@/lib/chat-types";

interface ConversationItemProps {
	conversation: ChatConversationResponse;
	isActive: boolean;
	currentUserId: string;
	onClick: () => void;
}

function getConversationName(
	conversation: ChatConversationResponse,
	currentUserId: string,
): string {
	if (conversation.conversationType === "GROUP") {
		return conversation.conversationName ?? "Group Chat";
	}
	const otherParticipant = conversation.participants.find(
		(p) => p.userId !== currentUserId,
	);
	return otherParticipant?.userName ?? "Unknown";
}

function getOtherParticipant(
	conversation: ChatConversationResponse,
	currentUserId: string,
) {
	return conversation.participants.find((p) => p.userId !== currentUserId);
}

function formatTimestamp(dateStr: string | null): string {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	if (isToday(date)) return format(date, "h:mm a");
	if (isYesterday(date)) return "Yesterday";
	return format(date, "MMM d");
}

export function ConversationItem({
	conversation,
	isActive,
	currentUserId,
	onClick,
}: ConversationItemProps) {
	const name = getConversationName(conversation, currentUserId);
	const isGroup = conversation.conversationType === "GROUP";
	const other = isGroup ? null : getOtherParticipant(conversation, currentUserId);
	const hasUnread = conversation.unreadCount > 0;

	return (
		<button
			onClick={onClick}
			type="button"
			className={cn(
				"w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
				"hover:bg-gray-50",
				isActive && "bg-primary-6 border-l-2 border-primary-4 hover:bg-primary-6",
				!isActive && "border-l-2 border-transparent",
			)}
		>
			{isGroup ? (
				<div className="relative shrink-0">
					<div className="size-10 rounded-full bg-primary-4/15 flex items-center justify-center">
						<UsersIcon className="size-5 text-primary-3" />
					</div>
				</div>
			) : (
				<ChatUserAvatar
					name={other?.userName ?? name}
					avatarUrl={other?.userAvatar}
					userId={other?.userId}
					size="md"
				/>
			)}

			<div className="flex-1 min-w-0 overflow-hidden">
				<div className="flex items-center justify-between gap-2">
					<span
						className={cn(
							"block w-0 flex-grow text-sm overflow-hidden text-ellipsis whitespace-nowrap",
							hasUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700",
						)}
					>
						{name}
					</span>
					<span className="text-[10px] text-muted-foreground shrink-0">
						{formatTimestamp(conversation.lastMessageAt)}
					</span>
				</div>
				<div className="flex items-center justify-between gap-2 mt-0.5">
					<p
						className={cn(
							"block w-0 flex-grow text-xs overflow-hidden text-ellipsis whitespace-nowrap",
							hasUnread
								? "text-gray-600 font-medium"
								: "text-muted-foreground",
						)}
					>
						{conversation.lastMessagePreview || "No messages yet"}
					</p>
					{hasUnread && (
						<Badge className="bg-primary-4 text-white text-[10px] h-5 min-w-5 flex items-center justify-center px-1.5 rounded-full shrink-0">
							{conversation.unreadCount > 99
								? "99+"
								: conversation.unreadCount}
						</Badge>
					)}
				</div>
			</div>
		</button>
	);
}
