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
							<ReplyIcon />
							Reply
						</ContextMenuItem>
						<ContextMenuItem onClick={handleCopy}>
							<CopyIcon />
							Copy
						</ContextMenuItem>
					</>
				)}
				{isOwn && !isDeleted && (
					<>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={onEdit}>
							<PencilIcon />
							Edit
						</ContextMenuItem>
						<ContextMenuItem
							onClick={onDelete}
							variant="destructive"
						>
							<Trash2Icon />
							Delete
						</ContextMenuItem>
					</>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
}
