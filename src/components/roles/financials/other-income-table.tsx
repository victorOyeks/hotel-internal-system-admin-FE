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
import type { OtherIncome } from "@/lib/api-routes/financials";
import { DataTablePagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusIcon, DollarSignIcon, SearchIcon, XIcon, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TableFilter } from "@/components/shared/table-filter";
import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQueryStates, useQueryState, parseAsString } from "nuqs";
import { CreateOtherIncomeModal } from "./create-other-income-modal";
import { updateOtherIncomeStatus } from "@/lib/financials-actions";
import { revalidateRoute } from "@/lib/actions";

const columnHelper = createColumnHelper<OtherIncome>();

export const columns = [
    columnHelper.accessor("date", {
        header: "Date",
        cell: (info) => {
            const raw = info.getValue();
            if (!raw) return <span className="text-gray-400">—</span>;
            const date = new Date(raw);
            if (isNaN(date.getTime())) return <span className="text-gray-400">—</span>;
            const formattedDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
            });
            const formattedTime = date
                .toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })
                .toLowerCase();
            return <span>{`${formattedDate} | ${formattedTime}`}</span>;
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
    columnHelper.accessor("reference", {
        header: "Reference",
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => {
            const amount = parseFloat(info.getValue() as unknown as string);
            return <div className="font-medium">{formatCurrency(amount)}</div>;
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
                        {row.original.status === "PENDING" && (
                            <>
                                <DropdownMenuItem>Approve</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    }),
];

function Earnings({ metrics }: { metrics?: { totalRevenue: number; netProfit: number; totalExpenses: number } }) {
    const earnings = [
        {
            title: "Total Revenue",
            icon: DollarSignIcon,
            value: metrics?.totalRevenue ?? 0,
        },
        {
            title: "Net Profit",
            icon: DollarSignIcon,
            value: metrics?.netProfit ?? 0,
        },
        {
            title: "Expenses",
            icon: DollarSignIcon,
            value: metrics?.totalExpenses ?? 0,
        },
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {earnings.map((earning) => (
                <div
                    key={earning.title}
                    className="col-span-1 bg-white border border-primary-5/40 p-2 rounded-2xl md:rounded-3xl flex items-center space-x-2"
                >
                    <div className="size-8 md:size-12 aspect-square bg-green-500/20 rounded-full flex items-center justify-center">
                        <earning.icon className="text-secondary size-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs md:text-sm text-gray-400">{earning.title}</p>
                        <p className="text-lg text-primary font-semibold font-inter tracking-[0.01em] ">
                            {formatCurrency(earning.value)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function InnerTable({ table }: { table: TableType<OtherIncome> }) {
    return (
        <div className="border border-primary-5/20 rounded-xl overflow-clip">
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
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="text-gray-600">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>

                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={columns.length}>
                            <div className="w-full flex items-center justify-between">
                                <p>
                                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                    {table.getFilteredRowModel().rows.length} row(s) selected.
                                </p>
                                <DataTablePagination table={table} />
                            </div>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}

export function OtherIncomeTable({ data, metrics }: { data: OtherIncome[]; metrics?: { totalRevenue: number; netProfit: number; totalExpenses: number } }) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const [search, setSearch] = useQueryState("search", parseAsString.withDefault("").withOptions({ shallow: false, clearOnDefault: true }));
    const [filters, setFilters] = useQueryStates({
        category: parseAsString,
        startDate: parseAsString,
        endDate: parseAsString,
    });
    const [filterOpen, setFilterOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="space-y-4">
            <Earnings metrics={metrics} />

            <div className="space-y-2">
                <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
                    <div>
                        <p className="text-sm font-medium pl-2">Other Income ({table.getRowCount()})</p>
                    </div>

                    <div className="flex items-center gap-x-2 ">
                        <div className="relative hidden md:block w-64 lg:w-80">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    table.setGlobalFilter(e.target.value);
                                }}
                                className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full outline-none text-sm"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-2">
                            <TableFilter open={filterOpen} setOpen={setFilterOpen} count={(filters.category ? 1 : 0) + (filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0)}>
                                <div className="flex flex-col gap-y-4 w-[280px]">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Category</h4>
                                        <Select
                                            value={filters.category ?? "all"}
                                            onValueChange={(value) =>
                                                setFilters({
                                                    category: value === "all" ? null : value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All categories" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                <SelectItem value="VENDING">Vending</SelectItem>
                                                <SelectItem value="LAUNDRY">Laundry</SelectItem>
                                                <SelectItem value="PARKING">Parking</SelectItem>
                                                <SelectItem value="EVENT">Event</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Start Date</h4>
                                        <input
                                            type="date"
                                            value={filters.startDate ?? ""}
                                            onChange={(e) => setFilters({ startDate: e.target.value || null })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">End Date</h4>
                                        <input
                                            type="date"
                                            value={filters.endDate ?? ""}
                                            onChange={(e) => setFilters({ endDate: e.target.value || null })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFilters({ category: null, startDate: null, endDate: null })}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            Reset
                                        </Button>
                                        <Button size="sm" onClick={() => setFilterOpen(false)}>
                                            Done
                                        </Button>
                                    </div>
                                </div>
                            </TableFilter>

                            {/* Applied Filters */}
                            {(filters.category || filters.startDate || filters.endDate) && (
                                <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                                    {filters.category && (
                                        <span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                                            {filters.category}
                                            <button type="button" onClick={() => setFilters({ category: null })} className="hover:text-foreground">
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}
                                    {filters.startDate && (
                                        <span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                                            From: {filters.startDate}
                                            <button type="button" onClick={() => setFilters({ startDate: null })} className="hover:text-foreground">
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}
                                    {filters.endDate && (
                                        <span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                                            To: {filters.endDate}
                                            <button type="button" onClick={() => setFilters({ endDate: null })} className="hover:text-foreground">
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}
                                </div>
                            )}

                            <Button size={"sm"} onClick={() => setIsCreateModalOpen(true)} className="rounded-md md:rounded-xl">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                <span className="hidden md:inline">Add Income</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <InnerTable table={table} />
            </div>

            <CreateOtherIncomeModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </div>
    );
}
