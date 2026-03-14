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
import type { Expenditure } from "@/lib/api-routes/financials";
import { DataTablePagination } from "@/components/shared/pagination";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DatePicker } from "@/components/shared/date-picker";
import { CreateExpenditureModal } from "./create-expenditure-modal";
import { updateExpenditureStatus } from "@/lib/financials-actions";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { useQueryState, useQueryStates, parseAsString } from "nuqs";
import { revalidateRoute } from "@/lib/actions";

const columnHelper = createColumnHelper<Expenditure>();

export const columns = [
    columnHelper.accessor("expenseDate", {
        header: "Date",
        cell: (info) => {
            const val = info.getValue();
            if (!val) return "-";
            const date = new Date(val);
            const formattedDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
            });
            return <span>{formattedDate}</span>;
        },
    }),
    columnHelper.accessor("title", {
        header: "Title",
        cell: (info) => <div className="font-medium">{info.getValue() ?? "-"}</div>,
    }),
    columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => info.getValue()?.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()),
    }),
    columnHelper.accessor("vendorName", {
        header: "Vendor",
        cell: (info) => info.getValue() ?? "-",
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
            let variant: BadgeVariant = "default";

            if (status === "PENDING") variant = "yellow";
            else if (status === "REJECTED") variant = "red";
            else if (status === "APPROVED") variant = "blue";
            else if (status === "PAID") variant = "green";

            const label = status.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
            return <Badge variant={variant}>{label}</Badge>;
        },
    }),
];

function ExpenditureDetailSheet({ expenditure, open, onOpenChange }: { expenditure: Expenditure | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!expenditure) return null;

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    const statusVariant: Record<string, BadgeVariant> = {
        PENDING: "yellow",
        REJECTED: "red",
        APPROVED: "blue",
        PAID: "green",
        OVERDUE: "red",
        CANCELLED: "red",
    };

    const details = [
        { label: "Reference", value: expenditure.referenceNumber ?? "-" },
        { label: "Title", value: expenditure.title ?? "-" },
        { label: "Description", value: expenditure.description ?? "-" },
        { label: "Category", value: expenditure.category },
        { label: "Amount", value: formatCurrency(expenditure.amount) },
        { label: "Vendor", value: expenditure.vendorName ?? "-" },
        { label: "Invoice No.", value: expenditure.invoiceNumber ?? "-" },
        { label: "Expense Date", value: formatDate(expenditure.expenseDate) },
        { label: "Due Date", value: formatDate(expenditure.dueDate) },
        { label: "Paid Date", value: formatDate(expenditure.paidDate) },
        { label: "Created", value: formatDate(expenditure.createdAt) },
        { label: "Approved By", value: expenditure.approvedBy ?? "-" },
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Expenditure Details</SheetTitle>
                    <SheetDescription>
                        {expenditure.title || expenditure.referenceNumber || "Expenditure"}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 px-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        <Badge variant={statusVariant[expenditure.status] ?? "outline"}>
                            {expenditure.status}
                        </Badge>
                    </div>
                    <div className="divide-y">
                        {details.map((item) => (
                            <div key={item.label} className="flex justify-between py-3">
                                <span className="text-sm text-gray-500">{item.label}</span>
                                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function Earnings({ metrics }: { metrics?: { totalRevenue: number, netProfit: number, totalExpenses: number } }) {
    const earnings = [
        {
            title: "Total Revenue",
            icon: DollarSignIcon,
            value: metrics?.totalRevenue ?? 0,
        },
        {
            title: "Total Profit",
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

function InnerTable({ table }: { table: TableType<Expenditure> }) {
    return (
        <div className="border border-primary-5/20 rounded-xl overflow-clip bg-card">
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

export function ExpenditureTable({ data, totalPages, metrics }: { data: Expenditure[], totalPages: number, metrics?: { totalRevenue: number, netProfit: number, totalExpenses: number } }) {
    const [{ pageIndex, pageSize }, setPagination] = usePaginationSearchParams();
    const [search, setSearch] = useQueryState("search", parseAsString.withDefault("").withOptions({ shallow: false, clearOnDefault: true }));
    const [filters, setFilters] = useQueryStates({
        status: parseAsString,
        startDate: parseAsString,
        endDate: parseAsString,
    }, { shallow: false, clearOnDefault: true });
    const [filterOpen, setFilterOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedExpenditure, setSelectedExpenditure] = useState<Expenditure | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const queryClient = useQueryClient();

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: "PENDING" | "APPROVED" | "PAID" | "REJECTED" }) => {
            await updateExpenditureStatus(id, status);
        },
        onSuccess: (_data, variables) => {
            const labels: Record<string, string> = {
                APPROVED: "approved",
                REJECTED: "rejected",
                PAID: "marked as paid",
            };
            toast.success(`Expenditure ${labels[variables.status] ?? "updated"} successfully`);
            queryClient.invalidateQueries({ queryKey: ["financials"] });
            revalidateRoute("/dashboard/expenditures")
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update expenditure status");
        },
    });

    const handleViewDetails = useCallback((expenditure: Expenditure) => {
        setSelectedExpenditure(expenditure);
        setIsDetailOpen(true);
    }, []);

    const handleStatusUpdate = useCallback((id: string, status: "PENDING" | "APPROVED" | "PAID" | "REJECTED") => {
        statusMutation.mutate({ id, status });
    }, [statusMutation]);

    const allColumns = useMemo(() => [
        ...columns,
        columnHelper.display({
            id: "actions",
            cell: ({ row }) => {
                const isUpdating = statusMutation.isPending && statusMutation.variables?.id === row.original.id;
                const pendingStatus = statusMutation.variables?.status;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                                {isUpdating ? (
                                    <Loader2
                                        className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </>
                                )}
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
                            <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
                                View Details
                            </DropdownMenuItem>
                            {row.original.status === "PENDING" && (
                                <>
                                    <DropdownMenuItem
                                        disabled={isUpdating}
                                        onClick={() => handleStatusUpdate(row.original.id, "APPROVED")}
                                    >
                                        {isUpdating && pendingStatus === "APPROVED" ? "Approving..." : "Approve"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        disabled={isUpdating}
                                        onClick={() => handleStatusUpdate(row.original.id, "REJECTED")}
                                    >
                                        {isUpdating && pendingStatus === "REJECTED" ? "Rejecting..." : "Reject"}
                                    </DropdownMenuItem>
                                </>
                            )}
                            {row.original.status === "APPROVED" && (
                                <DropdownMenuItem
                                    disabled={isUpdating}
                                    onClick={() => handleStatusUpdate(row.original.id, "PAID")}
                                >
                                    {isUpdating && pendingStatus === "PAID" ? "Processing..." : "Mark as Paid"}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        }),
    ], [handleViewDetails, handleStatusUpdate, statusMutation.isPending, statusMutation.variables?.id, statusMutation.variables?.status]);

    const table = useReactTable({
        data,
        columns: allColumns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: true,
        pageCount: totalPages,
        state: {
            pagination: { pageIndex, pageSize },
        },
        onPaginationChange: setPagination,
    });

    return (
        <div className="space-y-4">
            <Earnings metrics={metrics} />

            <div className="space-y-2">
                <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
                    <div>
                        <p className="text-sm font-medium pl-2">Expenditures ({table.getRowCount()})</p>
                    </div>

                    <div className="flex items-center gap-x-2 ">
                        <div className="relative hidden md:block w-64 lg:w-80">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPagination({ pageIndex: 0 });
                                }}
                                className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full outline-none text-sm"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-2">
                            <TableFilter open={filterOpen} setOpen={setFilterOpen} count={(filters.status ? 1 : 0) + (filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0)}>
                                <div className="flex flex-col gap-y-3">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Status</h4>
                                        <Select
                                            value={filters.status ?? "all"}
                                            onValueChange={(value) => {
                                                setFilters({
                                                    status: value === "all" ? null : value,
                                                });
                                                setPagination({ pageIndex: 0 });
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All statuses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                                <SelectItem value="APPROVED">Approved</SelectItem>
                                                <SelectItem value="PAID">Paid</SelectItem>
                                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Start Date</h4>
                                        <DatePicker
                                            initialDate={filters.startDate ?? ""}
                                            placeholder="Select start date"
                                            onChange={(date) => {
                                                setFilters({ startDate: date || null });
                                                setPagination({ pageIndex: 0 });
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">End Date</h4>
                                        <DatePicker
                                            initialDate={filters.endDate ?? ""}
                                            placeholder="Select end date"
                                            minDate={filters.startDate ? new Date(filters.startDate) : undefined}
                                            onChange={(date) => {
                                                setFilters({ endDate: date || null });
                                                setPagination({ pageIndex: 0 });
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setFilters({ status: null, startDate: null, endDate: null });
                                                setPagination({ pageIndex: 0 });
                                            }}
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
                            {(filters.status || filters.startDate || filters.endDate) && (
                                <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                                    {filters.status && (
                                        <span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                                            {filters.status}
                                            <button type="button" onClick={() => { setFilters({ status: null }); setPagination({ pageIndex: 0 }); }} className="hover:text-foreground">
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}
                                    {filters.startDate && (
                                        <span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                                            From: {filters.startDate}
                                            <button type="button" onClick={() => { setFilters({ startDate: null }); setPagination({ pageIndex: 0 }); }} className="hover:text-foreground">
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}
                                    {filters.endDate && (
                                        <span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                                            To: {filters.endDate}
                                            <button type="button" onClick={() => { setFilters({ endDate: null }); setPagination({ pageIndex: 0 }); }} className="hover:text-foreground">
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}
                                </div>
                            )}

                            <Button size={"sm"} onClick={() => setIsCreateModalOpen(true)} className="rounded-md md:rounded-xl">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                <span className="hidden md:inline">Record Expenditure</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <InnerTable table={table} />
            </div>

            <CreateExpenditureModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />

            <ExpenditureDetailSheet
                expenditure={selectedExpenditure}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    );
}
