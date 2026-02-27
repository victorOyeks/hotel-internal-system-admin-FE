"use client";

import { useState, useMemo } from "react";
import {
	Dialog,
	DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatUserAvatar } from "./chat-user-avatar";
import {
	useCreateOneOnOneConversation,
	useCreateGroupConversation,
} from "@/hooks/use-chat-conversations";
import { getHotelStaff } from "@/lib/chat-actions";
import { useQuery } from "@tanstack/react-query";
import { chatKeys } from "@/lib/chat-query-keys";
import type { ChatConversationResponse } from "@/lib/chat-types";
import {
	SearchIcon,
	Loader2Icon,
	CheckIcon,
	UsersIcon,
	UserIcon,
	XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StaffMember {
	id: string;
	fullName: string;
	email: string;
	avatar?: string | null;
	roles?: string[];
}

interface NewConversationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentUserId: string;
	hotelId: string;
	onConversationCreated: (conversation: ChatConversationResponse) => void;
}

export function NewConversationDialog({
	open,
	onOpenChange,
	currentUserId,
	hotelId,
	onConversationCreated,
}: NewConversationDialogProps) {
	const [tab, setTab] = useState<string>("direct");
	const [search, setSearch] = useState("");
	const [groupName, setGroupName] = useState("");
	const [selectedUsers, setSelectedUsers] = useState<StaffMember[]>([]);

	const { data: staffResult, isLoading: staffLoading } = useQuery({
		queryKey: chatKeys.hotelStaff(),
		queryFn: async () => {
			const result = await getHotelStaff(hotelId);
			if (!result.success) throw new Error(result.error);
			return result.data as StaffMember[];
		},
		enabled: open && !!hotelId,
		staleTime: 60_000,
	});

	const createOneOnOne = useCreateOneOnOneConversation();
	const createGroup = useCreateGroupConversation();

	const staffList = useMemo(() => {
		const list = (staffResult ?? []).filter(
			(s: StaffMember) => s.id !== currentUserId,
		);
		if (!search.trim()) return list;
		const term = search.toLowerCase();
		return list.filter(
			(s: StaffMember) =>
				s.fullName.toLowerCase().includes(term) ||
				s.email.toLowerCase().includes(term),
		);
	}, [staffResult, search, currentUserId]);

	const handleDirectMessage = (user: StaffMember) => {
		createOneOnOne.mutate(user.id, {
			onSuccess: (conversation) => {
				onConversationCreated(conversation);
				onOpenChange(false);
				resetState();
			},
			onError: (err) => toast.error(err.message),
		});
	};

	const toggleGroupUser = (user: StaffMember) => {
		setSelectedUsers((prev) =>
			prev.find((u) => u.id === user.id)
				? prev.filter((u) => u.id !== user.id)
				: [...prev, user],
		);
	};

	const handleCreateGroup = () => {
		if (!groupName.trim()) {
			toast.error("Please enter a group name");
			return;
		}
		if (selectedUsers.length < 1) {
			toast.error("Select at least one participant");
			return;
		}

		createGroup.mutate(
			{
				name: groupName.trim(),
				participantIds: selectedUsers.map((u) => u.id),
			},
			{
				onSuccess: (conversation) => {
					onConversationCreated(conversation);
					onOpenChange(false);
					resetState();
				},
				onError: (err) => toast.error(err.message),
			},
		);
	};

	const resetState = () => {
		setSearch("");
		setGroupName("");
		setSelectedUsers([]);
		setTab("direct");
	};

	const isPending = createOneOnOne.isPending || createGroup.isPending;

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				onOpenChange(v);
				if (!v) resetState();
			}}
		>
			<DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
				{/* Header */}
				<div className="px-5 pt-5 pb-4">
					<h2 className="text-base font-semibold text-gray-900">New Conversation</h2>
					<p className="text-xs text-gray-400 mt-0.5">Start a direct message or create a group</p>

					{/* Tab toggle */}
					<div className="flex items-center gap-1 mt-4 p-1 bg-gray-100 rounded-full w-fit">
						<button
							type="button"
							onClick={() => setTab("direct")}
							className={cn(
								"flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
								tab === "direct"
									? "bg-white text-primary-2 shadow-sm"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							<UserIcon className="size-3.5" />
							Direct
						</button>
						<button
							type="button"
							onClick={() => setTab("group")}
							className={cn(
								"flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
								tab === "group"
									? "bg-white text-primary-2 shadow-sm"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							<UsersIcon className="size-3.5" />
							Group
						</button>
					</div>
				</div>

				{/* Group name input */}
				{tab === "group" && (
					<div className="px-5 pb-3">
						<input
							type="text"
							placeholder="Group name..."
							value={groupName}
							onChange={(e) => setGroupName(e.target.value)}
							className="w-full px-4 py-2.5 rounded-full bg-gray-100 border-none text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-4/20"
						/>
					</div>
				)}

				{/* Selected users chips */}
				{tab === "group" && selectedUsers.length > 0 && (
					<div className="px-5 pb-3 flex flex-wrap gap-1.5">
						{selectedUsers.map((user) => (
							<span
								key={user.id}
								className="inline-flex items-center gap-1 pl-2 pr-1 py-1 bg-primary-6 text-primary-2 rounded-full text-xs font-medium"
							>
								{user.fullName}
								<button
									type="button"
									onClick={() => toggleGroupUser(user)}
									className="size-4 flex items-center justify-center hover:bg-primary-5/30 rounded-full"
								>
									<XIcon className="size-2.5" />
								</button>
							</span>
						))}
					</div>
				)}

				{/* Search */}
				<div className="px-5 pb-3">
					<div className="relative">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search staff..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-9 pr-4 py-2.5 rounded-full bg-gray-100 border-none text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-4/20"
						/>
					</div>
				</div>

				{/* Staff list */}
				<ScrollArea className={tab === "group" ? "h-[min(200px,38dvh)]" : "h-[min(280px,50dvh)]"}>
					{staffLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2Icon className="size-5 animate-spin text-primary-4" />
						</div>
					) : staffList.length === 0 ? (
						<p className="text-center text-sm text-gray-400 py-10">
							No staff found
						</p>
					) : (
						<div className="px-3 pb-2">
							{staffList.map((user: StaffMember) => {
								const isSelected = selectedUsers.some((u) => u.id === user.id);
								return (
									<button
										key={user.id}
										type="button"
										onClick={() =>
											tab === "direct"
												? handleDirectMessage(user)
												: toggleGroupUser(user)
										}
										disabled={isPending}
										className={cn(
											"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors disabled:opacity-50",
											isSelected && tab === "group"
												? "bg-primary-6"
												: "hover:bg-gray-50",
										)}
									>
										<ChatUserAvatar
											name={user.fullName}
											avatarUrl={user.avatar}
											userId={user.id}
											size="sm"
										/>
										<div className="flex-1 text-left min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">
												{user.fullName}
											</p>
											<p className="text-xs text-gray-400 truncate">
												{user.email}
											</p>
										</div>
										{tab === "group" && isSelected && (
											<span className="size-5 rounded-full bg-primary-4 flex items-center justify-center shrink-0">
												<CheckIcon className="size-3 text-white" />
											</span>
										)}
									</button>
								);
							})}
						</div>
					)}
				</ScrollArea>

				{/* Group footer */}
				{tab === "group" && (
					<div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
						<Button
							variant="ghost"
							onClick={() => onOpenChange(false)}
							className="rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
							size="sm"
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateGroup}
							disabled={isPending || !groupName.trim() || selectedUsers.length < 1}
							size="sm"
							className="rounded-full bg-primary-2 hover:bg-primary-1 text-white px-5"
						>
							{isPending && (
								<Loader2Icon className="size-3.5 mr-1.5 animate-spin" />
							)}
							Create Group
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
