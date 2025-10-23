"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { SearchIcon, RotateCcwIcon, XIcon, MoreVerticalIcon, Trash2Icon, CircleDotDashedIcon, BedIcon } from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryStates, parseAsString, parseAsStringLiteral, type ParserBuilder, type SetValues } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  type CellContext,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Table as TableType,
} from "@tanstack/react-table";
import type { LostItem, Pagination } from "@/lib/fetch";
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
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DatePicker } from "@/components/shared/date-picker";
import { formatDate } from "date-fns";
import { APIOutput } from "@/lib/action-utils";
import { cn } from "@/lib/utils";

function LostItemFilter({
  queryState,
  setQueryState,
  setOpen
}: {
  queryState: {
    search: string | null;
    status: "UNCLAIMED" | "CLAIMED" | "DISPOSED" | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
  setQueryState: SetValues<{
    search: ParserBuilder<string>;
    status: ParserBuilder<"UNCLAIMED" | "CLAIMED" | "DISPOSED">;
    dateFrom: ParserBuilder<string>;
    dateTo: ParserBuilder<string>;
  }>;
  setOpen: (open: boolean) => void;
}) {
  const [tempFilters, setTempFilters] = useState({
    status: queryState.status || null,
    dateFrom: queryState.dateFrom || null,
    dateTo: queryState.dateTo || null,
  });

  // Memoized callback functions to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    setQueryState({
      ...queryState,
      status: tempFilters.status,
      dateFrom: tempFilters.dateFrom,
      dateTo: tempFilters.dateTo,
    });
    setOpen(false);
  }, [queryState, tempFilters, setQueryState, setOpen]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      status: null,
      dateFrom: null,
      dateTo: null,
    };
    setTempFilters(clearedFilters);
    setQueryState({
      search: queryState.search,
      status: null,
      dateFrom: null,
      dateTo: null,
    });
  }, [queryState.search, setQueryState]);

  // Memoize filter state computations
  const filterStates = useMemo(() => {
    const hasActiveFilters = !!(tempFilters.status || tempFilters.dateFrom || tempFilters.dateTo);
    const hasAppliedFilters = !!(queryState.status || queryState.dateFrom || queryState.dateTo);
    const appliedFiltersCount = [queryState.status, queryState.dateFrom, queryState.dateTo].filter(Boolean).length;

    return {
      hasActiveFilters,
      hasAppliedFilters,
      appliedFiltersCount,
    };
  }, [tempFilters.status, tempFilters.dateFrom, tempFilters.dateTo, queryState.status, queryState.dateFrom, queryState.dateTo]);

  const statusOptions = useMemo(
    () => [
      { value: "UNCLAIMED", label: "Unclaimed", color: "bg-gray-500" },
      { value: "CLAIMED", label: "Claimed", color: "bg-green-500" },
      { value: "DISPOSED", label: "Disposed", color: "bg-red-500" },
    ],
    []
  );

  return (
    <div className="space-y-4 w-80">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Filter Lost Items</h4>
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

      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Item Status</Label>
        <Select
          value={tempFilters.status || "all"}
          onValueChange={(value) =>
            setTempFilters({
              ...tempFilters,
              status:
                value === "all"
                  ? null
                  : (value as "UNCLAIMED" | "CLAIMED" | "DISPOSED"),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
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

      {/* Date Range Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Date Found Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">From</Label>
                <DatePicker
                  initialDate={tempFilters.dateFrom || ""}
                  onChange={(date) => {
                    setTempFilters({
                      ...tempFilters,
                      dateFrom: date || null,
                    });
                  }}
                />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">To</Label>
            <DatePicker
              initialDate={tempFilters.dateFrom || ""}
              onChange={(date) => {
                setTempFilters({
                  ...tempFilters,
                  dateTo: date || null,
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      {filterStates.hasActiveFilters && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-1">
            {tempFilters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Status:{" "}
                {
                  statusOptions.find((s) => s.value === tempFilters.status)
                    ?.label
                }
              </span>
            )}
            {tempFilters.dateFrom && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                From: {formatDate(new Date(tempFilters.dateFrom), "MMMM d, yyyy")}
              </span>
            )}
            {tempFilters.dateTo && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                To: {formatDate(new Date(tempFilters.dateTo), "MMMM d, yyyy")}
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
}

function Toolbar({ table: _ }: { table: TableType<LostItem> }) {
  const [queryStates, setQueryStates] = useQueryStates({
    search: parseAsString,
    status: parseAsStringLiteral(["UNCLAIMED", "CLAIMED", "DISPOSED"]),
    dateFrom: parseAsString, // yyyy-mm-dd
    dateTo: parseAsString,   // yyyy-mm-dd
  });

  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between space-x-2 bg-card border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search lost items..."
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
            value={queryStates.search ?? ""}
            onChange={(e) => setQueryStates({ search: e.target.value || null })}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
      </div>

      <div className="flex items-center gap-x-2">
        <div className="flex items-center gap-2">
          <TableFilter
            open={open}
            setOpen={setOpen}
          >
            <LostItemFilter
              queryState={queryStates}
              setQueryState={setQueryStates}
              setOpen={setOpen}
            />
          </TableFilter>

          {/* Applied Filters Display */}
          {(queryStates.status || queryStates.dateFrom || queryStates.dateTo) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {queryStates.status && (
                <div className="flex items-center gap-1">
                  <span>Status:</span>
                  <span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium capitalize">
                    {queryStates.status.toLowerCase()}
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
              {queryStates.dateFrom && (
                <div className="flex items-center gap-1">
                  <span>From:</span>
                  <span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                    {new Date(queryStates.dateFrom).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setQueryStates({ dateFrom: null })}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {queryStates.dateTo && (
                <div className="flex items-center gap-1">
                  <span>To:</span>
                  <span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                    {new Date(queryStates.dateTo).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setQueryStates({ dateTo: null })}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DisplayItemInfo({
  value,
  info,
}: {
  value: string;
  info: CellContext<LostItem, string>;
}) {
  useEffect(() => {
    const img = new Image();
    img.src = info.row.original.imageUrl || "";
  }, [info.row.original.imageUrl]);

  return (
    <Dialog modal>
      <DialogTrigger className="hover:underline cursor-pointer">
        {value}
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold">
              {info.row.original.itemName}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              ID: {info.row.original.customId}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Image */}
            {info.row.original.imageUrl && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Item Photo</h3>
                {/** biome-ignore lint/performance/noImgElement: Fast preload */}
                <img
                  src={info.row.original.imageUrl}
                  alt={info.row.original.itemName}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}

            {/* Item Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Description
                </h3>
                <p className="text-sm">{info.row.original.description}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Found Location
                </h3>
                <p className="text-sm">
                  Room {info.row.original.roomIdentifier}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Date Found
                </h3>
                <p className="text-sm">
                  {new Date(info.row.original.dateFound).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Logged By
                </h3>
                <p className="text-sm">{info.row.original.loggedBy}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Hotel
                </h3>
                <p className="text-sm">{info.row.original.hotelName}</p>
              </div>
            </div>
          </div>

          {/* Claim Status Section */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm text-muted-foreground">
                Status:
              </h3>
              <Badge
                variant={
                  info.row.original.claimStatus === "CLAIMED"
                    ? "green"
                    : info.row.original.claimStatus === "UNCLAIMED"
                    ? "gray"
                    : "red"
                }
                className="capitalize"
              >
                {info.row.original.claimStatus.toLowerCase()}
              </Badge>
            </div>

            {/* Claim Details (if claimed) */}
            {info.row.original.claimStatus === "CLAIMED" && (
              <div className="space-y-2 bg-green-50 p-3 rounded-lg">
                {info.row.original.claimedBy && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Claimed By
                    </h4>
                    <p className="text-sm">{info.row.original.claimedBy}</p>
                  </div>
                )}

                {info.row.original.claimedDate && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Claim Date
                    </h4>
                    <p className="text-sm">
                      {new Date(
                        info.row.original.claimedDate
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}

                {info.row.original.claimNotes && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Claim Notes
                    </h4>
                    <p className="text-sm">{info.row.original.claimNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Created:{" "}
                {new Date(info.row.original.createdAt).toLocaleString()}
              </p>
              <p>
                Last Updated:{" "}
                {new Date(info.row.original.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const columnHelper = createColumnHelper<LostItem>();

const columns = [
  columnHelper.accessor("itemName", {
    header: "Item Name",
    cell: (info) => {
      const value = info.getValue();

      return <DisplayItemInfo value={value} info={info} />;
    },
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("dateFound", {
    header: "Date Found",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("loggedBy", {
    header: "Logged By",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("claimStatus", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      const variant =
        status === "CLAIMED"
          ? "green"
          : status === "UNCLAIMED"
          ? "gray"
          : "red";
      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("claimedBy", {
    header: "Claimed By",
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.display({
    id: "Actions",
    cell: () => {

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <CircleDotDashedIcon />
              Update Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  })
];

function LostItemTable({ table }: { table: TableType<LostItem> }) {
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

export function FrontDeskLostItemStats({
  stats,
}: {
  stats: APIOutput<"@get/api/front-desks/lost-and-found/stats">["data"];
}) {
  const data = [
    {
      label: "Total Items",
      value: stats.totalItems,
      color: "text-green-500 bg-green-500/10",
    },
    {
      label: "Total Claimed Items",
      value: stats.claimedItems,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Total unclaimed Items",
      value: stats.unclaimedItems,
      color: "text-red-500 bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {data.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-primary-5/10 rounded-xl md:rounded-2xl p-3 flex flex-col gap-y-4"
        >
          <div
            className={cn(
              "size-10 rounded-full flex items-center justify-center mb-2",
              stat.color
            )}
          >
            <BedIcon />
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-2xl font-medium">{stat.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LostItemPage({
  data,
  paginationMeta,
}: {
  data: LostItem[];
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
    <div className="space-y-4">
      <Toolbar table={table} />
      <LostItemTable table={table} />
    </div>
  );
}
