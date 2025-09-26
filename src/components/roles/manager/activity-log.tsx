"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import { SearchIcon, CheckIcon } from "lucide-react";
import { useQueryStates, parseAsString } from "nuqs";
import { useLayoutEffect, useState } from "react";
import {
  type ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Table as TableType,
} from "@tanstack/react-table";
import { DataTablePagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
  Table,
} from "@/components/ui/table";
import type { Pagination } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";

type ActivityLog = {
  staffId: string;
  staffName: string;
  role: string;
  activity: string;
  timestamp: string;
};

function ListToolbar(_props: { table: TableType<ActivityLog> }) {
  const [currentFilter, setCurrentFilter] = useState<string>("dateRange");
  const [searchParam, setSearchParam] = useQueryStates({
    searchName: parseAsString.withDefault(""),
  });
  return (
    <div className="flex flex-row-reverse items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchParam.searchName}
            onChange={(e) =>
              setSearchParam((prev) => ({
                ...prev,
                searchName: e.target.value,
              }))
            }
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>

        <TableFilter>
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between gap-x-4">
              <div className="flex items-center gap-x-2">
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  onClick={() => setCurrentFilter("dateRange")}
                  data-active={currentFilter === "dateRange"}
                >
                  {currentFilter === "dateRange" && <CheckIcon />}
                  <span>Date Range</span>
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  onClick={() => setCurrentFilter("status")}
                  data-active={currentFilter === "status"}
                >
                  {currentFilter === "status" && <CheckIcon />}
                  <span>Status</span>
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  onClick={() => setCurrentFilter("roomType")}
                  data-active={currentFilter === "roomType"}
                >
                  {currentFilter === "roomType" && <CheckIcon />}
                  <span>Room Type</span>
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  onClick={() => setCurrentFilter("branchName")}
                  data-active={currentFilter === "branchName"}
                >
                  {currentFilter === "branchName" && <CheckIcon />}
                  <span>Branch Name</span>
                </Button>
              </div>

              <Button
                variant={"link"}
                className="text-blue-600"
                onClick={() => setCurrentFilter("dateRange")}
              >
                Reset
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-x-2">
              <Button
                size={"sm"}
                variant={"outline"}
                data-active
                className="rounded-xl shadow-none border-transparent font-semibold"
                onClick={() => setCurrentFilter("")}
              >
                <span>Reset All</span>
              </Button>

              <Button
                size={"sm"}
                className="rounded-xl shadow-none font-semibold"
              >
                <span>Apply Filter</span>
              </Button>
            </div>
          </div>
        </TableFilter>

        <Button size={"sm"} className="rounded-md md:rounded-xl">
          Export
        </Button>
      </div>
    </div>
  );
}

function ActivityLogTable({ table }: { table: TableType<ActivityLog> }) {
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
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                tabIndex={-1}
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

const columnHelper = createColumnHelper<ActivityLog>();

const columns = [
  columnHelper.accessor("staffId", {
    header: "Staff ID",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("staffName", {
    header: "Staff Name",
    cell: (info) => (
      <div className="flex items-center justify-center bg-[#fff5da] text-[#1c1c1c] p-2 rounded-md">
        {info.getValue()}
      </div>
    ),
    filterFn: "equalsString",
  }),
  columnHelper.accessor("role", {
    header: "Room Status",
    cell: (info) => {
      const status = info.getValue();
      const statusToLabel = status.replace(/_/g, " ").toLowerCase();
      return <Badge className="capitalize">{statusToLabel}</Badge>;
    },
  }),
  columnHelper.accessor("activity", {
    header: "Activity",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("timestamp", {
    header: "Timestamp",
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
];

export function ManagerActivityLogPage({
  breadcrumbs,
  data = [],
  paginationMeta,
}: {
  breadcrumbs: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  data: ActivityLog[];
  paginationMeta: Pagination;
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, onPaginationChange] = usePaginationSearchParams();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange,
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
    state: {
      columnFilters,
      pagination,
    },
  });
  const setBreadcrumb = useSetAtom(breadcrumbAtom);
  useLayoutEffect(() => {
    setBreadcrumb(breadcrumbs);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumbs]);

  return (
    <div className="h-full w-full p-4 space-y-2 md:space-y-4">
      <ListToolbar table={table} />
      <ActivityLogTable table={table} />
    </div>
  );
}
