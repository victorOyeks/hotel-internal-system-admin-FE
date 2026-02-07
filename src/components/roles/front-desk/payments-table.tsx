"use client";

import {
	type ColumnFiltersState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { format } from "date-fns";
import { SearchIcon, XIcon } from "lucide-react";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { useState } from "react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/shared/pagination";
import { TableFilter } from "@/components/shared/table-filter";
import { Label } from "@/components/ui/label";
import {
	type BookingPaymentResponse,
	type Pagination,
	PaymentMethod,
	PaymentStatus,
} from "@/lib/fetch";
import { formatCurrency } from "@/lib/utils";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";

const columnHelper = createColumnHelper<BookingPaymentResponse>();

const columns = [
	columnHelper.accessor("paymentDate", {
		header: "Date",
		cell: (info) => format(new Date(info.getValue()), "MMM dd, yyyy HH:mm"),
	}),
	columnHelper.accessor("guestName", {
		header: "Guest",
		cell: (info) => <div className="font-medium">{info.getValue()}</div>,
	}),
	columnHelper.accessor("roomIdentifier", {
		header: "Room",
		cell: (info) => (
			<div className="flex flex-col">
				<span>{info.getValue()}</span>
				<span className="text-xs text-muted-foreground">
					{info.row.original.roomType}
				</span>
			</div>
		),
	}),
	columnHelper.accessor("amount", {
		header: "Amount",
		cell: (info) => (
			<div className="font-semibold">{formatCurrency(info.getValue())}</div>
		),
	}),
	columnHelper.accessor("method", {
		header: "Method",
		cell: (info) => {
			const method = info.getValue().replace(/_/g, " ");
			return <span className="capitalize">{method.toLowerCase()}</span>;
		},
	}),
	columnHelper.accessor("type", {
		header: "Type",
		cell: (info) => (
			<Badge variant="outline" className="capitalize">
				{info.getValue().toLowerCase()}
			</Badge>
		),
	}),
	columnHelper.accessor("reference", {
		header: "Reference",
		cell: (info) => (
			<span className="font-mono text-xs">{info.getValue()}</span>
		),
	}),
	columnHelper.accessor("status", {
		header: "Status",
		cell: (info) => {
			const status = info.getValue();
			const variant: BadgeVariant =
				status === "SUCCESS" || status === "FULLY_PAID"
					? "green"
					: status === "PENDING" || status === "PARTLY_PAID"
						? "yellow"
						: status === "FAILED" || status === "CANCELLED"
							? "red"
							: "gray";

			return (
				<Badge variant={variant} className="capitalize">
					{status.replace(/_/g, " ").toLowerCase()}
				</Badge>
			);
		},
	}),
];

function PaymentFilters({
	query,
	setQuery,
}: {
	query: {
		search: string | null;
		method: string | null;
		status: string | null;
		page: number;
	};
	setQuery: (
		values: Partial<{
			search: string | null;
			method: string | null;
			status: string | null;
			page: number;
		}>,
	) => void;
}) {
	const [localFilters, setLocalFilters] = useState({
		method: query.method,
		status: query.status,
	});

	const applyFilters = () => {
		setQuery(localFilters);
	};

	const clearFilters = () => {
		const cleared = { method: null, status: null };
		setLocalFilters(cleared);
		setQuery(cleared);
	};

	return (
		<div className="w-80 space-y-4 p-1">
			<div className="flex items-center justify-between border-b pb-2">
				<h4 className="font-semibold text-sm">Filter Payments</h4>
				<Button
					variant="ghost"
					size="sm"
					onClick={clearFilters}
					className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
				>
					Clear all
				</Button>
			</div>

			<div className="space-y-2">
				<Label>Method</Label>
				<Select
					value={localFilters.method || "all"}
					onValueChange={(val) =>
						setLocalFilters((prev) => ({
							...prev,
							method: val === "all" ? null : val,
						}))
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="All Methods" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Methods</SelectItem>
						{PaymentMethod.options.map((option) => (
							<SelectItem key={option} value={option}>
								{option.replace(/_/g, " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label>Status</Label>
				<Select
					value={localFilters.status || "all"}
					onValueChange={(val) =>
						setLocalFilters((prev) => ({
							...prev,
							status: val === "all" ? null : val,
						}))
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="All Statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						{PaymentStatus.options.map((option) => (
							<SelectItem key={option} value={option}>
								{option.replace(/_/g, " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Button className="w-full" onClick={applyFilters}>
				Apply Filters
			</Button>
		</div>
	);
}

export function FrontDeskPaymentsTable({
	data,
	paginationMeta,
}: {
	data: BookingPaymentResponse[];
	paginationMeta: Pagination;
}) {
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, onPaginationChange] = usePaginationSearchParams();

	const [query, setQuery] = useQueryStates({
		search: parseAsString,
		method: parseAsString,
		status: parseAsString,
		page: parseAsInteger.withDefault(1),
	});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		state: {
			columnFilters,
			pagination,
		},
	});

	const activeFilterCount = [query.method, query.status].filter(Boolean).length;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
				<div />
				<div className="flex items-center gap-x-2 ">
					<div className="relative">
						<input
							type="text"
							placeholder="Search by guest, room, or reference..."
							value={query.search || ""}
							onChange={(e) => setQuery({ search: e.target.value || null })}
							className="w-full pl-9 py-2 bg-primary-5/10 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full outline-none focus:ring-2 focus:ring-primary/20"
						/>
						<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
					</div>
					<div className="flex items-center gap-2">
						<TableFilter>
							<PaymentFilters query={query} setQuery={setQuery} />
						</TableFilter>

						{activeFilterCount > 0 && (
							<div className="flex items-center gap-2 text-xs">
								<span className="text-muted-foreground px-2 py-1 bg-secondary rounded-full">
									{activeFilterCount} active filters
								</span>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0"
									onClick={() => setQuery({ method: null, status: null })}
								>
									<XIcon className="h-3 w-3" />
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="rounded-md border bg-card">
				<Table>
					<TableHeader className="bg-muted/50">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
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
									className="hover:bg-muted/50"
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
									No payments found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
					<TableFooter className="bg-transparent">
						<TableRow>
							<TableCell colSpan={columns.length}>
								<div className="flex items-center justify-between w-full">
									<div className="text-sm text-muted-foreground">
										Page {table.getState().pagination.pageIndex + 1} of{" "}
										{table.getPageCount()}
									</div>
									<DataTablePagination table={table} />
								</div>
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</div>
		</div>
	);
}
