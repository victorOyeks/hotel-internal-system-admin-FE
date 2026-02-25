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
    type Table as TableType,
} from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import type {
    ItemConsumptionReport,
    ItemConsumptionDetail,
} from "@/lib/api-routes/financials";
import { DataTablePagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { DollarSignIcon, PackageIcon, ShoppingCartIcon, UtensilsIcon } from "lucide-react";

const columnHelper = createColumnHelper<ItemConsumptionDetail>();

const consumptionColumns = [
    columnHelper.accessor("itemName", {
        header: "Item Name",
        cell: (info) => (
            <span className="font-medium text-gray-700">
                {info.getValue() ?? "Unknown"}
            </span>
        ),
    }),
    columnHelper.accessor("itemType", {
        header: "Type",
        cell: (info) => {
            const type = info.getValue();
            if (!type) return <span className="text-gray-400">N/A</span>;
            return (
                <Badge variant={type === "FOOD" ? "green" : "blue"} className="capitalize">
                    {type.toLowerCase()}
                </Badge>
            );
        },
    }),
    columnHelper.accessor("totalQuantityConsumed", {
        header: "Qty",
        cell: (info) => <span>{info.getValue() ?? 0}</span>,
    }),
    columnHelper.accessor("numberOfOrders", {
        header: "Orders",
        cell: (info) => <span>{info.getValue() ?? 0}</span>,
    }),
    columnHelper.accessor("totalRevenue", {
        header: "Revenue",
        cell: (info) => (
            <div className="font-medium">
                {formatCurrency(info.getValue() ?? 0)}
            </div>
        ),
    }),
    columnHelper.accessor("averagePrice", {
        header: "Avg Price",
        cell: (info) => (
            <span>{formatCurrency(info.getValue() ?? 0)}</span>
        ),
    }),
];

function InnerTable({ table }: { table: TableType<ItemConsumptionDetail> }) {
    return (
        <div className="border border-primary-5/20 rounded-xl overflow-clip bg-card">
            <Table>
                <TableHeader className="bg-gray-100">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className="text-gray-500"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                </TableHead>
                            ))}
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
                                    <TableCell
                                        key={cell.id}
                                        className="text-gray-600"
                                    >
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
                                colSpan={consumptionColumns.length}
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>

                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={consumptionColumns.length}>
                            <div className="w-full flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    Page{" "}
                                    {table.getState().pagination.pageIndex + 1}{" "}
                                    of {table.getPageCount()}
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

interface ConsumptionReportProps {
    data: ItemConsumptionReport | null;
}

export function ConsumptionReport({ data }: ConsumptionReportProps) {
    const items = data?.items ?? [];
    const summary = data?.summary;
    const [pagination, onPaginationChange] = usePaginationSearchParams();

    const table = useReactTable({
        data: items,
        columns: consumptionColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
        pageCount: data?.totalPages ?? 1,
        onPaginationChange,
        state: {
            sorting: [],
            globalFilter: "",
            columnFilters: [],
            pagination,
        },
    });

    if (!items.length) {
        return (
            <div className="bg-white p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-gray-600">
                    Consumption Report
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                    No consumption data available for the selected period.
                </p>
            </div>
        );
    }

    const stats = [
        {
            title: "Total Items",
            icon: PackageIcon,
            value: `${summary?.totalUniqueItems ?? 0}`,
            subtitle: `${summary?.totalFoodItems ?? 0} food · ${summary?.totalDrinkItems ?? 0} drinks`,
        },
        {
            title: "Revenue",
            icon: DollarSignIcon,
            value: formatCurrency(summary?.totalRevenue ?? 0),
        },
        {
            title: "Orders",
            icon: ShoppingCartIcon,
            value: `${summary?.totalOrders ?? 0}`,
        },
        {
            title: "Qty Consumed",
            icon: UtensilsIcon,
            value: `${summary?.totalQuantityConsumed ?? 0}`,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {stats.map((stat) => (
                        <div
                            key={stat.title}
                            className="col-span-1 bg-white border border-primary-5/40 p-2 rounded-2xl md:rounded-3xl flex items-center space-x-2"
                        >
                            <div className="size-8 md:size-12 aspect-square bg-green-500/20 rounded-full flex items-center justify-center">
                                <stat.icon className="text-secondary size-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs md:text-sm text-gray-400">{stat.title}</p>
                                <p className="text-lg text-primary font-semibold font-inter tracking-[0.01em]">
                                    {stat.value}
                                </p>
                                {stat.subtitle && (
                                    <p className="text-xs text-gray-400">{stat.subtitle}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Items Table */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                        Item Consumption Details
                        {data?.totalItems != null && (
                            <span className="text-xs text-gray-400 ml-2">
                                ({data.totalItems} total)
                            </span>
                        )}
                    </p>
                </div>
                <InnerTable table={table} />
            </div>
        </div>
    );
}
