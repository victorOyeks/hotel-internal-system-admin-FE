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
} from "@hospio/ui/primitives/sidebar";
import { HomeIcon } from "../svgs/home";
import { NavMain } from "./nav-main";
import { BranchSwitcher } from "./branch-switcher";
import type { HotelRole } from "@hospio/api/roles";
import type { Hotel } from "@hospio/api/api/schema";

export function AppSidebar({
	role,
	hotels,
	activeHotel,
	badges,
	supervisor,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	role: HotelRole;
	hotels: Hotel[];
	activeHotel: Hotel | null;
	badges?: React.ComponentProps<typeof NavMain>["badges"];
	supervisor?: boolean;
}) {
	return (
		<Sidebar {...props} className="border-r-0 bg-nav text-white [&_[data-sidebar=sidebar]]:bg-nav">
			<SidebarHeader className="gap-2 px-4 pt-8">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild className="h-[46px] rounded-lg px-2 hover:bg-white/10 hover:text-white">
							<Link href="/dashboard" className="flex items-center gap-[10px]">
								<span className="flex size-7 items-center justify-center text-white">
									<HomeIcon />
								</span>
								<span className="text-sm font-bold tracking-[-0.01em] text-white group-data-[collapsible=icon]:hidden">
									Hospio360
								</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				<div className="mx-2 h-px bg-white/10 group-data-[collapsible=icon]:hidden" />
				<div className="pt-2">
					<BranchSwitcher hotels={hotels} active={activeHotel} />
				</div>
			</SidebarHeader>
			<SidebarContent className="scrollbar-hidden px-4">
				<NavMain role={role} badges={badges} supervisor={supervisor} />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
