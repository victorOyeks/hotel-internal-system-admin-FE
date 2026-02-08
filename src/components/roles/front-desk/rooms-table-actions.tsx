"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { GuestDetailsContent } from "./guest-details-content";
import type { RoomDetails } from "@/lib/fetch";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface RoomsTableActionsProps {
    row: RoomDetails;
}

export function RoomsTableActions({ row }: RoomsTableActionsProps) {
    const [showGuestDetails, setShowGuestDetails] = useState(false);

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={"icon"}>
                    <span className="sr-only">Open menu</span>
                    <MoreVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(row.customId)}
                >
                    Copy Room ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Dialog open={showGuestDetails} onOpenChange={setShowGuestDetails}>
                    <DialogTrigger asChild>
                        <DropdownMenuItem
                            disabled={!row.guestDetails}
                            onSelect={(e) => e.preventDefault()}
                        >
                            View Guest Details
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <GuestDetailsContent
                        guestDetails={row.guestDetails}
                        roomIdentifier={row.roomIdentifier}
                    />
                </Dialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
