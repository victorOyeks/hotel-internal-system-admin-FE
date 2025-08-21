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
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/shared/pagination";
import type { GetHotelResponse } from "@/lib/fetch";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";


const columnHelper = createColumnHelper<GetHotelResponse>();


function Toolbar(_: { table: TableType<GetHotelResponse> }) {
  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
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

function HotelList({ table }: { table: TableType<GetHotelResponse> }) {
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

const columns = [
  columnHelper.display({
    header: "S/N",
    cell: (info) => (
      <span className="text-foreground">{info.row.index + 1}</span>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Hotel Name",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("address", {
    header: "Location",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("totalRoom", {
    header: "Total Rooms",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("occupancyRate", {
    header: "Occupancy Rate",
    cell: (info) => `${info.getValue()}%`,
  }),
  columnHelper.accessor("grossRevenue", {
    header: "Gross Revenue",
    cell: (info) => formatCurrency(parseFloat(info.getValue())),
  }),
  columnHelper.display({
    id: "action",
    cell: (info) => {
        return (
            <Button variant={"secondary"} size={"sm"} className="rounded-full text-blue-500 bg-blue-500/10 hover:bg-blue-500/20" asChild>
                <Link href={`/owner/inventory/${info.row.original.id}`}>
                    View Inventory
                </Link>
            </Button>
        )
    },
  }),
];


export function MainInventoryPage({ data }: { data: GetHotelResponse[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-4 space-y-2 md:space-y-4">
      <Toolbar table={table} />
        <HotelList table={table} />
    </div>
  );
}
