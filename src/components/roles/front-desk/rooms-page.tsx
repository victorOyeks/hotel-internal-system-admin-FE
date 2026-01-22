"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import type { Pagination, RoomDetails } from "@/lib/fetch";
import { SearchIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { parseAsStringLiteral, parseAsString, useQueryStates } from "nuqs";

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
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { DataTablePagination } from "@/components/shared/pagination";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
	TableFooter,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

function RoomsFilter({
	rooms,
	queryState,
	setQueryState,
}: {
	rooms: RoomDetails[];
	queryState: {
		roomStatus: "AVAILABLE" | null;
		search: string | null;
		roomType: string | null;
	};
	setQueryState: (state: Partial<typeof queryState>) => void;
}) {
	const [tempFilters, setTempFilters] = useState({
		roomType: queryState.roomType,
		status: queryState.roomStatus,
	});

	// Get unique room types from rooms data - memoized to prevent recalculation
	const roomTypes = useMemo(() => {
		return Array.from(new Set(rooms.map((room) => room.roomType))).filter(
			Boolean,
		);
	}, [rooms]);

	// Memoize filter state computations
	const filterStates = useMemo(() => {
		const hasActiveFilters = tempFilters.roomType || tempFilters.status;
		const hasAppliedFilters = queryState.roomType || queryState.roomStatus;
		const appliedFiltersCount = [
			queryState.roomType,
			queryState.roomStatus,
		].filter(Boolean).length;

		return {
			hasActiveFilters,
			hasAppliedFilters,
			appliedFiltersCount,
		};
	}, [
		tempFilters.roomType,
		tempFilters.status,
		queryState.roomType,
		queryState.roomStatus,
	]);

	// Memoized callback functions to prevent unnecessary re-renders
	const applyFilters = useCallback(() => {
		setQueryState({
			...queryState,
			roomStatus: tempFilters.status,
			roomType: tempFilters.roomType,
		});
	}, [queryState, tempFilters.status, tempFilters.roomType, setQueryState]);

	const clearFilters = useCallback(() => {
		const clearedFilters = {
			roomType: null,
			status: null,
		};
		setTempFilters(clearedFilters);
		setQueryState({
			search: queryState.search,
			roomStatus: null,
			roomType: null,
		});
	}, [queryState.search, setQueryState]);

	const roomStatusOptions = [
		{ value: "AVAILABLE", label: "Available" },
		{ value: "RESERVED", label: "Reserved" },
		{ value: "CHECKED_IN", label: "Checked In" },
		{ value: "CHECKED_OUT", label: "Checked Out" },
		{ value: "BLOCKED", label: "Blocked" },
		{ value: "DIRTY", label: "Dirty" },
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-sm">Filter Rooms</h4>
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

			{/* Room Status Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Status</Label>
				<Select
					value={tempFilters.status || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							status: value === "all" ? null : (value as "AVAILABLE"),
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{roomStatusOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Room Type Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Room Type</Label>
				<Select
					value={tempFilters.roomType || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							roomType: value === "all" ? null : value,
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All room types" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All room types</SelectItem>
						{roomTypes.map((roomType) => (
							<SelectItem key={roomType} value={roomType}>
								{roomType}
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
						{tempFilters.status && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Status: {tempFilters.status.toLowerCase().replace("_", " ")}
							</span>
						)}
						{tempFilters.roomType && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Type: {tempFilters.roomType}
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
}

function RoomListToolbar({
	table,
	rooms,
}: {
	table: TableType<RoomDetails>;
	rooms: RoomDetails[];
}) {
	const [queryState, setQueryState] = useQueryStates({
		roomStatus: parseAsStringLiteral(["AVAILABLE"]),
		search: parseAsString,
		roomType: parseAsString,
	});

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div className="flex items-center gap-x-2">
				<Button
					size="sm"
					variant="outline"
					data-active={queryState.roomStatus === null}
					onClick={() => setQueryState({ roomStatus: null })}
					className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
						queryState.roomStatus === null
							? "bg-primary text-primary-foreground border-primary"
							: ""
					}`}
				>
					All Rooms{" "}
					{queryState.roomStatus === null &&
						`(${table.getRowCount() * table.getPageCount()})`}
				</Button>

				<Button
					size="sm"
					variant="outline"
					data-active={queryState.roomStatus === "AVAILABLE"}
					onClick={() => setQueryState({ roomStatus: "AVAILABLE" })}
					className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
						queryState.roomStatus === "AVAILABLE"
							? "bg-primary text-primary-foreground border-primary"
							: ""
					}`}
				>
					Available Rooms{" "}
					{queryState.roomStatus === "AVAILABLE" &&
						`(${table.getFilteredRowModel().rows.length})`}
				</Button>
			</div>

			<div className="flex items-center gap-x-2 ">
				{" "}
				<div className="relative">
					<input
						type="text"
						placeholder="Search rooms..."
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
						value={queryState.search ?? ""}
						onChange={(e) => setQueryState({ search: e.target.value || null })}
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>
				<div className="flex items-center gap-2">
					<TableFilter>
						<RoomsFilter
							rooms={rooms}
							queryState={queryState}
							setQueryState={setQueryState}
						/>
					</TableFilter>

					{/* Applied Filters Display */}
					{queryState.roomType && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<span>Type:</span>
							<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
								{queryState.roomType}
							</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
								onClick={() => setQueryState({ roomType: null })}
							>
								<XIcon className="h-3 w-3" />
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

const columnHelper = createColumnHelper<RoomDetails>();

const columns = [
	columnHelper.accessor("customId", {
		header: "ID",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("roomIdentifier", {
		header: "Room Name/No",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("roomType", {
		header: "Room Type",
		cell: (info) => (
			<div className="flex items-center justify-center bg-[#fff5da] text-[#1c1c1c] p-2 rounded-md">
				{info.getValue()}
			</div>
		),
		filterFn: "equalsString",
	}),
	columnHelper.accessor("hotelName", {
		header: "Branch Name",
		cell: (info) => info.getValue(),
		filterFn: "includesString",
	}),
	columnHelper.accessor("checkInStatus", {
		header: "Room Status",
		cell: (info) => {
			const statusToVariant: Record<
				RoomDetails["checkInStatus"],
				BadgeVariant
			> = {
				AVAILABLE: "green",
				RESERVED: "yellow",
				BOOKED: "blue",
				CHECKED_IN: "blue",
				CHECKED_OUT: "red",
				BLOCKED: "gray",
				DIRTY: "red",
			};

			const status = info.getValue();
			const statusToLabel = status.replace(/_/g, " ").toLowerCase();
			return (
				<Badge className="capitalize" variant={statusToVariant[status]}>
					{statusToLabel}
				</Badge>
			);
		},
	}),

	columnHelper.accessor("roomPrice", {
		header: "Price/Night",
		cell: (info) => formatCurrency(info.getValue()) || "N/A",
	}),
	columnHelper.accessor("roomFacility", {
		header: "Room Facilities",
		cell: (info) => (
			<div className="flex flex-wrap gap-2">
				{info.getValue().map((facility, i) => (
					<span key={facility}>
						{facility}
						{i < info.getValue().length - 1 ? ", " : "."}
					</span>
				))}
			</div>
		),
	}),
];

function RoomListTable({ table }: { table: TableType<RoomDetails> }) {
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

export function RoomPage({
	breadcrumb,
	paginationMeta,
	rooms,
}: {
	rooms: RoomDetails[];
	paginationMeta: Pagination;
	breadcrumb: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();
	const table = useReactTable({
		data: rooms,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		state: {
			pagination,
		},
	});
	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useEffect(() => {
		setBreadcrumb(breadcrumb);
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumb]);

	return (
		<div className="space-y-6 px-2">
			<RoomListToolbar table={table} rooms={rooms} />
			<RoomListTable table={table} />
		</div>
	);
}
