"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ConversationSearchProps {
	value: string;
	onChange: (value: string) => void;
}

export function ConversationSearch({
	value,
	onChange,
}: ConversationSearchProps) {
	return (
		<div className="relative">
			<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
			<Input
				placeholder="Search conversations..."
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="pl-9 border-gray-200 h-9 text-sm"
			/>
		</div>
	);
}
