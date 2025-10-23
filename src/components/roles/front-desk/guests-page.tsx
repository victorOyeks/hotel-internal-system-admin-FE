"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import type { Pagination } from "@/lib/fetch";
import { SearchIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { parseAsStringLiteral, useQueryStates, parseAsString } from "nuqs";
import { useState, useMemo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

const GuestsFilter = ({
  queryState,
  setQueryState,
  setOpen,
}: {
  setOpen: (open: boolean) => void;
  queryState: {
    search: string | null;
    status: | "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | null;
  };
  setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
  const [tempFilters, setTempFilters] = useState({
    status: queryState.status || null,
  });

  // Memoized callback functions to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    setQueryState({
      ...queryState,
      status: tempFilters.status,
    });
    setOpen(false);
  }, [queryState, tempFilters.status, setQueryState, setOpen]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      status: null,
    };
    setTempFilters(clearedFilters);
    setQueryState({
      search: queryState.search,
      status: null,
    });
  }, [queryState.search, setQueryState]);

  // Memoize filter state computations
  const filterStates = useMemo(() => {
    const hasActiveFilters = !!tempFilters.status;
    const hasAppliedFilters = !!queryState.status;
    const appliedFiltersCount = queryState.status ? 1 : 0;
    
    return {
      hasActiveFilters,
      hasAppliedFilters,
      appliedFiltersCount,
    };
  }, [tempFilters.status, queryState.status]);

  const statusOptions = useMemo(() => [
    { value: "RESERVED", label: "Reserved", color: "bg-yellow-500" },
    { value: "CHECKED_IN", label: "Checked In", color: "bg-blue-500" },
    { value: "CHECKED_OUT", label: "Checked Out", color: "bg-red-500" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-gray-500" },
  ], []);

  return (
    <div className="space-y-4 w-80">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Filter Guests</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcwIcon className="h-3 w-3 mr-1" />
          Clear all
        </Button>
      </div>

      {/* Booking Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Booking Status</Label>
        <Select
          value={tempFilters.status || "all"}
          onValueChange={(value) =>
            setTempFilters({
              ...tempFilters,
              status: value === "all" ? null : (value as "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED"),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Guests" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Guests</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 ${option.color} rounded-full`}></div>
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Summary */}
      {filterStates.hasActiveFilters && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-1">
            {tempFilters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Status: {statusOptions.find(s => s.value === tempFilters.status)?.label}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="flex-1"
        >
          Clear
        </Button>
        <Button size="sm" onClick={applyFilters} className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

function RoomListToolbar({ table }: { table: TableType<GuestLog> }) {
  const [queryStates, setQueryStates] = useQueryStates({
    search: parseAsString,
    status: parseAsStringLiteral(["RESERVED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]),
  });

  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div className="flex items-center gap-x-2">
        <Button
          size="sm"
          variant="outline"
          data-active={queryStates.status === null}
          onClick={() => setQueryStates({ status: null })}
          className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
            queryStates.status === null
              ? "bg-primary text-primary-foreground border-primary"
              : ""
          }`}
        >
          All Guests{" "}
          {queryStates.status === null &&
            `(${table.getRowCount() * table.getPageCount()})`}
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={queryStates.status === "CHECKED_IN"}
          onClick={() => setQueryStates({ status: "CHECKED_IN" })}
          className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
            queryStates.status === "CHECKED_IN"
              ? "bg-primary text-primary-foreground border-primary"
              : ""
          }`}
        >
          Active Guests{" "}
          {queryStates.status === "CHECKED_IN" &&
            `(${table.getFilteredRowModel().rows.length})`}
        </Button>
      </div>
      <div className="flex items-center gap-x-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search guests..."
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
            value={queryStates.search ?? ""}
            onChange={(e) =>
              setQueryStates({ search: e.target.value || null })
            }
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
        
        <div className="flex items-center gap-2">
          <TableFilter
            open={open}
            setOpen={setOpen}
          >
            <GuestsFilter
              queryState={queryStates}
              setQueryState={setQueryStates}
              setOpen={setOpen}
            />
          </TableFilter>
          
          {/* Applied Filters Display */}
          {queryStates.status && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Status:</span>
              <span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium capitalize">
                {queryStates.status.replace('_', ' ').toLowerCase()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setQueryStates({ status: null })}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
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
