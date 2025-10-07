"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryItemResponse, Pagination } from "@/lib/fetch";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
import { usePaginationSearchParams } from "@/lib/search-params.pagination";

const issuedItemsColumnHelper = createColumnHelper<InventoryItemResponse>();

const issuedItemsColumns = [
  issuedItemsColumnHelper.accessor("name", {
    header: "Item",
    cell: (info) => <span className="text-foreground">{info.getValue()}</span>,
  }),
  issuedItemsColumnHelper.accessor("category", {
    header: "Category",
    cell: (info) => (
      <span className="capitalize font-semibold text-foreground">
        {info.getValue() || "N/A"}
      </span>
    ),
  }),
  issuedItemsColumnHelper.accessor("quantity", {
    header: "Quantity",
    cell: (info) => info.getValue(),
  }),
  issuedItemsColumnHelper.accessor("unit", {
    header: "Item unit",
    cell: (info) => (
      <span className="capitalize">{info.getValue() || "N/A"}</span>
    ),
  }),
  issuedItemsColumnHelper.display({
    header: "Receiving staff",
    cell: () => <span>N/A</span>,
  }),
  issuedItemsColumnHelper.accessor("restockReason", {
    header: "Reason for issue",
    cell: (info) => <span>{info.getValue() || "N/A"}</span>,
  }),
  issuedItemsColumnHelper.accessor("restockDate", {
    header: "Last issued",
    cell: (info) => {
      const date = new Date(info.getValue() || "");
      // 20/11/2024 | 03:25 pm
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const formattedTime = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return <span>{`${formattedDate} | ${formattedTime}`}</span>;
    },
  }),
];

function InventoryTable({
  table,
}: {
  table: TableType<InventoryItemResponse>;
}) {
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
                          header.getContext()
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
              <TableCell
                colSpan={issuedItemsColumns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={issuedItemsColumns.length}>
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

function IssuedItemsSection({
  data,
  paginationMeta,
}: {
  data: InventoryItemResponse[];
  paginationMeta: Pagination;
}) {
  const [pagination, onPaginationChange] = usePaginationSearchParams();
  const table = useReactTable({
    data,
    columns: issuedItemsColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
    state: {
      pagination,
    },
    onPaginationChange,
  });

  return <InventoryTable table={table} />;
}

export function IssuedItemsTable({
  data,
  paginationMeta,
}: {
  data: InventoryItemResponse[];
  paginationMeta: Pagination;
}) {
  return (
    <IssuedItemsSection
      data={data as InventoryItemResponse[]}
      paginationMeta={paginationMeta}
    />
  );
}
