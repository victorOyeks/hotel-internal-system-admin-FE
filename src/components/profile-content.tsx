"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRightIcon, LanguagesIcon, LockIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { ChangePassword } from "@/components/change-password";
import { ChangeProfileName } from "@/components/change-profile-name";
import type { UserInfoResponse } from "@/lib/fetch";

type Modal = "profile" | "password" | null;

type Props = {
	user: UserInfoResponse;
};

export function ProfileContent({ user }: Props) {
	const [openModal, setOpenModal] = useState<Modal>(null);

	const items = [
		{
			id: "profile" as const,
			label: "Change Profile Name",
			icon: UserIcon,
		},
		{
			id: "password" as const,
			label: "Change Password",
			icon: LockIcon,
		},
		{
			id: null,
			label: "Change Language",
			icon: LanguagesIcon,
		},
	];

	const initials = user.fullName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<>
			<div className="max-w-[content] mx-auto flex items-center space-x-3 p-4">
				<Avatar className="size-14 rounded-full">
					<AvatarFallback className="bg-primary-1 text-white">
						<span className="text-2xl">{initials}</span>
					</AvatarFallback>
					<AvatarImage
						src="https://i.pravatar.cc/150?img=3"
						alt="User Avatar"
					/>
				</Avatar>

				<div>
					<p className="text-xl font-medium leading-tight">{user.fullName}</p>
					<p className="text-sm text-muted-foreground">{user.email}</p>
				</div>
			</div>

			<hr className="border-t-2 border-border" />

			<div className="p-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{items.map((item) => (
						<button
							key={item.label}
							type="button"
							onClick={() => item.id !== null && setOpenModal(item.id)}
							className="group flex flex-row items-center justify-between border border-primary-5/50 rounded-xl px-2 py-3 hover:border-primary-6/50 transition-colors cursor-pointer text-left"
						>
							<div className="flex items-center gap-x-3">
								<div className="size-8 rounded-full bg-primary-5/50 flex items-center justify-center">
									<item.icon className="size-4 text-primary-1" />
								</div>
								<p className="group-hover:underline">{item.label}</p>
							</div>
							<ChevronRightIcon className="size-5" />
						</button>
					))}
				</div>
			</div>

			{/* Change Profile Name Modal */}
			<Dialog
				open={openModal === "profile"}
				onOpenChange={(open) => !open && setOpenModal(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Update Profile</DialogTitle>
						<DialogDescription>
							Update your name and phone number. Email cannot be changed.
						</DialogDescription>
					</DialogHeader>
					<ChangeProfileName
						defaultValues={{
							fullName: user.fullName,
							phoneNumber: user.phoneNumber,
						}}
						onClose={() => setOpenModal(null)}
					/>
				</DialogContent>
			</Dialog>

			{/* Change Password Modal */}
			<Dialog
				open={openModal === "password"}
				onOpenChange={(open) => !open && setOpenModal(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Change Password</DialogTitle>
						<DialogDescription>
							Enter a safe and secure password you will remember.
						</DialogDescription>
					</DialogHeader>
					<ChangePassword onClose={() => setOpenModal(null)} />
				</DialogContent>
			</Dialog>
		</>
	);
}
