"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { SearchIcon } from "lucide-react";
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
import type { Pagination } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { Badge } from "@/components/ui/badge";
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

type LostAndFound = {
  id: string;
  itemName: string;
  description: string;
  dateFound: string;
  locationFound: string;
  status: "claimed" | "unclaimed";
};

function Toolbar(_: { table: TableType<LostAndFound> }) {
  return (
    <div className="flex items-center justify-between space-x-2 bg-card border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
      </div>

      <div className="flex items-center gap-x-2 ">
        <TableFilter></TableFilter>
      </div>
    </div>
  );
}

const columnHelper = createColumnHelper<LostAndFound>();

const columns = [
  columnHelper.accessor("itemName", {
    header: "Item Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("dateFound", {
    header: "Date Found",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("locationFound", {
    header: "Location Found",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      const variant = status === "claimed" ? "green" : "yellow";
      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      );
    },
  }),
];

function LostAndFoundTable({ table }: { table: TableType<LostAndFound> }) {
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

export function LostAndFoundPage({
  data,
  paginationMeta,
}: {
  data: LostAndFound[];
  paginationMeta: Pagination;
}) {
  const [pagination, onPaginationChange] = usePaginationSearchParams();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
    },
    onPaginationChange,
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
  });

  return (
    <div className="space-y-4 px-4">
      <Toolbar table={table} />
      <LostAndFoundTable table={table} />
    </div>
  );
}
