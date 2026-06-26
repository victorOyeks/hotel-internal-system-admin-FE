"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    createColumnHelper,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import type { Expenditure } from "@/lib/api-routes/financials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, AlertTriangleIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateExpenditureStatus } from "@/lib/financials-actions";

const columnHelper = createColumnHelper<Expenditure>();

function daysOverdue(dueDate: string | null | undefined): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    return Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

export function OverdueExpendituresList({ items }: { items: Expenditure[] }) {
    const totalOverdue = items.reduce((sum, item) => sum + item.amount, 0);
    const queryClient = useQueryClient();
    const router = useRouter();

    const markAsPaidMutation = useMutation({
        mutationFn: (id: string) => updateExpenditureStatus(id, "PAID"),
        onSuccess: () => {
            toast.success("Expenditure marked as paid");
            queryClient.invalidateQueries({ queryKey: ["financials"] });
            queryClient.invalidateQueries({ queryKey: ["expenditures"] });
            router.refresh();
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to mark as paid");
        },
    });

    const columns = useMemo(
        () => [
            columnHelper.accessor("dueDate", {
                header: "Due Date",
                cell: (info) => {
                    const val = info.getValue();
                    if (!val) return "-";
                    return new Date(val).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                    });
                },
            }),
            columnHelper.display({
                id: "daysOverdue",
                header: "Days Overdue",
                cell: ({ row }) => {
                    const days = daysOverdue(row.original.dueDate);
                    return (
                        <Badge variant={days > 30 ? "destructive" : "secondary"}>
                            {days}d
                        </Badge>
                    );
                },
            }),
            columnHelper.accessor("title", {
                header: "Title",
                cell: (info) => <div className="font-medium">{info.getValue() ?? "-"}</div>,
            }),
            columnHelper.accessor("vendorName", {
                header: "Vendor",
                cell: (info) => info.getValue() ?? "-",
            }),
            columnHelper.accessor("category", {
                header: "Category",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("invoiceNumber", {
                header: "Invoice #",
                cell: (info) => info.getValue() ?? "-",
            }),
            columnHelper.accessor("amount", {
                header: "Amount",
                cell: (info) => {
                    const amount = parseFloat(info.getValue() as unknown as string);
                    return <div className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(amount)}</div>;
                },
            }),
            columnHelper.display({
                id: "actions",
                cell: ({ row }) => (
                    <DropdownMenu modal={false}>
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
                            <DropdownMenuItem
                                className="text-green-600"
                                disabled={markAsPaidMutation.isPending}
                                onClick={() => markAsPaidMutation.mutate(row.original.id)}
                            >
                                {markAsPaidMutation.isPending ? "Saving..." : "Mark as Paid"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            }),
        ],
        [markAsPaidMutation],
    );

    const table = useReactTable({
        data: items,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                    <span>
                        <span className="font-medium text-foreground">{items.length}</span> overdue items totaling{" "}
                        <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(totalOverdue)}</span>
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="border border-primary-5/20 rounded-xl overflow-clip">
                <Table>
                    <TableHeader className="bg-gray-100">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-gray-500">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="text-gray-600">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    No overdue expenditures.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
