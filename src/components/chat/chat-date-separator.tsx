"use client";

import { isToday, isYesterday, format } from "date-fns";

interface ChatDateSeparatorProps {
	date: string;
}

function formatMessageDate(dateStr: string): string {
	const date = new Date(dateStr);
	if (isToday(date)) return "Today";
	if (isYesterday(date)) return "Yesterday";
	return format(date, "MMM d, yyyy");
}

export function ChatDateSeparator({ date }: ChatDateSeparatorProps) {
	return (
		<div className="flex items-center gap-3 py-2 px-4">
			<div className="flex-1 h-px bg-gray-200" />
			<span className="text-[11px] text-muted-foreground font-medium select-none">
				{formatMessageDate(date)}
			</span>
			<div className="flex-1 h-px bg-gray-200" />
		</div>
	);
}
