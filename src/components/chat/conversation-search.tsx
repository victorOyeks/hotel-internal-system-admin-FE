"use client";

import { SearchIcon } from "lucide-react";

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
			<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
			<input
				type="text"
				placeholder="Search"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full pl-9 pr-4 py-2 h-9 rounded-full bg-gray-100 border-none text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-4/20"
			/>
		</div>
	);
}
