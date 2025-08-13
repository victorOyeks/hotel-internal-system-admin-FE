"use client";

import * as sidebar from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: ReactNode;
    isActive?: boolean;
  }[];
}) {
  const pathname = usePathname();

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <sidebar.SidebarGroup>
      <sidebar.SidebarMenu>
        {items.map((item) => (
          <sidebar.SidebarMenuItem key={item.title}>
            <sidebar.SidebarMenuButton
              tooltip={item.title}
              className="py-3 gap-x-3 text-base rounded-2xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              asChild
              isActive={isActive(item.url)}
            >
              <Link href={item.url}>
                {item.icon}
                {item.title}
              </Link>
            </sidebar.SidebarMenuButton>
          </sidebar.SidebarMenuItem>
        ))}
      </sidebar.SidebarMenu>
    </sidebar.SidebarGroup>
  );
}
