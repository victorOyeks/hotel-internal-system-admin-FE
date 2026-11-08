"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import * as sidebar from "@hospio/ui/primitives/sidebar";
import { linksByRole, type NavLink } from "@hospio/ui/links";
import type { HotelRole } from "@hospio/api/roles";
import { cn } from "@hospio/ui/utils";

function LinkIcon({ icon: Icon }: { icon: NavLink["icon"] }) {
	const { pending } = useLinkStatus();
	return pending ? <Loader2Icon className="size-[18px] animate-spin" /> : <Icon className="size-[18px]" />;
}

/** Which link owns the current path: the longest matching prefix. */
function activeUrl(pathname: string, items: NavLink[]) {
	return items
		.filter((i) => pathname === i.url || pathname.startsWith(`${i.url}/`))
		.sort((a, b) => b.url.length - a.url.length)[0]?.url;
}

export function NavMain({ role }: { role: HotelRole }) {
	const items = linksByRole[role];
	const pathname = usePathname();
	const active = activeUrl(pathname, items);

	return (
		<sidebar.SidebarGroup className="px-0 py-3">
			<sidebar.SidebarMenu className="gap-y-[10px]">
				{items.map((item) => {
					const isActive = active === item.url;
					return (
						<sidebar.SidebarMenuItem key={item.url}>
							<sidebar.SidebarMenuButton
								tooltip={item.title}
								asChild
								isActive={isActive}
								className={cn(
									"h-10 rounded-[14px] px-2 text-sm text-white transition-opacity",
									"hover:bg-white/10 hover:text-white",
									"data-[active=true]:bg-white/10 data-[active=true]:font-medium data-[active=true]:text-white",
									!isActive && "opacity-70 hover:opacity-100",
								)}
							>
								<Link href={item.url} className="flex w-full items-center gap-2">
									<LinkIcon icon={item.icon} />
									<span className="truncate">{item.title}</span>
								</Link>
							</sidebar.SidebarMenuButton>
						</sidebar.SidebarMenuItem>
					);
				})}
			</sidebar.SidebarMenu>
		</sidebar.SidebarGroup>
	);
}
