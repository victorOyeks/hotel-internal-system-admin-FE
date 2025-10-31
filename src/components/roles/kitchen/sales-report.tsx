"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { TableFilter } from "@/components/shared/table-filter";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { SearchIcon } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import type { APIOutput } from "@/lib/action-utils";
import { formatCurrency } from "@/lib/utils";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import type { Pagination } from "@/lib/fetch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type BarSale =
  APIOutput<"@get/api/restaurants/bar-sales">["data"]["content"][number];

function Toolbar() {
  const [searchParam, setSearchParam] = useQueryStates({
    search: parseAsString,
  });

  return (
    <div className="flex items-center justify-between space-x-2 bg-card border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-2xl">
      <div className="flex items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchParam.search ?? ""}
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
      </div>

      <TableFilter></TableFilter>
    </div>
  );
}

function OrderDetail({
  order,
  onOpenChange,
  open,
}: {
  order: BarSale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader className="space-y-2 pb-3">
          <SheetTitle className="text-xl font-semibold">
            Order #{order.customId}
          </SheetTitle>
          <SheetDescription className="text-base">
            Delivered to{" "}
            <span className="font-medium">{order.destination}</span> on{" "}
            <span className="font-medium">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="max-h-screen pb-6">
          <div className="space-y-4 px-2">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Total Amount
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Items Count
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {order.orderItems.length} item
                  {order.orderItems.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Order Note (if exists) */}
            {order.note && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Order Note
                </h4>
                <p className="text-sm text-blue-700">{order.note}</p>
              </div>
            )}

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Order Items ({order.orderItems.length})
              </h3>

              <div className="space-y-3">
                {order.orderItems.map((item, index) => (
                  <div
                    key={`${item.itemName}-${index}`}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-base">
                          {item.itemName}
                        </h4>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Qty:</span>
                            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Unit Price:
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(item.total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.quantity} × {formatCurrency(item.price)}
                        </div>
                      </div>
                    </div>

                    {/* Item Note (if exists) */}
                    {item.note && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <span className="text-xs font-medium text-yellow-800">
                            Note:{" "}
                          </span>
                          <span className="text-xs text-yellow-700">
                            {item.note}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Footer */}
            <div className="border-t pt-4 mt-6">
              <div className="bg-gray-900 text-white p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Grand Total</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Total quantity:{" "}
                  {order.orderItems.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )}{" "}
                  items
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

const columnHelper = createColumnHelper<BarSale>();

const allSupplyColumns = [
  columnHelper.display({
    id: "no",
    header: "Item code",
    cell: (info) => info.row.original.customId,
  }),
  columnHelper.accessor("destination", {
    header: "Destination",
    cell: (info) => info.getValue(),
  }),
  columnHelper.display({
    id: "quantity",
    header: "Quantity",
    cell: (info) =>
      info.row.original.orderItems.reduce(
        (acc, item) => acc + item.quantity,
        0
      ),
  }),
  columnHelper.display({
    id: "totalPrice",
    header: "Total Price",
    cell: (info) => {
      const total = info.row.original.orderItems.reduce(
        (acc, item) => acc + item.total,
        0
      );
      return formatCurrency(total);
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Date",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

function InventoryTable({
  data,
  paginationMeta,
}: {
  data: BarSale[];
  paginationMeta: Pagination;
}) {
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
      pagination,
    },
  });

  const [orderDetailState, setOrderDetailState] = useState<{
    open: boolean;
    order: BarSale | null;
  }>({ open: false, order: null });

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
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setOrderDetailState({ open: true, order: row.original });
                }}
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
      {orderDetailState.order && (
        <OrderDetail
          key={orderDetailState.order.id}
          order={orderDetailState.order!}
          open={orderDetailState.open}
          onOpenChange={(open) =>
            setOrderDetailState((prev) => ({ ...prev, open }))
          }
        />
      )}
    </div>
  );
}

export function KitchenSalesReportPage({
  data,
  paginationMeta,
}: {
  data: BarSale[];
  paginationMeta: Pagination;
}) {
  return (
    <div className="space-y-4 px-2">
      <Toolbar />
      <InventoryTable data={data} paginationMeta={paginationMeta} />
    </div>
  );
}
