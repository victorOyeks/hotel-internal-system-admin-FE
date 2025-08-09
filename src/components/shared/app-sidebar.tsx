import Link from "next/link";
import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { links as hotelOwnerLinks } from "../roles/hotel-owner/links";
import { HomeIcon } from "../svgs/home";
import { NavMain } from "./nav-main";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" className="p-4" asChild>
							<Link href="/">
								<div className="flex items-center justify-center gap-x-2">
									<div className="size-8 flex items-center justify-center group-data-[state=collapsed]:p-1">
										<HomeIcon />
									</div>
									<span className="font-bold text-xl self-baseline-last">
										H.M.S
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={hotelOwnerLinks} />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
