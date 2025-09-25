"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { TableFilter } from "@/components/shared/table-filter";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  InventoryResponse,
  InventoryRestockRequest,
  Pagination,
} from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { cn } from "@/lib/utils";
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
import { CheckIcon, PlusIcon, SearchIcon } from "lucide-react";
import {
  parseAsIsoDate,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";

function InventoryTableToolbar({
  currentSection,
  setCurrentSection,
}: {
  currentSection: "inventory" | "restock";
  setCurrentSection: (value: "inventory" | "restock") => void;
}) {
  const [currentFilter] = useQueryStates({
    dateRange: parseAsIsoDate,
    status: parseAsStringLiteral(["AVAILABLE", "LOW_IN_STOCK", "OUT_OF_STOCK"]),
    roomType: parseAsString,
    branchName: parseAsString,
  });

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div className="flex items-center gap-x-2">
        <Button
          variant={"outline"}
          className={cn(
            "rounded-full shadow-none border-none",
            currentSection === "inventory"
              ? "bg-primary-5/20 text-primary"
              : "bg-gray-100"
          )}
          size={"sm"}
          onClick={() => setCurrentSection("inventory")}
        >
          Inventory
        </Button>
        <Button
          variant={"outline"}
          className={cn("rounded-full shadow-none border-none", {
            "bg-primary-5/20 text-primary": currentSection === "restock",
            "bg-gray-100": currentSection !== "restock",
          })}
          size={"sm"}
          onClick={() => setCurrentSection("restock")}
        >
          Restock Request
          <span className="size-4 text-xs flex items-center justify-center rounded-full bg-red-600 text-white">
            8
          </span>
        </Button>
      </div>

      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 py-2 bg-primary-5/10 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>

        <Button
          variant="secondary"
          className="rounded-md md:rounded-xl"
          size={"sm"}
        >
          <PlusIcon />
          Add Item
        </Button>

        <TableFilter>
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between gap-x-4">
              <div className="flex items-center gap-x-2">
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  data-active={currentFilter.dateRange}
                >
                  {currentFilter.dateRange && <CheckIcon />}
                  <span>Date Range</span>
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  data-active={currentFilter.status}
                >
                  {currentFilter.status && <CheckIcon />}
                  <span>Status</span>
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  data-active={currentFilter.roomType}
                >
                  {currentFilter.roomType && <CheckIcon />}
                  <span>Room Type</span>
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  data-active={currentFilter.branchName}
                >
                  {currentFilter.branchName && <CheckIcon />}
                  <span>Branch Name</span>
                </Button>
              </div>

              <Button variant={"link"} className="text-blue-600">
                Reset
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-x-2">
              <Button
                size={"sm"}
                variant={"outline"}
                data-active
                className="rounded-xl shadow-none border-transparent font-semibold"
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

const allSupplyColumnHelper = createColumnHelper<InventoryResponse>();

const allSupplyColumns = [
  allSupplyColumnHelper.display({
    header: "Item Code",
    cell: (info) => <span>{info.row.original.customId}</span>,
  }),
  allSupplyColumnHelper.accessor("name", {
    header: "Item",
    cell: (info) => <span className="text-foreground">{info.getValue()}</span>,
  }),
  allSupplyColumnHelper.accessor("category", {
    header: "Category",
    cell: (info) => (
      <span className="font-semibold text-foreground">{info.getValue()}</span>
    ),
  }),
  allSupplyColumnHelper.accessor("unit", {
    header: "Item unit",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  allSupplyColumnHelper.accessor("availability", {
    header: "Availability",
    cell: (info) => {
      const availability = info.getValue();

      const variant: Record<string, BadgeVariant> = {
        AVAILABLE: "green",
      };

      return (
        <Badge className="capitalize" variant={variant[availability]}>
          {availability.toLowerCase()}
        </Badge>
      );
    },
  }),
  allSupplyColumnHelper.accessor("quantity", {
    header: "Quantity in stock",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
];

function InventoryTable({ table }: { table: TableType<InventoryResponse> }) {
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
              <TableCell
                colSpan={allSupplyColumns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={allSupplyColumns.length}>
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

function AllSupplySection({ data, paginationMeta }: { data: InventoryResponse[]; paginationMeta: Pagination }) {
  const [pagination, onPaginationChange] = usePaginationSearchParams();
  const table = useReactTable({
    data,
    columns: allSupplyColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
    onPaginationChange,
    state: {
      sorting: [],
      globalFilter: "",
      columnFilters: [],
      pagination
    },
  });

  return <InventoryTable table={table} />;
}

const inventoryHistoryColumnHelper =
  createColumnHelper<InventoryRestockRequest>();

const inventoryHistoryColumns = [
  inventoryHistoryColumnHelper.display({
    header: "Item Code",
    cell: (info) => <span>{info.row.original.itemCustomId}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("name", {
    header: "Item",
    cell: (info) => <span className="text-foreground">{info.getValue()}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("department", {
    header: "Department",
    cell: (info) => <span>{info.getValue()}</span>,
  }),

  inventoryHistoryColumnHelper.accessor("unit", {
    header: "Item unit",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("quantity", {
    header: "Supply Quantity",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("approvalStatus", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();

      const variant: Record<string, BadgeVariant> = {
        APPROVED: "green",
        PENDING: "yellow",
        REJECTED: "red",
      };

      return (
        <Badge className="capitalize" variant={variant[status]}>
          {status.toLowerCase().replaceAll("_", " ")}
        </Badge>
      );
    },
  }),
  inventoryHistoryColumnHelper.accessor("supplied", {
    header: "Supplied",
    cell: (info) => <span>{info.getValue() ? "Yes" : "No"}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("requestedAt", {
    header: "Requested At",
    cell: (info) => (
      <span>{new Date(info.getValue()).toLocaleDateString()}</span>
    ),
  }),
];

function InventoryHistoryTable({
  table,
}: {
  table: TableType<InventoryRestockRequest>;
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
              <TableCell
                colSpan={inventoryHistoryColumns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={inventoryHistoryColumns.length}>
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

function InventHistorySection({ data, paginationMeta }: { data: InventoryRestockRequest[]; paginationMeta: Pagination }) {
  const [pagination, onPaginationChange] = usePaginationSearchParams();
  const table = useReactTable({
    data,
    columns: inventoryHistoryColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
    onPaginationChange,
    state: {
      sorting: [],
      globalFilter: "",
      columnFilters: [],
      pagination
    },
  });

  return <InventoryHistoryTable table={table} />;
}

export function ManagerInventoryTable({
  data,
  paginationMeta,
}: {
  data: InventoryResponse[] | InventoryRestockRequest[];
  paginationMeta: Pagination;
}) {
  const [currentSection, setCurrentSection] = useQueryState(
    "section",
    parseAsStringLiteral(["inventory", "restock"]).withDefault("inventory")
  );

  return (
    <div className="h-full w-full space-y-2 md:space-y-4">
      <InventoryTableToolbar
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
      />
      {currentSection === "inventory" ? (
        <AllSupplySection
          paginationMeta={paginationMeta}
          data={data as InventoryResponse[]}
        />
      ) : (
        <InventHistorySection
          paginationMeta={paginationMeta}
          data={data as InventoryRestockRequest[]}
        />
      )}
    </div>
  );
}
