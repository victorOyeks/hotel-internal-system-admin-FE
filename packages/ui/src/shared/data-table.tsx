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
import { type PageInfo, ServerPager } from "./server-pager";

/**
 * Server mode: the rows are one page the service already filtered and sorted. `onPage` takes the 0-based
 * page; `sortKeys` maps a column id to the service's sort field (only those headers sort), `sort` is the
 * current `field,asc|desc` and `onSort` sets it (null for the default order).
 */
export type ServerPaging = {
	page: PageInfo;
	onPage: (page: number) => void;
	sort?: string | null;
	onSort?: (sort: string | null) => void;
	sortKeys?: Record<string, string>;
};

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
	server,
	filtered = false,
	onClearFilters,
	error,
	onRetry,
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
	/** Paged by the service: see {@link ServerPaging}. Client search and paging are off. */
	server?: ServerPaging;
	/** Filters or a search are on: an empty list reads "No matches" with a Clear filters button. */
	filtered?: boolean;
	onClearFilters?: () => void;
	/** The list didn't load: shown in place of the rows, with Try again when `onRetry` is given. */
	error?: string | null;
	onRetry?: () => void;
}) {
	if (server)
		return (
			<ServerDataTable
				columns={columns}
				data={data}
				server={server}
				onRowClick={onRowClick}
				emptyTitle={emptyTitle}
				emptyHint={emptyHint}
				rowClassName={rowClassName}
				footer={footer}
				dense={dense}
				className={className}
				filtered={filtered}
				onClearFilters={onClearFilters}
				error={error}
				onRetry={onRetry}
			/>
		);
	return (
		<ClientDataTable
			columns={columns}
			data={data}
			search={search}
			pageSize={pageSize}
			onRowClick={onRowClick}
			emptyTitle={emptyTitle}
			emptyHint={emptyHint}
			rowClassName={rowClassName}
			footer={footer}
			dense={dense}
			className={className}
			filtered={filtered}
			onClearFilters={onClearFilters}
			error={error}
			onRetry={onRetry}
		/>
	);
}

type TableProps<T> = {
	columns: ColumnDef<T, unknown>[];
	data: T[];
	onRowClick?: (row: T) => void;
	emptyTitle: string;
	emptyHint?: string;
	rowClassName?: (row: T) => string | undefined;
	footer?: ReactNode;
	dense: boolean;
	className?: string;
	filtered: boolean;
	onClearFilters?: () => void;
	error?: string | null;
	onRetry?: () => void;
};

/** The empty, no-match and load-error states shared by both modes. */
function Placeholder({
	rows,
	emptyTitle,
	emptyHint,
	filtered,
	onClearFilters,
	error,
	onRetry,
}: { rows: number } & Pick<TableProps<unknown>, "emptyTitle" | "emptyHint" | "filtered" | "onClearFilters" | "error" | "onRetry">) {
	if (error)
		return (
			<EmptyState title="This list didn't load" hint={error}>
				{onRetry && (
					<button type="button" onClick={onRetry} className="mt-2 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:bg-subtle">
						Try again
					</button>
				)}
			</EmptyState>
		);
	if (rows > 0) return null;
	if (filtered)
		return (
			<EmptyState title="No matches" hint="Nothing matches these filters.">
				{onClearFilters && (
					<button type="button" onClick={onClearFilters} className="mt-2 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:bg-subtle">
						Clear filters
					</button>
				)}
			</EmptyState>
		);
	return <EmptyState title={emptyTitle} hint={emptyHint} />;
}

function ServerDataTable<T>({
	columns,
	data,
	server,
	onRowClick,
	emptyTitle,
	emptyHint,
	rowClassName,
	footer,
	dense,
	className,
	filtered,
	onClearFilters,
	error,
	onRetry,
}: TableProps<T> & { server: ServerPaging }) {
	const keys = server.sortKeys ?? {};
	const [field, dir] = (server.sort ?? "").split(",");
	const columnOf = Object.entries(keys).find(([, f]) => f === field)?.[0];
	const sorting: SortingState = columnOf ? [{ id: columnOf, desc: dir !== "asc" }] : [];
	const pageCount = server.page.totalPages ?? Math.ceil(server.page.total / Math.max(1, server.page.size));
	const table = useReactTable({
		data,
		columns,
		state: { sorting, pagination: { pageIndex: server.page.page, pageSize: server.page.size } },
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true,
		pageCount,
		rowCount: server.page.total,
		enableSorting: !!server.onSort,
		onSortingChange: (updater) => {
			const next = typeof updater === "function" ? updater(sorting) : updater;
			const first = next[0];
			const f = first ? keys[first.id] : undefined;
			server.onSort?.(first && f ? `${f},${first.desc ? "desc" : "asc"}` : null);
		},
		getCoreRowModel: getCoreRowModel(),
	});
	const rows = table.getRowModel().rows;
	const blank = error || rows.length === 0;
	return (
		<div className={cn("flex flex-col overflow-hidden rounded-card border border-line bg-card", className)}>
			<div className="overflow-x-auto">
				<table className="w-full text-left">
					<thead>
						{table.getHeaderGroups().map((hg) => (
							<tr key={hg.id} className="border-b border-line bg-[#fafafa]">
								{hg.headers.map((header) => {
									const canSort = !!server.onSort && header.column.id in keys && header.column.getCanSort();
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
						{blank ? (
							<tr>
								<td colSpan={columns.length} className="p-4">
									<Placeholder rows={error ? 0 : rows.length} emptyTitle={emptyTitle} emptyHint={emptyHint} filtered={filtered} onClearFilters={onClearFilters} error={error} onRetry={onRetry} />
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
				<ServerPager bare page={error ? { ...server.page, total: 0 } : server.page} onPage={server.onPage} className="flex-1" />
				{footer}
			</div>
		</div>
	);
}

function ClientDataTable<T>({
	columns,
	data,
	search,
	pageSize,
	onRowClick,
	emptyTitle,
	emptyHint,
	rowClassName,
	footer,
	dense,
	className,
	filtered,
	onClearFilters,
	error,
	onRetry,
}: TableProps<T> & { search?: string; pageSize: number }) {
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
						{rows.length === 0 || error ? (
							<tr>
								<td colSpan={columns.length} className="p-4">
									<Placeholder rows={error ? 0 : rows.length} emptyTitle={emptyTitle} emptyHint={emptyHint} filtered={filtered} onClearFilters={onClearFilters} error={error} onRetry={onRetry} />
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
