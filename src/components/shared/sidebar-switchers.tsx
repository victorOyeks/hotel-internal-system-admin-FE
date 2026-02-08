"use client";

import { CheckIcon, ChevronsUpDown, HotelIcon } from "lucide-react";
import type { HotelRole } from "@/lib/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { roleIcons, roleLabels } from "@/lib/role-utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { selectRole } from "@/app/select-role/actions";
import { switchManagerCurrentHotel } from "@/lib/manager-actions";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarSwitchersProps {
    role: HotelRole;
    availableRoles: HotelRole[];
    hotels?: Array<{ id: string; name: string }>;
    activeHotel?: { id: string; name: string };
}

export function SidebarSwitchers({
    role,
    availableRoles,
    hotels,
    activeHotel,
}: SidebarSwitchersProps) {
    const { mutateAsync: switchHotel } = useMutation({
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
        },
    });

    const { mutateAsync: switchRole } = useMutation({
        mutationKey: ["set-active-role"],
        mutationFn: selectRole,
        onError: (error) => {
            if (error.message === "NEXT_REDIRECT") {
                return;
            }
            toast.error("Failed to switch role.", {
                description:
                    error instanceof Error ? error.message : "Please try again later.",
            });
        },
        onSuccess: () => {
            toast.success("Switched role successfully.");
        },
    });

    const showHotelSection = role === "MANAGER" && hotels && hotels.length > 0;
    const showRoleSection = availableRoles.length > 1;

    // If nothing to show, return null
    if (!showHotelSection && !showRoleSection) {
        return null;
    }

    const ActiveRoleIcon = roleIcons[role];

    // Determine what to show in the trigger
    const primaryText = showHotelSection && activeHotel ? activeHotel.name : roleLabels[role];
    const secondaryText = showHotelSection && activeHotel ? roleLabels[role] : undefined;
    const TriggerIcon = showHotelSection ? HotelIcon : ActiveRoleIcon;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            {TriggerIcon && <TriggerIcon className="size-4" />}
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{primaryText}</span>
                                {secondaryText && (
                                    <span className="truncate text-xs text-muted-foreground">
                                        {secondaryText}
                                    </span>
                                )}
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
                        {showHotelSection && (
                            <>
                                <DropdownMenuLabel className="text-muted-foreground text-xs">
                                    Switch Hotel
                                </DropdownMenuLabel>
                                <ScrollArea className="max-h-60 w-full">
                                    {hotels?.map((hotel) => (
                                        <DropdownMenuItem
                                            key={hotel.id}
                                            onClick={() => {
                                                toast.promise(switchHotel(hotel.id), {
                                                    loading: "Switching hotel...",
                                                });
                                            }}
                                            className="gap-2 p-2"
                                        >
                                            <div className="flex size-4.5 items-center justify-center rounded-md border">
                                                <HotelIcon className="size-2 shrink-0" />
                                            </div>
                                            <div className="font-medium text-sm text-muted-foreground">
                                                {hotel.name}
                                            </div>
                                            {hotel.id === activeHotel?.id && (
                                                <CheckIcon className="ml-auto" />
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </ScrollArea>
                                {showRoleSection && <DropdownMenuSeparator />}
                            </>
                        )}

                        {showRoleSection && (
                            <>
                                <DropdownMenuLabel className="text-muted-foreground text-xs">
                                    Switch Role
                                </DropdownMenuLabel>
                                {availableRoles.map((r) => {
                                    const RoleIcon = roleIcons[r];
                                    return (
                                        <DropdownMenuItem
                                            key={r}
                                            onClick={() => {
                                                toast.promise(switchRole(r), {
                                                    loading: "Switching role...",
                                                });
                                            }}
                                            className="gap-2 p-2"
                                        >
                                            <div className="flex size-4.5 items-center justify-center rounded-md border">
                                                {RoleIcon && <RoleIcon className="size-2 shrink-0" />}
                                            </div>
                                            <div className="font-medium text-sm text-muted-foreground">
                                                {roleLabels[r]}
                                            </div>
                                            {r === role && <CheckIcon className="ml-auto" />}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
