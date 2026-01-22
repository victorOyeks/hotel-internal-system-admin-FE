import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { InventoryDelivery, Pagination } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/shared/pagination";

const columnHelper = createColumnHelper<InventoryDelivery>();

const deliveryHistoryColumns = [
	columnHelper.accessor("supplierName", {
		header: "Supplier Name",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("item.name", {
		header: "Associated Item",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("unit", {
		header: "Item Unit",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("quantity", {
		header: "Quantity Delivered",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("deliveryDate", {
		header: "Delivery Date",
		cell: (info) => {
			const date = new Date(info.getValue());
			// date format: dd/mm/yyyy
			return date.toLocaleDateString("en-GB");
		},
	}),
	columnHelper.accessor("note", {
		header: "Note",
		cell: (info) => info.getValue() || "-",
	}),
];

export function InventoryDeliveryHistory({
	data,
	paginationMeta,
}: {
	data: InventoryDelivery[];
	paginationMeta: Pagination;
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();
	const table = useReactTable({
		data,
		columns: deliveryHistoryColumns,
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
								colSpan={deliveryHistoryColumns.length}
								className="h-24 text-center"
							>
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={deliveryHistoryColumns.length}>
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
