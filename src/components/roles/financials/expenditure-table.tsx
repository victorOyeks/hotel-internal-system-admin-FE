"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import type { Expenditure } from "@/lib/financials-actions";
import { DataTablePagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { CreateExpenditureModal } from "./create-expenditure-modal";

const columnHelper = createColumnHelper<Expenditure>();

export const columns = [
    columnHelper.accessor("date", {
        header: "Date",
        cell: (info) => {
            const date = new Date(info.getValue());
            return date.toLocaleDateString();
        },
    }),
    columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => <div className="font-medium">{info.getValue()}</div>,
    }),
    columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("vendor", {
        header: "Vendor",
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => {
            const amount = parseFloat(info.getValue() as unknown as string);
            return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
        },
    }),
    columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
            const status = info.getValue() as string;
            let variant: "default" | "secondary" | "destructive" | "outline" = "default";

            if (status === "PENDING") variant = "secondary";
            else if (status === "REJECTED") variant = "destructive";
            else if (status === "APPROVED") variant = "default";
            else if (status === "PAID") variant = "outline";

            return <Badge variant={variant}>{status}</Badge>;
        },
    }),
    columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
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
                            onClick={() => navigator.clipboard.writeText(row.original.id)}
                        >
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {row.original.status === 'PENDING' && (
                            <>
                                <DropdownMenuItem>Approve</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                            </>
                        )}
                        {row.original.status === 'APPROVED' && (
                            <DropdownMenuItem className="text-green-600">Mark as Paid</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    }),
];


export function ExpenditureTable({ data }: { data: Expenditure[] }) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Expenditures</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Record Expenditure
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={columns.length}>
                                <DataTablePagination table={table} />
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
            <CreateExpenditureModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
        </div>
    );
}
