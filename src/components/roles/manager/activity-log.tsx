"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { SearchIcon } from "lucide-react";
import { useQueryStates, parseAsString } from "nuqs";
import { useCallback, useLayoutEffect, useState } from "react";
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
import type { ManagerActivityLog, Pagination } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { atom, useSetAtom } from "jotai";
import {
  type ExportData,
  ExportDialog,
} from "@/components/shared/shared-dialogs";

const successDialogAtom = atom({
  show: false,
  message: "",
});

function ListToolbar(_props: { table: TableType<ManagerActivityLog> }) {
  const [searchParam, setSearchParam] = useQueryStates({
    search: parseAsString.withDefault(""),
  });

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const setSuccessDialogOpen = useSetAtom(successDialogAtom);

  const handleExport = useCallback(
    async (data: ExportData) => {
      // Handle the export logic here, e.g., sending data to an API
      console.log("Exporting data with the following details:", data);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setExportDialogOpen(false);
      setSuccessDialogOpen({
        show: true,
        message: "Data exported successfully!",
      });
    },
    [setSuccessDialogOpen]
  );

  return (
    <div className="flex flex-row-reverse items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchParam.search}
            onChange={(e) =>
              setSearchParam((prev) => ({
                ...prev,
                search: e.target.value,
              }))
            }
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>

        <TableFilter></TableFilter>

        <ExportDialog
          open={exportDialogOpen}
          setOpenAction={setExportDialogOpen}
          onSubmitAction={handleExport}
        />
      </div>
    </div>
  );
}

function ActivityLogTable({ table }: { table: TableType<ManagerActivityLog> }) {
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

const columnHelper = createColumnHelper<ManagerActivityLog>();

const columns = [
  columnHelper.accessor("customId", {
    header: "Staff ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("staffName", {
    header: "Staff Name",
    cell: (info) => info.getValue(),
    filterFn: "equalsString",
  }),
  columnHelper.accessor("staffEmail", {
    header: "Staff Email",
    cell: (info) => info.getValue(),
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
  columnHelper.accessor("hotelName", {
    header: "Hotel",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("createdAt", {
    header: "Timestamp",
    cell: (info) =>
      new Date(info.getValue()).toLocaleString(
        Intl.DateTimeFormat().resolvedOptions().locale,
        {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
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
  data: ManagerActivityLog[];
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
