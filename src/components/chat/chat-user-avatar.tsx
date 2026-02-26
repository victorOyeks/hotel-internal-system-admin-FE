"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatPresence } from "@/hooks/use-chat-presence";
import { cn } from "@/lib/utils";

interface ChatUserAvatarProps {
	name: string;
	avatarUrl?: string | null;
	userId?: string;
	size?: "sm" | "md" | "lg";
	showOnlineIndicator?: boolean;
	className?: string;
}

const sizeClasses = {
	sm: "size-8",
	md: "size-10",
	lg: "size-12",
};

const dotSizeClasses = {
	sm: "size-2",
	md: "size-2.5",
	lg: "size-3",
};

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function ChatUserAvatar({
	name,
	avatarUrl,
	userId,
	size = "md",
	showOnlineIndicator = true,
	className,
}: ChatUserAvatarProps) {
	const { isOnline } = useChatPresence();
	const online = userId ? isOnline(userId) : false;

	return (
		<div className={cn("relative shrink-0", className)}>
			<Avatar className={sizeClasses[size]}>
				{avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
				<AvatarFallback className="bg-primary-4/15 text-primary-3 text-xs font-medium">
					{getInitials(name)}
				</AvatarFallback>
			</Avatar>
			{showOnlineIndicator && online && (
				<span
					className={cn(
						"absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-[1.5px] ring-white",
						dotSizeClasses[size],
					)}
				/>
			)}
		</div>
	);
}
