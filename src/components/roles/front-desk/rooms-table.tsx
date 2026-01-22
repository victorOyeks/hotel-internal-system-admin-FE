"use client";

import { atom, useAtom } from "jotai";
import { useState } from "react";
import {
	type ColumnFiltersState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/table-core";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { flexRender, useReactTable } from "@tanstack/react-table";
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
import type { Pagination, RoomDetails } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";

const successDialogAtom = atom({
	show: false,
	message: "",
});

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
				CHECKED_OUT: "secondary",
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

export function RoomsListTable({
	rooms = [],
	paginationMeta,
}: {
	rooms: RoomDetails[];
	paginationMeta: Pagination;
}) {
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, onPaginationChange] = usePaginationSearchParams();

	const table = useReactTable({
		data: rooms,
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
	const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);
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
