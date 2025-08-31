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
import type { HotelRole } from "@/lib/types";

export function AppSidebar({ role, ...props }: React.ComponentProps<typeof Sidebar> & {
	role: HotelRole
}) {

	const links: Record<HotelRole, React.ComponentProps<typeof NavMain>['items']> = {
		HOTEL_OWNER: hotelOwnerLinks,
		BAR: [],
		FRONT_DESK: [],
		MAINTENANCE: [],
		INVENTORY: [],
		KITCHEN: [],
		MANAGER: [],
		SUPER_ADMIN: []
	}

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
				<NavMain items={links[role]} />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
