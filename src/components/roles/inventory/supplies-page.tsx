"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
	TableFooter,
} from "@/components/ui/table";
import type {
	InventorySuppliers,
	Pagination,
} from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useSetAtom } from "jotai";
import { EditIcon, MoreVerticalIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react";
import { useEffect } from "react";

function BookingsListToolbar() {
	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div className="flex items-center gap-x-2">
				<Button
					size="sm"
					variant="outline"
					data-active
					className="shadow-none text-xs hover:border-transparent rounded-full"
				>
					All Suppliers
				</Button>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search"
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>
				<TableFilter></TableFilter>

				<Button
					size="sm"
					variant={"secondary"}
					className="rounded-md md:rounded-xl transition-[width,contents] will-change-contents duration-300"
				>
					<PlusIcon />
					<span className="hidden md:inline">
						Add Supplier
					</span>
				</Button>
			</div>
		</div>
	);
}

const suppliesPageColumnHelper = createColumnHelper<InventorySuppliers>();

const suppliesPageColumns = [
	suppliesPageColumnHelper.accessor("name", {
		id: "name",
		header: "Name",
		cell: (info) => info.getValue(),
	}),
	suppliesPageColumnHelper.accessor("email", {
		id: "email",
		header: "Email",
		cell: (info) => info.getValue(),
	}),
	suppliesPageColumnHelper.accessor("phone", {
		id: "phone",
		header: "Phone Number",
		cell: (info) => info.getValue(),
	}),
	suppliesPageColumnHelper.accessor("items", {
		id: "items",
		header: "Associated Items",
		cell: (info) => {
			const items = info.getValue();
			return items.map((item) => item.name).join(", ");
		},
	}),
	suppliesPageColumnHelper.display({
		id: "actions",
		cell: ({ row }) => {
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 p-0"
						>
							<span className="sr-only">Open menu</span>
							<MoreVerticalIcon />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuItem>
							<EditIcon />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem variant="destructive">
							<TrashIcon />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)
		}
	})
];

function SuppliesTable({
	data,
	paginationMeta,
}: {
	data: InventorySuppliers[];
	paginationMeta: Pagination;
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();
	const table = useReactTable({
		data,
		columns: suppliesPageColumns,
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

	return (
		<div className="overflow-hidden rounded-md border">
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
							<TableCell
								colSpan={suppliesPageColumns.length}
								className="h-24 text-center"
							>
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={suppliesPageColumns.length}>
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

export function SuppliesPage({
	breadcrumb,
	data,
	paginationMeta,
}: {
	breadcrumb: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
	data: InventorySuppliers[];
	paginationMeta: Pagination;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useEffect(() => {
		setBreadcrumb(breadcrumb);
		return () => setBreadcrumb(null);
	}, [breadcrumb, setBreadcrumb]);
	return (
		<div className="space-y-4 px-4 py-4">
			<BookingsListToolbar />

			<SuppliesTable
				data={data}
				paginationMeta={paginationMeta}
			/>
		</div>
	);
}
