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
import { MoreHorizontal, PlusIcon, DollarSignIcon, SearchIcon, XIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { TableFilter } from "@/components/shared/table-filter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQueryStates, useQueryState, parseAsString } from "nuqs";
import { CreateOtherIncomeModal } from "./create-other-income-modal";
import { updateOtherIncomeStatus } from "@/lib/financials-actions";
import { INCOME_CATEGORIES } from "@/lib/income-categories";
import { revalidateRoute } from "@/lib/actions";

const columnHelper = createColumnHelper<OtherIncome>();

function formatCategory(raw: string) {
    return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(raw: string | null | undefined) {
    if (!raw) return "—";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

function formatPaymentMethod(raw: string | null | undefined) {
    if (!raw) return "—";
    return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "secondary",
    APPROVED: "default",
    REJECTED: "destructive",
};

// Detail sheet component
function IncomeDetailSheet({
    income,
    onClose,
    onStatusChange,
}: {
    income: OtherIncome | null;
    onClose: () => void;
    onStatusChange: (id: string, status: "APPROVED" | "REJECTED") => void;
}) {
    if (!income) return null;

    const rows = [
        { label: "Title", value: income.title ?? "—" },
        { label: "Description", value: income.description ?? "—" },
        { label: "Income Date", value: formatDate(income.incomeDate) },
        { label: "Received Date", value: formatDate(income.receivedDate) },
        { label: "Amount", value: formatCurrency(income.amount) },
        { label: "Category", value: formatCategory(income.category) },
        { label: "Payment Method", value: formatPaymentMethod(income.paymentMethod) },
        { label: "Reference", value: income.reference ?? "—" },
        { label: "Invoice No.", value: income.invoiceNumber ?? "—" },
        { label: "Receipt No.", value: income.receiptNumber ?? "—" },
        { label: "Recorded By", value: income.recordedBy ?? "—" },
        { label: "Customer Name", value: income.customerName ?? "—" },
        { label: "Customer Contact", value: income.customerContact ?? "—" },
        { label: "Notes", value: income.notes ?? "—" },
    ];

    return (
        <Sheet open={!!income} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Income Details</SheetTitle>
                    <SheetDescription className="sr-only">View income record details</SheetDescription>
                </SheetHeader>

                <div className="space-y-6 p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">{income.title ?? income.description ?? "Other Income"}</h3>
                            <p className="text-sm text-muted-foreground">{formatCategory(income.category)}</p>
                        </div>
                        <Badge variant={statusVariant[income.status] ?? "outline"}>{income.status}</Badge>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 gap-0">
                        {rows.map((row) => (
                            <div
                                key={row.label}
                                className="flex items-start justify-between py-2.5 border-b border-gray-100 last:border-0"
                            >
                                <span className="text-sm text-muted-foreground w-36 shrink-0">{row.label}</span>
                                <span className="text-sm font-medium text-right">{row.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions for PENDING */}
                    {income.status === "PENDING" && (
                        <div className="flex gap-2 pt-2">
                            <Button
                                className="flex-1"
                                onClick={() => onStatusChange(income.id, "APPROVED")}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => onStatusChange(income.id, "REJECTED")}
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function ActionCell({ row, onView, onStatusChange }: {
    row: { original: OtherIncome };
    onView: (income: OtherIncome) => void;
    onStatusChange: (id: string, status: "APPROVED" | "REJECTED") => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(row.original)}>
                    View Details
                </DropdownMenuItem>
                {row.original.status === "PENDING" && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onStatusChange(row.original.id, "APPROVED")}>
                            Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => onStatusChange(row.original.id, "REJECTED")}
                        >
                            Reject
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function Earnings({ metrics }: { metrics?: { totalRevenue: number; netProfit: number; totalExpenses: number } }) {
    const earnings = [
        { title: "Total Revenue", icon: DollarSignIcon, value: metrics?.totalRevenue ?? 0 },
        { title: "Net Profit", icon: DollarSignIcon, value: metrics?.netProfit ?? 0 },
        { title: "Expenses", icon: DollarSignIcon, value: metrics?.totalExpenses ?? 0 },
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
                        <p className="text-lg text-primary font-semibold font-inter tracking-[0.01em]">
                            {formatCurrency(earning.value)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function InnerTable({ table, onView, onStatusChange }: {
    table: TableType<OtherIncome>;
    onView: (income: OtherIncome) => void;
    onStatusChange: (id: string, status: "APPROVED" | "REJECTED") => void;
}) {
    return (
        <div className="border border-primary-5/20 rounded-xl overflow-clip">
            <Table>
                <TableHeader className="bg-gray-100">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="text-gray-500">
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => onView(row.original)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className="text-gray-600"
                                        onClick={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
                                    >
                                        {cell.column.id === "actions"
                                            ? <ActionCell row={row} onView={onView} onStatusChange={onStatusChange} />
                                            : flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">No results.</TableCell>
                        </TableRow>
                    )}
                </TableBody>

                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={6}>
                            <div className="w-full flex items-center justify-between">
                                <p>{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.</p>
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
    const [selectedIncome, setSelectedIncome] = useState<OtherIncome | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate: changeStatus } = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) => {
            await updateOtherIncomeStatus(id, status);
        },
        onSuccess: async (_, { status }) => {
            toast.success(`Income ${status.toLowerCase()} successfully`);
            setSelectedIncome(null);
            await queryClient.invalidateQueries({ queryKey: ["other-income"] });
            await revalidateRoute("/financials/other-income");
        },
        onError: () => {
            toast.error("Failed to update status");
        },
    });

    const handleStatusChange = (id: string, status: "APPROVED" | "REJECTED") => {
        changeStatus({ id, status });
    };

    const columns = [
        columnHelper.accessor("incomeDate", {
            header: "Date",
            cell: (info) => <span className="text-sm">{formatDate(info.getValue())}</span>,
        }),
        columnHelper.accessor("title", {
            header: "Title",
            cell: (info) => (
                <div>
                    <p className="font-medium">{info.getValue() ?? info.row.original.description ?? "—"}</p>
                    {info.getValue() && info.row.original.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{info.row.original.description}</p>
                    )}
                </div>
            ),
        }),
        columnHelper.accessor("category", {
            header: "Category",
            cell: (info) => <span className="text-sm">{formatCategory(info.getValue())}</span>,
        }),
        columnHelper.accessor("paymentMethod", {
            header: "Payment",
            cell: (info) => <span className="text-sm">{formatPaymentMethod(info.getValue())}</span>,
        }),
        columnHelper.accessor("amount", {
            header: "Amount",
            cell: (info) => <div className="font-medium">{formatCurrency(Number(info.getValue()))}</div>,
        }),
        columnHelper.accessor("status", {
            header: "Status",
            cell: (info) => {
                const s = info.getValue();
                return <Badge variant={statusVariant[s] ?? "outline"}>{s}</Badge>;
            },
        }),
        columnHelper.display({ id: "actions", cell: () => null }),
    ];

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

    return (
        <div className="space-y-4">
            <Earnings metrics={metrics} />

            <div className="space-y-2">
                <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
                    <p className="text-sm font-medium pl-2">Other Income ({table.getRowCount()})</p>

                    <div className="flex items-center gap-x-2">
                        <div className="relative hidden md:block w-64 lg:w-80">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); table.setGlobalFilter(e.target.value); }}
                                className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full outline-none text-sm"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-2">
                            <TableFilter open={filterOpen} setOpen={setFilterOpen} count={(filters.category ? 1 : 0) + (filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0)}>
                                <div className="flex flex-col gap-y-4 w-[280px]">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Category</h4>
                                        <Select value={filters.category ?? "all"} onValueChange={(v) => setFilters({ category: v === "all" ? null : v })}>
                                            <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                                            <SelectContent className="max-h-64 overflow-y-auto">
                                                <SelectItem value="all">All Categories</SelectItem>
                                                {INCOME_CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Start Date</h4>
                                        <input type="date" value={filters.startDate ?? ""} onChange={(e) => setFilters({ startDate: e.target.value || null })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">End Date</h4>
                                        <input type="date" value={filters.endDate ?? ""} onChange={(e) => setFilters({ endDate: e.target.value || null })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <Button variant="ghost" size="sm" onClick={() => setFilters({ category: null, startDate: null, endDate: null })} className="text-muted-foreground hover:text-foreground">
                                            <XIcon className="h-3 w-3 mr-1" /> Reset
                                        </Button>
                                        <Button size="sm" onClick={() => setFilterOpen(false)}>Done</Button>
                                    </div>
                                </div>
                            </TableFilter>

                            <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="rounded-md md:rounded-xl">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                <span className="hidden md:inline">Add Income</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <InnerTable table={table} onView={setSelectedIncome} onStatusChange={handleStatusChange} />
            </div>

            <IncomeDetailSheet
                income={selectedIncome}
                onClose={() => setSelectedIncome(null)}
                onStatusChange={handleStatusChange}
            />

            <CreateOtherIncomeModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
        </div>
    );
}
