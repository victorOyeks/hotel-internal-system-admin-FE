"use client";

import dynamic from "next/dynamic";
import type { DynamicOptionsLoadingProps } from "next/dynamic";
import { MessageSquareIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function ChatLayoutLoading({
	isLoading,
	error,
	retry,
}: DynamicOptionsLoadingProps) {
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center p-8">
				<div className="size-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
					<MessageSquareIcon className="size-7 text-red-400" />
				</div>
				<h3 className="text-lg font-semibold text-gray-900">
					Failed to load messages
				</h3>
				<p className="text-sm text-gray-400 mt-1.5 max-w-xs">
					{error.message ||
						"Something went wrong while loading the chat."}
				</p>
				{retry && (
					<button
						type="button"
						onClick={retry}
						className="mt-4 text-sm font-medium text-primary-2 hover:underline"
					>
						Try again
					</button>
				)}
			</div>
		);
	}

	if (!isLoading) return null;

	return (
		<div className="flex h-full">
			{/* Conversation sidebar skeleton */}
			<div className="hidden md:flex w-80 flex-col border-r border-gray-100 bg-white">
				{/* Header: "Messages" title + compose button */}
				<div className="flex items-center justify-between px-4 pt-4 pb-3">
					<h2 className="text-lg font-semibold text-gray-900">
						Messages
					</h2>
					<Skeleton className="size-8 rounded-full" />
				</div>

				{/* Search bar */}
				<div className="px-3 pb-3">
					<Skeleton className="h-9 w-full rounded-md" />
				</div>

				{/* Conversation list */}
				<div className="flex-1 flex flex-col gap-1 px-2">
					{Array.from({ length: 7 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center gap-3 p-2.5 rounded-lg"
						>
							<Skeleton className="size-10 rounded-full shrink-0" />
							<div className="flex-1 min-w-0 space-y-1.5">
								<div className="flex items-center justify-between">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-3 w-10" />
								</div>
								<Skeleton className="h-3 w-3/4" />
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Empty chat state — mirrors EmptyChatState */}
			<div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/40">
				<div className="size-16 rounded-full bg-primary-6 flex items-center justify-center mb-4">
					<MessageSquareIcon className="size-7 text-primary-4" />
				</div>
				<h3 className="text-lg font-semibold text-gray-900">
					Your Messages
				</h3>
				<p className="text-sm text-gray-400 mt-1.5 max-w-xs">
					Loading your conversations...
				</p>
			</div>
		</div>
	);
}

export const DynamicChatLayout = dynamic(
	() =>
		import("@/components/chat/chat-layout").then((mod) => mod.ChatLayout),
	{
		ssr: false,
		loading: ChatLayoutLoading,
	},
);
