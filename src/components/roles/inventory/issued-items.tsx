"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryProductResponse, Pagination } from "@/lib/fetch";
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
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const issuedItemsColumnHelper = createColumnHelper<InventoryProductResponse>();

const issuedItemsColumns = [
  issuedItemsColumnHelper.accessor("name", {
    header: "Item",
    cell: (info) => (
      <div className="flex flex-col">
        <span className="text-foreground font-medium">{info.getValue()}</span>
        <span className="text-xs text-muted-foreground">
          {info.row.original.sku}
        </span>
      </div>
    ),
  }),
  issuedItemsColumnHelper.accessor("category", {
    header: "Category",
    cell: (info) => (
      <span className="capitalize font-medium text-foreground">
        {info.getValue()?.replace(/_/g, " ").toLowerCase() || "N/A"}
      </span>
    ),
  }),
  issuedItemsColumnHelper.accessor("currentStockOnHand", {
    header: "Stock On Hand",
    cell: (info) => (
      <div className="flex items-center gap-1">
        <span>{info.getValue()}</span>
        <span className="text-xs text-muted-foreground">
          {info.row.original.baseUnit}
        </span>
      </div>
    ),
  }),
  issuedItemsColumnHelper.accessor("sellingPrice", {
    header: "Price",
    cell: (info) => {
      const value = info.getValue();
      return value ? (
        <span>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(value)}
        </span>
      ) : (
        "N/A"
      );
    },
  }),
  issuedItemsColumnHelper.accessor("status", {
    header: "Status",
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
  }),
  issuedItemsColumnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
              <span className="sr-only">View details</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{product.name}</SheetTitle>
              <SheetDescription>Product Details and Information</SheetDescription>
            </SheetHeader>
            <div className="px-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">SKU</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Category</span>
                    <span className="capitalize">
                      {product.category?.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Brand</span>
                    <span className="font-medium">{product.brand || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      Manufacturer
                    </span>
                    <span className="font-medium">
                      {product.manufacturer || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Stock Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">
                      Current Stock
                    </span>
                    <span className="font-medium">
                      {product.currentStockOnHand} {product.baseUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      Available Stock
                    </span>
                    <span className="font-medium">
                      {product.currentStockAvailable} {product.baseUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      Reorder Level
                    </span>
                    <span className="font-medium">
                      {product.reorderLevel || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      Reorder Quantity
                    </span>
                    <span className="font-medium">
                      {product.reorderQuantity || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Pricing
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">
                      Selling Price
                    </span>
                    <span className="font-medium">
                      {product.sellingPrice
                        ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(product.sellingPrice)
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      Standard Cost
                    </span>
                    <span className="font-medium">
                      {product.standardCost
                        ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(product.standardCost)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Storage */}
              {(product.storageRequirements ||
                product.temperatureMin !== undefined ||
                product.temperatureMax !== undefined) && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Storage Requirements
                    </h4>
                    <div className="text-sm space-y-2">
                      {product.storageRequirements && (
                        <div>
                          <span className="text-muted-foreground block">
                            Requirements
                          </span>
                          <span>{product.storageRequirements}</span>
                        </div>
                      )}
                      {(product.temperatureMin !== undefined ||
                        product.temperatureMax !== undefined) && (
                          <div>
                            <span className="text-muted-foreground block">
                              Temperature Range
                            </span>
                            <span>
                              {product.temperatureMin ?? "?"}° -{" "}
                              {product.temperatureMax ?? "?"}°
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                )}
            </div>
          </SheetContent>
        </Sheet>
      );
    },
  }),
];

function InventoryTable({
  table,
}: {
  table: TableType<InventoryProductResponse>;
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
                colSpan={issuedItemsColumns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={issuedItemsColumns.length}>
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

function IssuedItemsSection({
  data,
  paginationMeta,
}: {
  data: InventoryProductResponse[];
  paginationMeta: Pagination;
}) {
  const [pagination, onPaginationChange] = usePaginationSearchParams();
  const table = useReactTable({
    data,
    columns: issuedItemsColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
    state: {
      pagination,
    },
    onPaginationChange,
  });

  return <InventoryTable table={table} />;
}

export function IssuedItemsTable({
  data,
  paginationMeta,
}: {
  data: InventoryProductResponse[];
  paginationMeta: Pagination;
}) {
  return (
    <IssuedItemsSection
      data={data as InventoryProductResponse[]}
      paginationMeta={paginationMeta}
    />
  );
}
