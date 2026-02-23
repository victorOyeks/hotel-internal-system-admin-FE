"use client";

import { MessageSquareIcon, PenSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyChatStateProps {
	onNewConversation: () => void;
}

export function EmptyChatState({ onNewConversation }: EmptyChatStateProps) {
	return (
		<div className="flex flex-col items-center justify-center h-full text-center p-8">
			<div className="size-16 rounded-full border border-gray-200 flex items-center justify-center mb-4">
				<MessageSquareIcon className="size-7 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-semibold text-primary-2">Your Messages</h3>
			<p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
				Select a conversation or start a new one to begin messaging your team.
			</p>
			<Button
				onClick={onNewConversation}
				variant="outline"
				className="mt-5 border-gray-200 text-primary-2 hover:bg-gray-50"
			>
				<PenSquareIcon className="size-4 mr-2" />
				New Conversation
			</Button>
		</div>
	);
}
