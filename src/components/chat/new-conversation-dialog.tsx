"use client";

import { useState, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
			<DialogContent className="sm:max-w-[460px] p-0 gap-0">
				<DialogHeader className="p-5 pb-0">
					<DialogTitle className="text-primary-1">
						New Conversation
					</DialogTitle>
					<DialogDescription>
						Start a direct message or create a group chat
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={tab}
					onValueChange={setTab}
					className="mt-3"
				>
					<div className="px-5">
						<TabsList className="w-full">
							<TabsTrigger value="direct" className="flex-1">
								<UserIcon className="size-3.5 mr-1.5" />
								Direct
							</TabsTrigger>
							<TabsTrigger value="group" className="flex-1">
								<UsersIcon className="size-3.5 mr-1.5" />
								Group
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="px-5 pt-3">
						<div className="relative">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search staff..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9 h-9 text-sm"
							/>
						</div>
					</div>

					<TabsContent value="direct" className="mt-0 pt-2">
						<ScrollArea className="h-[300px]">
							{staffLoading ? (
								<div className="flex items-center justify-center py-12">
									<Loader2Icon className="size-5 animate-spin text-primary-4" />
								</div>
							) : staffList.length === 0 ? (
								<p className="text-center text-sm text-muted-foreground py-12">
									No staff found
								</p>
							) : (
								<div className="px-2">
									{staffList.map((user: StaffMember) => (
										<button
											key={user.id}
											type="button"
											onClick={() => handleDirectMessage(user)}
											disabled={isPending}
											className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
												<p className="text-xs text-muted-foreground truncate">
													{user.email}
												</p>
											</div>
										</button>
									))}
								</div>
							)}
						</ScrollArea>
					</TabsContent>

					<TabsContent value="group" className="mt-0 pt-2">
						<div className="px-5 pb-2">
							<Label className="text-xs text-muted-foreground">
								Group Name
							</Label>
							<Input
								placeholder="Enter group name..."
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								className="mt-1 h-9 text-sm"
							/>
						</div>

						{selectedUsers.length > 0 && (
							<div className="px-5 pb-2 flex flex-wrap gap-1.5">
								{selectedUsers.map((user) => (
									<Badge
										key={user.id}
										variant="secondary"
										className="gap-1 pr-1 bg-primary-6 text-primary-2"
									>
										{user.fullName}
										<button
											type="button"
											onClick={() => toggleGroupUser(user)}
											className="hover:bg-primary-5/30 rounded-full p-0.5"
										>
											<XIcon className="size-3" />
										</button>
									</Badge>
								))}
							</div>
						)}

						<ScrollArea className="h-[220px]">
							{staffLoading ? (
								<div className="flex items-center justify-center py-12">
									<Loader2Icon className="size-5 animate-spin text-primary-4" />
								</div>
							) : (
								<div className="px-2">
									{staffList.map((user: StaffMember) => {
										const isSelected = selectedUsers.some(
											(u) => u.id === user.id,
										);
										return (
											<button
												key={user.id}
												type="button"
												onClick={() => toggleGroupUser(user)}
												className={cn(
													"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
													isSelected
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
													<p className="text-xs text-muted-foreground truncate">
														{user.email}
													</p>
												</div>
												{isSelected && (
													<CheckIcon className="size-4 text-primary-4 shrink-0" />
												)}
											</button>
										);
									})}
								</div>
							)}
						</ScrollArea>

						<DialogFooter className="p-4 pt-2 border-t">
							<Button
								variant="outline"
								onClick={() => onOpenChange(false)}
								size="sm"
							>
								Cancel
							</Button>
							<Button
								onClick={handleCreateGroup}
								disabled={
									isPending ||
									!groupName.trim() ||
									selectedUsers.length < 1
								}
								size="sm"
								className="bg-primary-4 hover:bg-primary-3"
							>
								{isPending && (
									<Loader2Icon className="size-3.5 mr-1.5 animate-spin" />
								)}
								Create Group
							</Button>
						</DialogFooter>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
