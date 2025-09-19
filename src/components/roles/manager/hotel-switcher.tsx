"use client";
import { CheckIcon, ChevronsUpDown, HotelIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useMutation } from "@tanstack/react-query";
import { switchManagerCurrentHotel } from "@/lib/manager-actions";
import { toast } from "sonner";

export function HotelSwitcher({
  hotels,
  activeHotel = hotels[0],
}: {
  hotels: Array<{ id: string; name: string }>;
  activeHotel?: { id: string; name: string };
}) {
  const { mutateAsync } = useMutation({
    mutationKey: ["set-active-hotel"],
    mutationFn: switchManagerCurrentHotel,
    onError: (error) => {
      toast.error("Failed to switch hotel.", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    },
    onSuccess: () => {
      toast.success("Switched hotel successfully.");
      window.location.reload();
    },
  });

  if (!activeHotel) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <HotelIcon className="size-4" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeHotel.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="top"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Hotels you manage
            </DropdownMenuLabel>
            {hotels.map((hotel) => (
              <DropdownMenuItem
                key={hotel.id}
                onClick={() => {
                  toast.promise(mutateAsync(hotel.id), {
                    loading: "Switching hotel...",
                  });
                }}
                className="gap-1 p-1"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <HotelIcon className="size-3.5 shrink-0" />
                </div>
                {hotel.name}
                {hotel.id === activeHotel.id && (
                  <CheckIcon className="ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
