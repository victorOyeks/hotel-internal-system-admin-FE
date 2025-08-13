"use client";

import { formatDate } from "date-fns";
import {
	BellIcon,
	FileIcon,
	ImageIcon,
	Link2,
	SearchIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
// import { Separator } from "@/components/ui/separator";
import { Fragment, useState } from "react";
// import { Input } from "../ui/input";
import { Button } from "@/components/ui/button";
import { breadcrumbAtom } from "@/lib/store";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbSeparator,
	BreadcrumbLink,
	BreadcrumbPage,
} from "../ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import { PopoverClose } from "@radix-ui/react-popover";

function ProfilePopover() {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="icon" variant="ghost" className="rounded-full p-2">
					<Avatar>
						<AvatarFallback className="bg-primary-1 text-white">
							<span className="text-xs">A</span>
						</AvatarFallback>
						<AvatarImage
							src="https://i.pravatar.cc/150?img=3"
							alt="User Avatar"
						/>
					</Avatar>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				sideOffset={16}
				className="rounded-4xl bg-white border border-popover w-xs space-y-2 py-2 px-3"
			>
				<div className="flex items-center justify-between">
					<p className="font-medium text-lg">Profile</p>

					<PopoverClose asChild>
						<Button variant="ghost" size="icon" className="rounded-full">
							<XIcon />
						</Button>
					</PopoverClose>
				</div>

				<div className="max-w-[content] mx-auto flex flex-col items-center justify-center space-y-3">
					<Avatar className="size-21 rounded-full">
						<AvatarFallback className="bg-primary-1 text-white">
							<span className="text-2xl">A</span>
						</AvatarFallback>
						<AvatarImage
							src="https://i.pravatar.cc/150?img=3"
							alt="User Avatar"
						/>
					</Avatar>

					<div className="text-center space-y-0.5">
						<p className="text-2xl font-medium leading-tight">John Doe</p>
						<p className="text-sm text-gray-600">johndoe@example.com</p>
					</div>
				</div>

				<div className="space-y-2 [&_svg]:text-gray-400">
					<Button
						variant={"ghost"}
						className="w-full rounded-full bg-background-blue justify-baseline font-medium"
					>
						<ImageIcon />
						<span>Media</span>
					</Button>
					<Button
						variant={"ghost"}
						className="w-full rounded-full bg-background-blue justify-baseline font-medium"
					>
						<FileIcon />
						<span>Files</span>
					</Button>
					<Button
						variant={"ghost"}
						className="w-full rounded-full bg-background-blue justify-baseline font-medium"
					>
						<Link2 />
						<span>Links</span>
					</Button>

					<Button
						variant={"destructive"}
						className="w-full rounded-full justify-baseline font-medium [&_svg]:text-primary-3"
					>
						<Trash2Icon />
						<span>Clear chats</span>
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export function Header() {
	const breadcrumb = useAtomValue(breadcrumbAtom);

	return (
		<header className="flex shrink-0 items-center justify-between py-2 px-2">
			<div className="flex items-center space-x-1 md:space-x-2">
				<SidebarTrigger className="-ml-1 md:hidden" />
				<Separator
					orientation="vertical"
					className="md:hidden data-[orientation=vertical]:h-4"
				/>
				<div className="md:self-baseline-last">
					{breadcrumb ? (
						<>
							<Breadcrumb className="mx-auto w-fit hidden md:flex">
								<BreadcrumbList>
									{breadcrumb.breadcrumbs.map((b, i) => (
										<Fragment key={b.label}>
											{i < breadcrumb.breadcrumbs.length - 1 ? (
												<>
													<BreadcrumbItem>
														<BreadcrumbLink asChild>
															<Link href={b.href}>{b.label}</Link>
														</BreadcrumbLink>
													</BreadcrumbItem>
													<BreadcrumbSeparator />
												</>
											) : (
												<BreadcrumbPage>{b.label}</BreadcrumbPage>
											)}
										</Fragment>
									))}
								</BreadcrumbList>
							</Breadcrumb>

							<h1 className="text-xl font-medium block">{breadcrumb.title}</h1>
						</>
					) : (
						<Skeleton className="bg-primary-5/20 w-[200px] p-6" />
					)}
				</div>
			</div>

			<div>
				<div className="bg-white shadow rounded-full p-1 flex items-center space-x-2">
					<div className="bg-gray-100 py-2 px-3 rounded-full text-sm hidden md:block">
						{formatDate(new Date(), "PPP")}
					</div>

					<div className="bg-primary-5/15 py-2 px-3 rounded-full text-sm relative max-w-40 hidden lg:block">
						<SearchIcon
							size={16}
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-1"
						/>
						<input
							className="pl-5 appearance-none bg-transparent focus:outline-none"
							placeholder="Search"
							type="text"
						/>
					</div>

					<Button size={"icon"} variant={"ghost"} className="rounded-full">
						<BellIcon size={20} className="text-primary-1" />
					</Button>

					<ProfilePopover />
				</div>
			</div>
		</header>
	);
}
