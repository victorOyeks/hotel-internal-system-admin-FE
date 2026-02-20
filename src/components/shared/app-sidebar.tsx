"use client";

import Link from "next/link";
import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import {
	frontDeskLinks,
	hotelOwnerLinks,
	inventoryOfficerLinks,
	managerOwnerLinks,
	restaurantLinks,
	rentalsLinks,
	laundryLinks,
	financialsLinks,
} from "../links";
import { HomeIcon } from "../svgs/home";
import { NavMain } from "./nav-main";
import type { HotelRole } from "@/lib/types";
import { SidebarSwitchers } from "./sidebar-switchers";

export function AppSidebar({
	role,
	hotels,
	activeHotel,
	availableRoles,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	role: HotelRole;
	availableRoles: HotelRole[];
	activeHotel?: { id: string; name: string };
	hotels?: {
		id: string;
		name: string;
	}[];
}) {

	const links: Record<
		HotelRole,
		React.ComponentProps<typeof NavMain>["items"]
	> = {
		HOTEL_OWNER: hotelOwnerLinks,
		FRONT_DESK: frontDeskLinks,
		MARKETER: [],
		INVENTORY: inventoryOfficerLinks,
		RESTAURANT: restaurantLinks,
		RENTALS: rentalsLinks,
		MANAGER: managerOwnerLinks,
		SUPER_ADMIN: [],
		LAUNDRY: laundryLinks,
		FINANCIALS: financialsLinks,
	};

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
			<SidebarContent className="scrollbar-hidden">
				<NavMain items={links[role]} />
			</SidebarContent>
			<SidebarFooter>
				<SidebarSwitchers
					role={role}
					availableRoles={availableRoles}
					hotels={hotels}
					activeHotel={activeHotel}
				/>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
