"use client";

import { CheckIcon, ChevronsUpDown } from "lucide-react";

import { selectRole } from "@/app/select-role/actions";
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
import { roleIcons, roleLabels } from "@/lib/role-utils";
import type { HotelRole } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function RoleSwitcher({
    activeRole,
    availableRoles,
}: {
    activeRole: HotelRole;
    availableRoles: HotelRole[];
}) {
    const { mutateAsync } = useMutation({
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

    if (availableRoles.length <= 1) {
        return null;
    }

    const ActiveRoleIcon = roleIcons[activeRole];

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            {ActiveRoleIcon && <ActiveRoleIcon className="size-4" />}
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{roleLabels[activeRole]}</span>
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
                            Available Roles
                        </DropdownMenuLabel>
                        {availableRoles.map((role) => {
                            const RoleIcon = roleIcons[role];
                            return (
                                <DropdownMenuItem
                                    key={role}
                                    onClick={() => {
                                        toast.promise(mutateAsync(role), {
                                            loading: "Switching role...",
                                        });
                                    }}
                                    className="gap-2 p-2"
                                >
                                    <div className="flex size-4.5 items-center justify-center rounded-md border">
                                        {RoleIcon && <RoleIcon className="size-2 shrink-0" />}
                                    </div>
                                    <div className="font-medium text-sm text-muted-foreground">
                                        {roleLabels[role]}
                                    </div>
                                    {role === activeRole && <CheckIcon className="ml-auto" />}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
