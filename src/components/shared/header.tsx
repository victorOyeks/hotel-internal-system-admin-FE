"use client";

import React, { useMemo } from "react";
import { formatDate } from "date-fns";
import { BellIcon, SearchIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "../ui/breadcrumb";
import { SidebarTrigger } from "../ui/sidebar";
import { usePathname } from "next/navigation";
import { links as hotelOwnerLinks } from "../roles/hotel-owner/links";

export function Header() {
  const pathname = usePathname();

  const resolveBreadcrumb = useMemo(() => {
    const title = hotelOwnerLinks.find((link) => link.url === pathname)?.title;
    return title === "Dashboard" ? null : title;
  }, [pathname]);

  return (
    <header className="flex shrink-0 items-center justify-between py-2 px-2">
      <div className="flex items-center space-x-2">
        {/* <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 rotate-20"
        /> */}
        <div className="self-baseline-last">
          <Breadcrumb className="text-xs">
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/home">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              {resolveBreadcrumb && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{resolveBreadcrumb}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-lg font-semibold hidden md:block">
            {resolveBreadcrumb || "Dashboard"}
          </h1>
        </div>
      </div>

      <div>
        <div className="bg-white shadow-xl rounded-full p-2 flex items-center space-x-2">
          <div className="bg-gray-100 py-2 px-3 rounded-full text-sm">
            {formatDate(new Date(), "PPP")}
          </div>

          {/* <div className="bg-primary-5/15 py-2 px-3 rounded-full text-sm relative max-w-40">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-1"
            />
            <input
              className="pl-5 appearance-none bg-transparent focus:outline-none"
              placeholder="Search"
              type="text"
            />
          </div> */}

          <Button size={"icon"} variant={"ghost"} className="rounded-full">
            <BellIcon size={20} className="text-primary-1" />
          </Button>

          <Avatar>
            <AvatarFallback className="bg-primary-1 text-white">
              <span className="text-xs">A</span>
            </AvatarFallback>
            <AvatarImage
              src="https://i.pravatar.cc/150?img=3"
              alt="User Avatar"
            />
          </Avatar>
        </div>
      </div>
    </header>
  );
}
