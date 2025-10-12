"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryResponse, Pagination } from "@/lib/fetch";
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
import { EditIcon, MoreVerticalIcon, Trash2Icon } from "lucide-react";

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
    cell: (info) => <span>{info.getValue() || "N/A"}</span>,
  }),
  allSupplyColumnHelper.accessor("availability", {
    header: "Availability",
    cell: (info) => {
      const availability = info.getValue();

      const variant: Record<string, BadgeVariant> = {
        AVAILABLE: "blue",
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
  allSupplyColumnHelper.display({
    id: "actions",
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>
              <EditIcon /> Adjust Inventory
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2Icon /> Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
];

function InventoryTable({
  table,
  showFooter = false,
}: {
  table: TableType<InventoryResponse>;
  showFooter?: boolean;
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
                colSpan={allSupplyColumns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        {showFooter && (
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
        )}
      </Table>
    </div>
  );
}

function AllSupplySection({ data }: { data: InventoryResponse[] }) {
  const table = useReactTable({
    data,
    columns: allSupplyColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return <InventoryTable table={table} />;
}

export function InventoryOfficerInventoryTable({
  data,
}: {
  data: InventoryResponse[];
  paginationMeta: Pagination;
}) {
  return <AllSupplySection data={data as InventoryResponse[]} />;
}
