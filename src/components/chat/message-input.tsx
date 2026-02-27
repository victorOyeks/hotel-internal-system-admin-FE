"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { SendHorizontalIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ReplyPreview } from "./reply-preview";
import { useAtom } from "jotai";
import { replyToMessageAtom, editingMessageAtom } from "@/lib/chat-store";
import { useSendMessage, useEditMessage } from "@/hooks/use-chat-messages";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { toast } from "sonner";

interface MessageInputProps {
	conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
	const [content, setContent] = useState("");
	const [replyTo, setReplyTo] = useAtom(replyToMessageAtom);
	const [editing, setEditing] = useAtom(editingMessageAtom);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const lastTypingSentRef = useRef(0);
	const { sendTyping } = useTypingIndicator(conversationId);

	const resizeTextarea = useCallback(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
	}, []);

	const resetHeight = useCallback(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
	}, []);

	const sendMessage = useSendMessage();
	const editMessage = useEditMessage();

	const handleSend = useCallback(() => {
		const trimmed = content.trim();
		if (!trimmed) return;

		if (editing) {
			editMessage.mutate(
				{ messageId: editing.id, newContent: trimmed, conversationId },
				{
					onSuccess: () => {
						setContent("");
						setEditing(null);
						resetHeight();
					},
					onError: (err) => toast.error(err.message),
				},
			);
		} else {
			// Clear input immediately for snappy optimistic feel
			setContent("");
			setReplyTo(null);
			sendTyping(false);
			resetHeight();

			sendMessage.mutate(
				{
					conversationId,
					content: trimmed,
					replyToMessageId: replyTo?.id,
				},
				{
					onError: (err) => {
						// Restore content on failure
						setContent(trimmed);
						toast.error(err.message);
					},
				},
			);
		}
	}, [
		content,
		conversationId,
		replyTo,
		editing,
		sendMessage,
		editMessage,
		setReplyTo,
		setEditing,
		sendTyping,
		resetHeight,
	]);

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};
	

	const handleChange = (value: string) => {
		setContent(value);
		resizeTextarea();
		if (value.trim()) {
			const now = Date.now();
			if (now - lastTypingSentRef.current > 300) {
				sendTyping(true);
				lastTypingSentRef.current = now;
			}
		} else {
			sendTyping(false);
		}
	};

	const handleCancelEdit = () => {
		setEditing(null);
		setContent("");
		resetHeight();
	};

	return (
		<div className="bg-white shrink-0 pb-[env(safe-area-inset-bottom)] border-t border-gray-100">
			{replyTo && (
				<ReplyPreview
					senderName={replyTo.senderName}
					content={replyTo.content}
					onClose={() => setReplyTo(null)}
				/>
			)}
			{editing && (
				<div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border-b border-yellow-100">
					<span className="text-xs text-yellow-700 font-medium">
						Editing message
					</span>
					<button
						onClick={handleCancelEdit}
						className="text-xs text-yellow-600 hover:text-yellow-800 underline"
						type="button"
					>
						Cancel
					</button>
				</div>
			)}
			<div className="flex items-end gap-3 px-4 py-3">
				<div className="flex-1 relative">
					<Textarea
						ref={textareaRef}
						placeholder="Write a Message"
						value={content}
						onChange={(e) => handleChange(e.target.value)}
						onKeyDown={handleKeyDown}
						className="w-full min-h-[44px] max-h-[160px] resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus-visible:ring-primary-4/20 focus-visible:ring-2 focus-visible:border-transparent overflow-y-auto"
						rows={1}
					/>
				</div>
				<Button
					size="icon"
					onClick={handleSend}
					disabled={!content.trim() || sendMessage.isPending}
					className="bg-primary-2 hover:bg-primary-1 text-white shrink-0 size-8.5 rounded-full"
				>
					<SendHorizontalIcon className="size-4" />
				</Button>
			</div>
		</div>
	);
}
