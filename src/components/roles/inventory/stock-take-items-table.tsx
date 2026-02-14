"use client";

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    type SortingState,
    getSortedRowModel,
    createColumnHelper,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { useState } from "react";
import type { StockTakeLineItem } from "@/lib/fetch";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/shared/pagination";

interface StockTakeItemsTableProps {
    data: StockTakeLineItem[];
    isEditing: boolean;
    onRecordCount: (itemId: string, quantity: number) => void;
}

const columnHelper = createColumnHelper<StockTakeLineItem>();

export function StockTakeItemsTable({
    data,
    isEditing,
    onRecordCount,
}: StockTakeItemsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const columns = [
        columnHelper.accessor("productName", {
            header: "Product",
            cell: (info) => (
                <div>
                    <p className="font-medium">{info.getValue()}</p>
                    <p className="text-xs text-muted-foreground">
                        {info.row.original.productSku}
                    </p>
                </div>
            ),
        }),
        columnHelper.accessor("systemQuantity", {
            header: () => <div className="text-right">System Qty</div>,
            cell: (info) => <div className="text-right">{info.getValue()}</div>,
        }),
        columnHelper.accessor("actualQuantity", {
            header: () => <div className="text-right">Actual Qty</div>,
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div className="flex justify-end">
                        {isEditing ? (
                            <Input
                                type="number"
                                defaultValue={item.actualQuantity ?? ""}
                                className="w-20 text-right h-8"
                                onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!Number.isNaN(val)) {
                                        onRecordCount(item.id, val);
                                    }
                                }}
                            />
                        ) : (
                            <span>{item.actualQuantity ?? "-"}</span>
                        )}
                    </div>
                );
            },
        }),
        columnHelper.accessor("varianceQuantity", {
            header: () => <div className="text-right">Variance</div>,
            cell: (info) => {
                const val = info.getValue();
                if (val === 0) return <div className="text-right">-</div>;
                return (
                    <div
                        className={`text-right ${val < 0
                            ? "text-red-600"
                            : val > 0
                                ? "text-orange-600"
                                : ""
                            }`}
                    >
                        {val > 0 ? "+" : ""}
                        {val}
                    </div>
                );
            },
        }),
        columnHelper.accessor("varianceValue", {
            header: () => <div className="text-right">Value</div>,
            cell: (info) => (
                <div className="text-right">{formatCurrency(info.getValue())}</div>
            ),
        }),
        columnHelper.display({
            id: "status",
            header: "Status",
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div className="flex gap-2">
                        {item.counted ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                Counted
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-gray-500">
                                Pending
                            </Badge>
                        )}
                        {item.requiresInvestigation && (
                            <Badge
                                variant="outline"
                                className="text-red-600 border-red-200 bg-red-50"
                            >
                                Investigate
                            </Badge>
                        )}
                    </div>
                );
            },
        }),
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onPaginationChange: setPagination,
        state: {
            sorting,
            pagination,
        },
    });

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-background">
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
                                                    header.getContext(),
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
                                                cell.getContext(),
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
                                    No items found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    );
}
