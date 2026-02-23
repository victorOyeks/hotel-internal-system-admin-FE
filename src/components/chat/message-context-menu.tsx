"use client";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CopyIcon, PencilIcon, ReplyIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

interface MessageContextMenuProps {
	children: React.ReactNode;
	isOwn: boolean;
	content: string;
	isDeleted: boolean;
	onReply: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

export function MessageContextMenu({
	children,
	isOwn,
	content,
	isDeleted,
	onReply,
	onEdit,
	onDelete,
}: MessageContextMenuProps) {
	const handleCopy = () => {
		navigator.clipboard.writeText(content);
		toast.success("Copied to clipboard");
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				{!isDeleted && (
					<>
						<ContextMenuItem onClick={onReply}>
							<ReplyIcon className="size-4 mr-2" />
							Reply
						</ContextMenuItem>
						<ContextMenuItem onClick={handleCopy}>
							<CopyIcon className="size-4 mr-2" />
							Copy
						</ContextMenuItem>
					</>
				)}
				{isOwn && !isDeleted && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={onEdit}>
							<PencilIcon className="size-4 mr-2" />
							Edit
						</ContextMenuItem>
						<ContextMenuItem
							onClick={onDelete}
							className="text-destructive focus:text-destructive"
						>
							<Trash2Icon className="size-4 mr-2" />
							Delete
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
}
