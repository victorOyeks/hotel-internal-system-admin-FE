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
	const sendMessage = useSendMessage();
	const editMessage = useEditMessage();

	const handleSend = useCallback(() => {
		const trimmed = content.trim();
		if (!trimmed) return;

		if (editing) {
			editMessage.mutate(
				{ messageId: editing.id, newContent: trimmed },
				{
					onSuccess: () => {
						setContent("");
						setEditing(null);
					},
					onError: (err) => toast.error(err.message),
				},
			);
		} else {
			sendMessage.mutate(
				{
					conversationId,
					content: trimmed,
					replyToMessageId: replyTo?.id,
				},
				{
					onSuccess: () => {
						setContent("");
						setReplyTo(null);
						sendTyping(false);
					},
					onError: (err) => toast.error(err.message),
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
	]);

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleChange = (value: string) => {
		setContent(value);
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
	};

	return (
		<div className="border-t bg-white shrink-0 pb-[env(safe-area-inset-bottom)]">
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
			<div className="flex items-end gap-2 p-3">
				<Textarea
					ref={textareaRef}
					placeholder="Type a message..."
					value={content}
					onChange={(e) => handleChange(e.target.value)}
					onKeyDown={handleKeyDown}
					className="flex-1 min-h-[40px] max-h-[120px] resize-none border-gray-200 focus-visible:ring-primary-4/30"
					rows={1}
				/>
				<Button
					size="icon"
					onClick={handleSend}
					disabled={!content.trim() || sendMessage.isPending}
					className="bg-primary-4 hover:bg-primary-3 text-white shrink-0 size-10 rounded-lg"
				>
					<SendHorizontalIcon className="size-4" />
				</Button>
			</div>
		</div>
	);
}
