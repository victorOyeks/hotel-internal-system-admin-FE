"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import type { Pagination } from "@/lib/fetch";
import { SearchIcon } from "lucide-react";
import { useQueryState, parseAsStringLiteral } from "nuqs";

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
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { APIOutput } from "@/lib/action-utils";

type GuestLog =
  APIOutput<"@get/api/front-desks/guest-logs">["data"]["content"][number];

function RoomListToolbar({ table }: { table: TableType<GuestLog> }) {
  const [roomStatus, setRoomStatus] = useQueryState(
    "roomStatus",
    parseAsStringLiteral(["AVAILABLE"])
  );

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div className="flex items-center gap-x-2">
        <Button
          size="sm"
          variant="outline"
          data-active={roomStatus === null}
          onClick={() => setRoomStatus(null)}
          className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
            roomStatus === null
              ? "bg-primary text-primary-foreground border-primary"
              : ""
          }`}
        >
          All Rooms{" "}
          {roomStatus === null &&
            `(${table.getRowCount() * table.getPageCount()})`}
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={roomStatus === "AVAILABLE"}
          onClick={() => setRoomStatus("AVAILABLE")}
          className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
            roomStatus === "AVAILABLE"
              ? "bg-primary text-primary-foreground border-primary"
              : ""
          }`}
        >
          Available Rooms{" "}
          {roomStatus === "AVAILABLE" &&
            `(${table.getFilteredRowModel().rows.length})`}
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
      </div>
    </div>
  );
}

const columnHelper = createColumnHelper<GuestLog>();

const columns = [
  columnHelper.accessor("customId", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("guestName", {
    header: "Guest Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("roomIdentifier", {
    header: "Room Name/No",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("phoneNumber", {
    header: "Phone Number",
    cell: (info) => info.getValue() || "N/A",
    filterFn: "equalsString",
  }),
  columnHelper.accessor("bookingStatus", {
    header: "Room Status",
    cell: (info) => {
      const statusToVariant: Record<GuestLog["bookingStatus"], BadgeVariant> = {
        RESERVED: "yellow",
        CHECKED_IN: "blue",
        CHECKED_OUT: "red",
        CANCELLED: "gray",
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
  columnHelper.accessor("checkInDate", {
    header: "Check-In Date",
    cell: (info) => {
      const date = new Date(info.getValue());
      // Sep 03, 2025 | 09:30 am
      const dteString = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      const timeString = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${dteString} | ${timeString}`;
    },
    filterFn: "includesString",
  }),
  columnHelper.accessor("checkOutDate", {
    header: "Check-Out Date",
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "N/A";
      const date = new Date(value);
      // Sep 03, 2025 | 09:30 am
      const dteString = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      const timeString = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${dteString} | ${timeString}`;
    },
  }),
];

function RoomListTable({ table }: { table: TableType<GuestLog> }) {
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

export function GuestsLogPage({
  breadcrumb,
  paginationMeta,
  guests,
}: {
  guests: GuestLog[];
  paginationMeta: Pagination;
  breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
}) {
  const [pagination, onPaginationChange] = usePaginationSearchParams();
  const table = useReactTable({
    data: guests,
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
      <RoomListToolbar table={table} />
      <RoomListTable table={table} />
    </div>
  );
}
