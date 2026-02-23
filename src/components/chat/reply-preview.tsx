"use client";

import { XIcon, ReplyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReplyPreviewProps {
	senderName: string;
	content: string;
	onClose: () => void;
}

export function ReplyPreview({
	senderName,
	content,
	onClose,
}: ReplyPreviewProps) {
	return (
		<div className="flex items-center gap-2 px-4 py-2 bg-primary-6/50 border-t border-primary-5/20">
			<ReplyIcon className="size-3.5 text-primary-4 shrink-0" />
			<div className="flex-1 min-w-0 border-l-2 border-primary-4 pl-2">
				<p className="text-xs font-medium text-primary-3 truncate">
					{senderName}
				</p>
				<p className="text-xs text-muted-foreground truncate">{content}</p>
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="size-6 shrink-0"
				onClick={onClose}
			>
				<XIcon className="size-3.5" />
			</Button>
		</div>
	);
}
