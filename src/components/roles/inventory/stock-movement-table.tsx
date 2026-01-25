"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StockMovementResponse } from "@/lib/fetch";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";

export const columns: ColumnDef<StockMovementResponse>[] = [
    {
        accessorKey: "movementNumber",
        header: "Movement #",
    },
    {
        accessorKey: "movementType",
        header: "Type",
        cell: ({ row }) => {
            return <Badge variant="outline">{row.original.movementType}</Badge>
        }
    },
    {
        accessorKey: "productName",
        header: "Product",
    },
    {
        accessorKey: "locationName",
        header: "Location",
    },
    {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
            const quantity = row.original.quantity;
            return <span className={quantity < 0 ? "text-red-500" : "text-green-500"}>{quantity}</span>
        }
    },
    {
        accessorKey: "movementDate",
        header: "Date",
        cell: ({ row }) => {
            return format(new Date(row.original.movementDate), "PPP");
        }
    },
    {
        accessorKey: "performedBy",
        header: "Performed By",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const payment = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(payment.id)}
                        >
                            Copy ID
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
