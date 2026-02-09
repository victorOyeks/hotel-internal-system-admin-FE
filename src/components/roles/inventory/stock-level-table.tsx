"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { StockLevelResponse, Pagination } from "@/lib/fetch";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type Table as TableType,
} from "@tanstack/react-table";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const stockLevelColumnHelper = createColumnHelper<StockLevelResponse>();

const stockLevelColumns = [
    stockLevelColumnHelper.accessor("productSku", {
        header: "SKU",
        cell: (info) => <span>{info.getValue()}</span>,
    }),
    stockLevelColumnHelper.accessor("productName", {
        header: "Product",
        cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
    }),
    stockLevelColumnHelper.accessor("productCategory", {
        header: "Category",
        cell: (info) => (
            <span className="capitalize text-muted-foreground">
                {info.getValue()?.replace(/_/g, " ").toLowerCase() || "N/A"}
            </span>
        ),
    }),
    stockLevelColumnHelper.accessor("locationName", {
        header: "Location",
        cell: (info) => <span>{info.getValue()}</span>,
    }),
    stockLevelColumnHelper.accessor("quantityOnHand", {
        header: "On Hand",
        cell: (info) => <span>{info.getValue()}</span>,
    }),
    stockLevelColumnHelper.accessor("quantityAvailable", {
        header: "Available",
        cell: (info) => <span className="font-semibold text-foreground">{info.getValue()}</span>,
    }),
    stockLevelColumnHelper.accessor("quantityReserved", {
        header: "Reserved",
        cell: (info) => <span>{info.getValue()}</span>,
    }),
    stockLevelColumnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => {
            const { isOutOfStock, isBelowMinLevel, isBelowReorderLevel } = row.original;
            if (isOutOfStock) {
                return <Badge variant="destructive">Out of Stock</Badge>;
            }
            if (isBelowMinLevel || isBelowReorderLevel) {
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Low Stock</Badge>;
            }
            return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">In Stock</Badge>;
        },
    }),
    stockLevelColumnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const item = row.original;
            return (
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>{item.productName}</SheetTitle>
                            <SheetDescription>
                                Stock Level Details
                            </SheetDescription>
                        </SheetHeader>
                        <div className="px-4 py-4 space-y-6">
                            {/* Location & Product */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    Product Info
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">SKU</span>
                                        <span className="font-medium">{item.productSku}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Category</span>
                                        <span className="capitalize">{item.productCategory?.replace(/_/g, " ").toLowerCase()}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Location</span>
                                        <span className="font-medium">{item.locationName}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Location Code</span>
                                        <span>{item.locationCode}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quantities */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    Stock Quantities
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-gray-50 p-2 rounded">
                                        <span className="text-muted-foreground block">On Hand</span>
                                        <span className="font-medium text-lg">{item.quantityOnHand}</span>
                                    </div>
                                    <div className="bg-green-50 p-2 rounded">
                                        <span className="text-green-700 block">Available</span>
                                        <span className="font-medium text-lg text-green-900">{item.quantityAvailable}</span>
                                    </div>
                                    <div className="bg-yellow-50 p-2 rounded">
                                        <span className="text-yellow-700 block">Reserved</span>
                                        <span className="font-medium text-lg text-yellow-900">{item.quantityReserved}</span>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded">
                                        <span className="text-blue-700 block">Allocated</span>
                                        <span className="font-medium text-lg text-blue-900">{item.quantityAllocated}</span>
                                    </div>
                                    <div className="bg-purple-50 p-2 rounded">
                                        <span className="text-purple-700 block">In Transit</span>
                                        <span className="font-medium text-lg text-purple-900">{item.quantityInTransit}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Financials */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    Valuation
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">Average Cost</span>
                                        <span className="font-medium">
                                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.averageCost)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Total Value</span>
                                        <span className="font-medium">
                                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.totalValue)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Last Purchase Cost</span>
                                        <span className="font-medium">
                                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.lastPurchaseCost)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    Last Updates
                                </h4>
                                <div className="space-y-2 text-sm">
                                    {item.lastStockInDate && (
                                        <div>
                                            <span className="text-muted-foreground">Last Stock In: </span>
                                            <span>{new Date(item.lastStockInDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {item.lastStockOutDate && (
                                        <div>
                                            <span className="text-muted-foreground">Last Stock Out: </span>
                                            <span>{new Date(item.lastStockOutDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {item.lastStockCountDate && (
                                        <div>
                                            <span className="text-muted-foreground">Last Stock Count: </span>
                                            <span>{new Date(item.lastStockCountDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            );
        },
    }),
];

function StockLevelTableView({
    table,
}: {
    table: TableType<StockLevelResponse>;
}) {
    return (
        <div className="overflow-hidden rounded-md border bg-card">
            <Table>
                <TableHeader className="bg-gray-100">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} className="text-gray-500">
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
                            <TableRow key={row.id} className="hover:bg-gray-50">
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="text-gray-600">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={stockLevelColumns.length}
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>

                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={stockLevelColumns.length}>
                            <div className="w-full flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                                    {table.getPageCount()}
                                </span>
                                <DataTablePagination table={table} />
                            </div>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}

export function StockLevelTable({
    data,
    paginationMeta,
}: {
    data: StockLevelResponse[];
    paginationMeta: Pagination;
}) {
    const [pagination, onPaginationChange] = usePaginationSearchParams();
    const table = useReactTable({
        data,
        columns: stockLevelColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
        pageCount: paginationMeta.totalPages,
        state: {
            pagination,
        },
        onPaginationChange,
    });

    return <StockLevelTableView table={table} />;
}
