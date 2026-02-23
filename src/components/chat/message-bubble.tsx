"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DeliveryStatus } from "./delivery-status";
import { MessageContextMenu } from "./message-context-menu";
import { ChatUserAvatar } from "./chat-user-avatar";
import type { ChatMessageResponse } from "@/lib/chat-types";

interface MessageBubbleProps {
	message: ChatMessageResponse;
	isOwn: boolean;
	showAvatar: boolean;
	showName: boolean;
	onReply: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

export function MessageBubble({
	message,
	isOwn,
	showAvatar,
	showName,
	onReply,
	onEdit,
	onDelete,
}: MessageBubbleProps) {
	const time = format(new Date(message.createdAt), "h:mm a");

	if (message.messageType === "SYSTEM") {
		return (
			<div className="flex justify-center py-1">
				<span className="text-[11px] text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
					{message.content}
				</span>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex gap-2 px-4 group",
				isOwn ? "justify-end" : "justify-start",
				showAvatar ? "mt-3" : "mt-0.5",
			)}
		>
			{!isOwn && (
				<div className="w-8 shrink-0">
					{showAvatar && (
						<ChatUserAvatar
							name={message.senderName}
							avatarUrl={message.senderAvatar}
							userId={message.senderId}
							size="sm"
							showOnlineIndicator={false}
						/>
					)}
				</div>
			)}

			<MessageContextMenu
				isOwn={isOwn}
				content={message.content}
				isDeleted={message.isDeleted}
				onReply={onReply}
				onEdit={onEdit}
				onDelete={onDelete}
			>
				<div
					className={cn(
						"max-w-[70%] min-w-[80px]",
						isOwn ? "order-1" : "order-2",
					)}
				>
					{showName && !isOwn && (
						<p className="text-[11px] font-medium text-primary-3 mb-0.5 ml-1">
							{message.senderName}
						</p>
					)}

					<div
						className={cn(
							"px-3 py-2 relative",
							isOwn
								? "bg-primary-4 text-white rounded-2xl rounded-br-sm"
								: "bg-white border border-gray-100 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm",
							message.isDeleted && "opacity-60",
						)}
					>
						{message.replyToMessage && !message.isDeleted && (
							<div
								className={cn(
									"border-l-2 pl-2 mb-1.5 pb-1",
									isOwn
										? "border-white/40"
										: "border-primary-4/40",
								)}
							>
								<p
									className={cn(
										"text-[10px] font-medium",
										isOwn ? "text-white/80" : "text-primary-3",
									)}
								>
									{message.replyToMessage.senderName}
								</p>
								<p
									className={cn(
										"text-[10px] truncate max-w-[200px]",
										isOwn
											? "text-white/60"
											: "text-muted-foreground",
									)}
								>
									{message.replyToMessage.content}
								</p>
							</div>
						)}

						{message.isDeleted ? (
							<p className="text-sm italic">
								This message was deleted
							</p>
						) : (
							<p className="text-sm whitespace-pre-wrap break-words">
								{message.content}
							</p>
						)}

						<div
							className={cn(
								"flex items-center gap-1 mt-1 justify-end",
								isOwn ? "text-white/50" : "text-muted-foreground",
							)}
						>
							{message.isEdited && !message.isDeleted && (
								<span className="text-[10px]">edited</span>
							)}
							<span className="text-[10px]">{time}</span>
							{isOwn && !message.isDeleted && (
								<DeliveryStatus status={message.deliveryStatus} />
							)}
						</div>
					</div>
				</div>
			</MessageContextMenu>
		</div>
	);
}
