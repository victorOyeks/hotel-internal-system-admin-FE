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
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
// import { Input } from "../ui/input";
import { Button } from "@/components/ui/button";
import { links as hotelOwnerLinks } from "../roles/hotel-owner/links";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

function ProfilePopover({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
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

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <XIcon />
          </Button>
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
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
          <Breadcrumb className="mx-auto w-fit">
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

          <h1 className="text-xl font-medium hidden md:block">
            {resolveBreadcrumb || "Dashboard"}
          </h1>
        </div>
      </div>

      <div>
        <div className="bg-white shadow rounded-full p-1 flex items-center space-x-2">
          <div className="bg-gray-100 py-2 px-3 rounded-full text-sm">
            {formatDate(new Date(), "PPP")}
          </div>

          {resolveBreadcrumb === null ? (
            <div className="bg-primary-5/15 py-2 px-3 rounded-full text-sm relative max-w-40">
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
          ) : null}

          <Button size={"icon"} variant={"ghost"} className="rounded-full">
            <BellIcon size={20} className="text-primary-1" />
          </Button>

          <ProfilePopover
            onOpenChange={(value) => setIsOpen(value)}
            open={isOpen}
          />
        </div>
      </div>
    </header>
  );
}
