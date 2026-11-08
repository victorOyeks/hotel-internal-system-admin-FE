"use client";

import {
	type ColumnDef,
	type SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsUpDownIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@hospio/ui/utils";
import { EmptyState } from "./empty-state";

/**
 * The list table from the component library (Header/Row 900x40): sortable headers, client-side
 * search and paging, an empty state, and an optional click on the row. Pass `search` from a
 * <SearchBox> to filter across every column's text.
 */
export function DataTable<T>({
	columns,
	data,
	search,
	pageSize = 10,
	onRowClick,
	emptyTitle = "Nothing here yet",
	emptyHint,
	rowClassName,
	footer,
	dense = false,
	className,
}: {
	columns: ColumnDef<T, unknown>[];
	data: T[];
	search?: string;
	pageSize?: number;
	onRowClick?: (row: T) => void;
	emptyTitle?: string;
	emptyHint?: string;
	rowClassName?: (row: T) => string | undefined;
	footer?: ReactNode;
	dense?: boolean;
	className?: string;
}) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState(search ?? "");
	useEffect(() => setGlobalFilter(search ?? ""), [search]);

	const table = useReactTable({
		data,
		columns,
		state: { sorting, globalFilter },
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: (row, _columnId, value: string) => {
			const needle = value.toLowerCase().trim();
			if (!needle) return true;
			return JSON.stringify(row.original).toLowerCase().includes(needle);
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize } },
	});

	const rows = table.getRowModel().rows;
	const total = table.getFilteredRowModel().rows.length;
	const { pageIndex } = table.getState().pagination;
	const from = total === 0 ? 0 : pageIndex * pageSize + 1;
	const to = Math.min(total, (pageIndex + 1) * pageSize);

	return (
		<div className={cn("flex flex-col overflow-hidden rounded-card border border-line bg-card", className)}>
			<div className="overflow-x-auto">
				<table className="w-full text-left">
					<thead>
						{table.getHeaderGroups().map((hg) => (
							<tr key={hg.id} className="border-b border-line bg-[#fafafa]">
								{hg.headers.map((header) => {
									const canSort = header.column.getCanSort();
									const sorted = header.column.getIsSorted();
									return (
										<th
											key={header.id}
											className={cn("px-4 py-[10px] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3", canSort && "cursor-pointer select-none hover:text-ink")}
											style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
											onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
										>
											<span className="inline-flex items-center gap-1">
												{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
												{canSort && (sorted === "asc" ? <ArrowUpIcon className="size-3" /> : sorted === "desc" ? <ArrowDownIcon className="size-3" /> : <ChevronsUpDownIcon className="size-3 opacity-50" />)}
											</span>
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="p-4">
									<EmptyState title={emptyTitle} hint={emptyHint} />
								</td>
							</tr>
						) : (
							rows.map((row) => (
								<tr
									key={row.id}
									onClick={onRowClick ? () => onRowClick(row.original) : undefined}
									className={cn("border-b border-line last:border-b-0", onRowClick && "cursor-pointer hover:bg-subtle/60", rowClassName?.(row.original))}
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className={cn("px-4 text-[13px] text-ink align-middle", dense ? "py-2" : "py-3")}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<div className="flex items-center gap-3 border-t border-line px-4 py-[10px] text-xs text-ink-3">
				<span className="flex-1">{total === 0 ? "No rows" : `Showing ${from}–${to} of ${total}`}</span>
				{footer}
				{table.getPageCount() > 1 && (
					<div className="flex items-center gap-1">
						<button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="flex size-7 items-center justify-center rounded-md border border-line text-ink-2 hover:bg-subtle disabled:opacity-40" aria-label="Previous page">
							<ChevronLeftIcon className="size-4" />
						</button>
						<span className="px-2 font-medium text-ink-2">
							{pageIndex + 1} / {table.getPageCount()}
						</span>
						<button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="flex size-7 items-center justify-center rounded-md border border-line text-ink-2 hover:bg-subtle disabled:opacity-40" aria-label="Next page">
							<ChevronRightIcon className="size-4" />
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

/** Two-line cell: a bold primary line and a muted secondary one. */
export function TwoLine({ primary, secondary, className }: { primary: ReactNode; secondary?: ReactNode; className?: string }) {
	return (
		<div className={cn("min-w-0", className)}>
			<p className="truncate text-[13px] font-semibold text-ink">{primary}</p>
			{secondary && <p className="truncate text-xs text-ink-3">{secondary}</p>}
		</div>
	);
}
