import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUser } from "@/lib/dal";
import {
	ArrowLeftIcon,
	ChevronRightIcon,
	LanguagesIcon,
	LockIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

function Profile() {
	const user = use(getUser())!;

	const links = [
		{
			label: "Change Profile Name",
			href: "/profile/change-name",
			icon: UserIcon,
		},
		{
			label: "Change Password",
			href: "/profile/change-password",
			icon: LockIcon,
		},
		{
			label: "Change Language",
			href: "/profile/change-language",
			icon: LanguagesIcon,
		},
	];

	return (
		<div className="h-full w-full p-4 space-y-2 md:space-y-4">
			<Link
				href={"/dashboard"}
				className="inline-flex items-center gap-x-1 px-3 py-1.5 border-2 border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
			>
				<ArrowLeftIcon className="size-4" />
				<span>Go home</span>
			</Link>

			<div className="bg-card md:m-4 md:rounded-2xl lg:rounded-4xl overflow-clip h-dvh">
				<div className="max-w-[content] mx-auto flex items-center space-x-3 p-4">
					<Avatar className="size-14 rounded-full">
						<AvatarFallback className="bg-primary-1 text-white">
							<span className="text-2xl">A</span>
						</AvatarFallback>
						<AvatarImage
							src="https://i.pravatar.cc/150?img=3"
							alt="User Avatar"
						/>
					</Avatar>

					<div className="">
						<p className="text-xl font-medium leading-tight">{user.fullName}</p>
						<p className="text-sm text-muted-foreground">{user.email}</p>
					</div>
				</div>

				<hr className="border-t-2 border-border" />

				<div className="p-4 space-y-2">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{links.map((link) => (
							<div
								key={link.href}
								className="group flex flex-row items-center justify-between border border-primary-5/50 rounded-xl px-2 py-3 relative hover:border-primary-6/50 transition-colors  cursor-pointer"
							>
								<Link
									href={link.href}
									aria-label={link.label}
									className="absolute inset-0 z-10"
								/>
								<div className="flex items-center gap-x-3">
									<div className="size-8 rounded-full bg-primary-5/50 flex items-center justify-center">
										<link.icon className="size-4 text-primary-1" />
									</div>

									<p className="group-hover:underline">{link.label}</p>
								</div>

								<ChevronRightIcon className="size-5" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Profile;
