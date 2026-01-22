"use client";

import { SearchIcon, RotateCcwIcon } from "lucide-react";
import { useQueryStates, parseAsString } from "nuqs";
import { useCallback, useLayoutEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
	type ColumnFiltersState,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type Table as TableType,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import {
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
	TableFooter,
	Table,
} from "@/components/ui/table";
import type { ManagerActivityLog, Pagination } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { atom, useSetAtom } from "jotai";
import {
	type ExportData,
	ExportDialog,
} from "@/components/shared/shared-dialogs";

const successDialogAtom = atom({
	show: false,
	message: "",
});

const _ActivityFilter = ({
	queryState,
	setQueryState,
}: {
	queryState: {
		search: string | null;
		role: string | null;
		activity: string | null;
	};
	setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
	const [tempFilters, setTempFilters] = useState({
		role: queryState.role || null,
		activity: queryState.activity || null,
	});

	// Memoized callback functions to prevent unnecessary re-renders
	const applyFilters = useCallback(() => {
		setQueryState({
			...queryState,
			role: tempFilters.role,
			activity: tempFilters.activity,
		});
	}, [queryState, tempFilters.role, tempFilters.activity, setQueryState]);

	const clearFilters = useCallback(() => {
		const clearedFilters = {
			role: null,
			activity: null,
		};
		setTempFilters(clearedFilters);
		setQueryState({
			search: queryState.search,
			role: null,
			activity: null,
		});
	}, [queryState.search, setQueryState]);

	// Memoize filter state computations
	const filterStates = useMemo(() => {
		const hasActiveFilters = !!(tempFilters.role || tempFilters.activity);
		const hasAppliedFilters = !!(queryState.role || queryState.activity);
		const appliedFiltersCount = [queryState.role, queryState.activity].filter(
			Boolean,
		).length;

		return {
			hasActiveFilters,
			hasAppliedFilters,
			appliedFiltersCount,
		};
	}, [
		tempFilters.role,
		tempFilters.activity,
		queryState.role,
		queryState.activity,
	]);

	const roleOptions = useMemo(
		() => [
			{ value: "MANAGER", label: "Manager" },
			{ value: "FRONT_DESK", label: "Front Desk" },
			{ value: "INVENTORY_MANAGER", label: "Inventory Manager" },
			{ value: "HOTEL_OWNER", label: "Hotel Owner" },
		],
		[],
	);

	const activityOptions = useMemo(
		() => [
			{ value: "LOGIN", label: "Login" },
			{ value: "LOGOUT", label: "Logout" },
			{ value: "CREATE_BOOKING", label: "Create Booking" },
			{ value: "UPDATE_BOOKING", label: "Update Booking" },
			{ value: "DELETE_BOOKING", label: "Delete Booking" },
			{ value: "CHECK_IN", label: "Check In" },
			{ value: "CHECK_OUT", label: "Check Out" },
			{ value: "INVENTORY_UPDATE", label: "Inventory Update" },
			{ value: "STAFF_MANAGEMENT", label: "Staff Management" },
		],
		[],
	);

	return (
		<div className="space-y-4 w-80">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-sm">Filter Activity Logs</h4>
				<Button
					variant="ghost"
					size="sm"
					onClick={clearFilters}
					className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
				>
					<RotateCcwIcon className="h-3 w-3 mr-1" />
					Clear all
				</Button>
			</div>

			{/* Role Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Staff Role</Label>
				<Select
					value={tempFilters.role || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							role: value === "all" ? null : value,
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Roles" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Roles</SelectItem>
						{roleOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Activity Type Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Activity Type</Label>
				<Select
					value={tempFilters.activity || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							activity: value === "all" ? null : value,
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Activities" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Activities</SelectItem>
						{activityOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Filter Summary */}
			{filterStates.hasActiveFilters && (
				<div className="pt-2 border-t">
					<p className="text-xs text-muted-foreground mb-2">Active filters:</p>
					<div className="flex flex-wrap gap-1">
						{tempFilters.role && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs">
								Role:{" "}
								{roleOptions.find((r) => r.value === tempFilters.role)?.label}
							</span>
						)}
						{tempFilters.activity && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs">
								Activity:{" "}
								{
									activityOptions.find((a) => a.value === tempFilters.activity)
										?.label
								}
							</span>
						)}
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex gap-2 pt-2">
				<Button
					variant="outline"
					size="sm"
					onClick={clearFilters}
					className="flex-1"
				>
					Clear
				</Button>
				<Button size="sm" onClick={applyFilters} className="flex-1">
					Apply Filters
				</Button>
			</div>
		</div>
	);
};

function ListToolbar(_props: { table: TableType<ManagerActivityLog> }) {
	const [searchParam, setSearchParam] = useQueryStates({
		search: parseAsString,
	});

	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const setSuccessDialogOpen = useSetAtom(successDialogAtom);

	const handleExport = useCallback(
		async (data: ExportData) => {
			// Handle the export logic here, e.g., sending data to an API
			console.log("Exporting data with the following details:", data);

			await new Promise((resolve) => setTimeout(resolve, 1000));
			setExportDialogOpen(false);
			setSuccessDialogOpen({
				show: true,
				message: "Data exported successfully!",
			});
		},
		[setSuccessDialogOpen],
	);

	return (
		<div className="flex flex-row-reverse items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search"
						value={searchParam.search ?? ""}
						onChange={(e) =>
							setSearchParam((prev) => ({
								...prev,
								search: e.target.value,
							}))
						}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				{/* <div className="flex items-center gap-2">
          <TableFilter>
            <ActivityFilter
              queryState={searchParam}
              setQueryState={setSearchParam}
            />
          </TableFilter>
          
          {/* Applied Filters Display */}
				{/* {(searchParam.role || searchParam.activity) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {searchParam.role && (
                <div className="flex items-center gap-1">
                  <span>Role:</span>
                  <span className="bg-secondary px-2 py-1 rounded-md font-medium">
                    {searchParam.role}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchParam({ role: null })}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {searchParam.activity && (
                <div className="flex items-center gap-1">
                  <span>Activity:</span>
                  <span className="bg-secondary px-2 py-1 rounded-md font-medium">
                    {searchParam.activity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchParam({ activity: null })}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div> */}

				<ExportDialog
					open={exportDialogOpen}
					setOpenAction={setExportDialogOpen}
					onSubmitAction={handleExport}
				/>
			</div>
		</div>
	);
}

function ActivityLogTable({ table }: { table: TableType<ManagerActivityLog> }) {
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

const columnHelper = createColumnHelper<ManagerActivityLog>();

const columns = [
	columnHelper.accessor("customId", {
		header: "ID",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("staffName", {
		header: "Staff Name",
		cell: (info) => info.getValue(),
		filterFn: "equalsString",
	}),
	columnHelper.accessor("staffEmail", {
		header: "Staff Email",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("role", {
		header: "Role",
		cell: (info) => {
			const status = info.getValue();
			const statusToLabel = status.replace(/_/g, " ").toLowerCase();
			return (
				<Badge className="capitalize " variant={"outline"}>
					{statusToLabel}
				</Badge>
			);
		},
	}),
	columnHelper.accessor("activity", {
		header: "Activity",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("hotelName", {
		header: "Hotel",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("createdAt", {
		header: "Timestamp",
		cell: (info) =>
			new Date(info.getValue()).toLocaleString(
				Intl.DateTimeFormat().resolvedOptions().locale,
				{
					year: "numeric",
					month: "short",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
				},
			),
	}),
];

export function ManagerActivityLogPage({
	breadcrumbs,
	data = [],
	paginationMeta,
}: {
	breadcrumbs: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
	data: ManagerActivityLog[];
	paginationMeta: Pagination;
}) {
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, onPaginationChange] = usePaginationSearchParams();

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
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	useLayoutEffect(() => {
		setBreadcrumb(breadcrumbs);
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	return (
		<div className="h-full w-full p-4 space-y-2 md:space-y-4">
			<ListToolbar table={table} />
			<ActivityLogTable table={table} />
		</div>
	);
}
