"use client";

import { MessageSquareIcon, PenSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyChatStateProps {
	onNewConversation: () => void;
}

export function EmptyChatState({ onNewConversation }: EmptyChatStateProps) {
	return (
		<div className="flex flex-col items-center justify-center h-full text-center p-8">
			<div className="size-20 rounded-full bg-primary-6/60 flex items-center justify-center mb-5">
				<MessageSquareIcon className="size-10 text-primary-4/50" />
			</div>
			<h3 className="text-lg font-semibold text-primary-2">Your Messages</h3>
			<p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
				Select a conversation or start a new one to begin messaging your team.
			</p>
			<Button
				onClick={onNewConversation}
				variant="outline"
				className="mt-5 border-primary-5/30 text-primary-2 hover:bg-primary-6/30"
			>
				<PenSquareIcon className="size-4 mr-2" />
				New Conversation
			</Button>
		</div>
	);
}
