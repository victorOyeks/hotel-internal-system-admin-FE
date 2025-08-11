"use client";

import { Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { RoomDetails } from "@/lib/types";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table as TableType,
} from "@tanstack/table-core";
import { formatCurrency } from "@/lib/utils";
import { Badge, BadgeVariant } from "@/components/ui/badge";
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
import { faker } from "@faker-js/faker";
import { DataTablePagination } from "@/components/shared/pagination";

function ListToolbar({ table }: { table: TableType<RoomDetails> }) {
  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div>
        <p className="text-primary md:pl-2">All rooms ({table.getRowModel().rows.length})</p>
      </div>

      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Hotels"
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>

        <Button
          size={"sm"}
          variant={"ghost"}
          className="rounded-md md:rounded-xl bg-gray-100"
        >
          <FilterIcon />
          <span className="hidden md:inline">Filter</span>
        </Button>

        <Button size={"sm"} className="rounded-md md:rounded-xl">
          Export
        </Button>
      </div>
    </div>
  );
}

function ViewSingleHotelTable({ table }: { table: TableType<RoomDetails> }) {
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
                tabIndex={1}
                role="checkbox"
                onClick={() => {
                  // mark row as selected
                  row.toggleSelected();
                }}
                className="cursor-pointer hover:bg-gray-50"
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
                {table.getFilteredSelectedRowModel().rows.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                  Displaying{" "}
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}{" "}
                  -{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{" "}
                  of {table.getFilteredRowModel().rows.length} rows
                  </p>
                )}

                <DataTablePagination table={table} />
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

const columnHelper = createColumnHelper<RoomDetails>();

const columns = [
  columnHelper.accessor("roomNumber", {
    header: "Room Number",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("roomType", {
    header: "Room Type",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("roomName", {
    header: "Room Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("roomPrice", {
    header: "Room Price",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  columnHelper.accessor("roomStatus", {
    header: "Room Status",
    cell: (info) => {
      const statusToVariant: Record<RoomDetails["roomStatus"], BadgeVariant> = {
        available: "green",
        reserved: "yellow",
        booked: "blue",
        blocked: "gray",
        dirty: "red",
      };
      const status = info.getValue();
      return (
        <Badge className="capitalize" variant={statusToVariant[status]}>
          {status}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("roomFacilities", {
    header: "Room Description",
    cell: (info) => info.getValue().join(", "),
  }),
];

export function ViewSingleHotelPage({
  breadcrumbs,
  rooms = [],
}: {
  breadcrumbs: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  rooms: RoomDetails[];
}) {
  const table = useReactTable({
    data: rooms,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const setBreadcrumb = useSetAtom(breadcrumbAtom);
  useLayoutEffect(() => {
    setBreadcrumb(breadcrumbs);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumbs]);

  return (
    <div className="h-full w-full p-4 space-y-2 md:space-y-4">
      <Link
        href={"/hotels"}
        className="inline-flex items-center gap-x-1 px-3 py-1.5 border-2 border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        <span>Back</span>
      </Link>

      <ListToolbar table={table} />
      <ViewSingleHotelTable table={table} />
    </div>
  );
}
