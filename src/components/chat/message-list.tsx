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
	unreadCount: number;
}

function isSameDay(d1: string, d2: string): boolean {
	return new Date(d1).toDateString() === new Date(d2).toDateString();
}

export function MessageList({
	conversationId,
	currentUserId,
	isGroup,
	unreadCount,
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
	const unreadRef = useRef<HTMLDivElement>(null);
	const prevMessageCountRef = useRef(0);
	const initialUnreadRef = useRef(unreadCount);
	const hasScrolledRef = useRef(false);

	const allMessages = useMemo(() => {
		if (!data) return [];
		// Server returns pages in DESC order (newest first).
		// Reverse pages then flatten to get ASC order — O(n) instead of O(n log n) sort.
		const reversed = [...data.pages].reverse();
		return reversed.flatMap((page) => [...page.content].reverse());
	}, [data]);

	// Find the index of the first unread message (only counting messages from others)
	const firstUnreadIdx = useMemo(() => {
		const count = initialUnreadRef.current;
		if (count <= 0 || allMessages.length === 0) return -1;
		let remaining = count;
		for (let i = allMessages.length - 1; i >= 0; i--) {
			if (allMessages[i].senderId !== currentUserId) {
				remaining--;
				if (remaining === 0) return i;
			}
		}
		return -1;
	}, [allMessages, currentUserId]);

	// Mark as read when conversation opens
	const markAsReadRef = useRef(markAsRead.mutate);
	markAsReadRef.current = markAsRead.mutate;
	useEffect(() => {
		if (conversationId) {
			markAsReadRef.current(conversationId);
		}
	}, [conversationId]);

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		const currentCount = allMessages.length;
		if (currentCount > prevMessageCountRef.current) {
			const isNewMessage =
				currentCount - prevMessageCountRef.current <= 2;
			if (isNewMessage && hasScrolledRef.current) {
				bottomRef.current?.scrollIntoView({ behavior: "smooth" });
			}
		}
		prevMessageCountRef.current = currentCount;
	}, [allMessages.length]);

	// Initial scroll to first unread message or bottom
	useEffect(() => {
		if (!isLoading && allMessages.length > 0 && !hasScrolledRef.current) {
			hasScrolledRef.current = true;
			if (firstUnreadIdx >= 0 && unreadRef.current) {
				unreadRef.current.scrollIntoView();
			} else {
				bottomRef.current?.scrollIntoView();
			}
		}
	}, [isLoading, allMessages.length, firstUnreadIdx]);

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
			deleteMessage.mutate(
				{ messageId: msg.id, conversationId },
				{ onError: (err) => toast.error(err.message) },
			);
		},
		[deleteMessage, conversationId],
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
							{idx === firstUnreadIdx && (
								<div ref={unreadRef} className="flex items-center gap-3 py-2 px-4">
									<div className="flex-1 h-px bg-blue-400" />
									<span className="text-[11px] text-blue-500 font-semibold select-none whitespace-nowrap">
										Unread Messages
									</span>
									<div className="flex-1 h-px bg-blue-400" />
								</div>
							)}
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
