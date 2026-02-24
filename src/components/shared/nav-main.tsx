"use client";

import * as sidebar from "@/components/ui/sidebar";
import { createPathMatcher } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import { totalUnreadCountAtom } from "@/lib/chat-store";

function IconLoader({ children }: { children: ReactNode }) {
	const { pending } = useLinkStatus();

	useEffect(() => {
		let toastId: string | number;
		if (pending) {
			toastId = toast.loading("Loading, please wait...", {
				position: "top-center",
			});
		}

		return () => {
			if (pending) {
				toast.dismiss(toastId);
			}
		};
	}, [pending]);

	return pending ? <Loader2Icon className="animate-spin" /> : children;
}

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: ReactNode;
		isActive?: boolean;
	}[];
}) {
	const pathname = usePathname();
	const totalUnread = useAtomValue(totalUnreadCountAtom);
	const pathMatcher = useMemo(
		() => createPathMatcher(items.map((item) => item.url)),
		[items],
	);

	return (
		<sidebar.SidebarGroup>
			<sidebar.SidebarMenu className="gap-y-2">
				{items.map((item) => (
					<sidebar.SidebarMenuItem key={item.title}>
						<sidebar.SidebarMenuButton
							tooltip={item.title}
							className="py-3 gap-x-2 text-base rounded-md data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							asChild
							isActive={pathMatcher.match(pathname)?.path === item.url}
						>
							<Link href={item.url}>
								<IconLoader>{item.icon}</IconLoader>
								{item.title}
							</Link>
						</sidebar.SidebarMenuButton>
						{item.title === "Messages" && totalUnread > 0 && (
							<sidebar.SidebarMenuBadge className="bg-white/90 text-primary-1 text-[11px] font-semibold h-5 min-w-5 rounded-full shadow-sm">
								{totalUnread > 99 ? "99+" : totalUnread}
							</sidebar.SidebarMenuBadge>
						)}
					</sidebar.SidebarMenuItem>
				))}
			</sidebar.SidebarMenu>
		</sidebar.SidebarGroup>
	);
}
