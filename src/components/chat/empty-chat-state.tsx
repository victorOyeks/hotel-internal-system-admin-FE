"use client";

import { MessageSquareIcon, PenSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyChatStateProps {
	onNewConversation: () => void;
}

export function EmptyChatState({ onNewConversation }: EmptyChatStateProps) {
	return (
		<div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/40">
			<div className="size-16 rounded-full bg-primary-6 flex items-center justify-center mb-4">
				<MessageSquareIcon className="size-7 text-primary-4" />
			</div>
			<h3 className="text-lg font-semibold text-gray-900">Your Messages</h3>
			<p className="text-sm text-gray-400 mt-1.5 max-w-xs">
				Select a conversation or start a new one to begin messaging your team.
			</p>
			<Button
				onClick={onNewConversation}
				className="mt-5 bg-primary-2 hover:bg-primary-1 text-white rounded-full px-5"
			>
				<PenSquareIcon className="size-4 mr-2" />
				New Conversation
			</Button>
		</div>
	);
}
