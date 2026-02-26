"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { Loader2Icon } from "lucide-react";
import { useSetAtom } from "jotai";
import { useChatMessages, useMarkConversationAsRead } from "@/hooks/use-chat-messages";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { replyToMessageAtom, editingMessageAtom } from "@/lib/chat-store";
import { useDeleteMessage } from "@/hooks/use-chat-messages";
import { MessageBubble } from "./message-bubble";
import { ChatDateSeparator } from "./chat-date-separator";
import { TypingIndicator } from "./typing-indicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessageResponse } from "@/lib/chat-types";
import { toast } from "sonner";

interface MessageListProps {
	conversationId: string;
	currentUserId: string;
	isGroup: boolean;
}

function isSameDay(d1: string, d2: string): boolean {
	return new Date(d1).toDateString() === new Date(d2).toDateString();
}

export function MessageList({
	conversationId,
	currentUserId,
	isGroup,
}: MessageListProps) {
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useChatMessages(conversationId);
	const { typingUsers } = useTypingIndicator(conversationId);
	const markAsRead = useMarkConversationAsRead();
	const deleteMessage = useDeleteMessage();
	const setReplyTo = useSetAtom(replyToMessageAtom);
	const setEditing = useSetAtom(editingMessageAtom);
	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const topSentinelRef = useRef<HTMLDivElement>(null);
	const prevMessageCountRef = useRef(0);

	const allMessages = useMemo(() => {
		if (!data) return [];
		// Server returns pages in DESC order (newest first).
		// Reverse pages then flatten to get ASC order — O(n) instead of O(n log n) sort.
		const reversed = [...data.pages].reverse();
		return reversed.flatMap((page) => [...page.content].reverse());
	}, [data]);

	// Mark as read when conversation opens
	useEffect(() => {
		if (conversationId) {
			markAsRead.mutate(conversationId);
		}
	}, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		const currentCount = allMessages.length;
		if (currentCount > prevMessageCountRef.current) {
			const isNewMessage =
				currentCount - prevMessageCountRef.current <= 2;
			if (isNewMessage) {
				bottomRef.current?.scrollIntoView({ behavior: "smooth" });
			}
		}
		prevMessageCountRef.current = currentCount;
	}, [allMessages.length]);

	// Initial scroll to bottom
	useEffect(() => {
		if (!isLoading && allMessages.length > 0) {
			bottomRef.current?.scrollIntoView();
		}
	}, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

	// Infinite scroll - load older messages
	useEffect(() => {
		const sentinel = topSentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const handleReply = useCallback(
		(msg: ChatMessageResponse) => {
			setReplyTo({
				id: msg.id,
				senderName: msg.senderName,
				content: msg.content,
				messageType: msg.messageType,
			});
		},
		[setReplyTo],
	);

	const handleEdit = useCallback(
		(msg: ChatMessageResponse) => {
			setEditing(msg);
		},
		[setEditing],
	);

	const handleDelete = useCallback(
		(msg: ChatMessageResponse) => {
			deleteMessage.mutate(msg.id, {
				onError: (err) => toast.error(err.message),
			});
		},
		[deleteMessage],
	);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2Icon className="size-6 text-primary-4 animate-spin" />
			</div>
		);
	}

	return (
		<ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
			<div className="py-4">
				<div ref={topSentinelRef} className="h-1" />

				{isFetchingNextPage && (
					<div className="flex justify-center py-3">
						<Loader2Icon className="size-5 text-primary-4 animate-spin" />
					</div>
				)}

				{allMessages.map((msg, idx) => {
					const prevMsg = idx > 0 ? allMessages[idx - 1] : null;
					const showDateSeparator =
						!prevMsg || !isSameDay(msg.createdAt, prevMsg.createdAt);
					const showAvatar =
						!prevMsg || prevMsg.senderId !== msg.senderId || showDateSeparator;
					const showName = isGroup && showAvatar;
					const isOwn = msg.senderId === currentUserId;

					return (
						<div key={msg.id}>
							{showDateSeparator && (
								<ChatDateSeparator date={msg.createdAt} />
							)}
							<MessageBubble
								message={msg}
								isOwn={isOwn}
								showAvatar={showAvatar}
								showName={showName}
								onReply={() => handleReply(msg)}
								onEdit={() => handleEdit(msg)}
								onDelete={() => handleDelete(msg)}
							/>
						</div>
					);
				})}

				<TypingIndicator typingUsers={typingUsers} />
				<div ref={bottomRef} />
			</div>
		</ScrollArea>
	);
}
