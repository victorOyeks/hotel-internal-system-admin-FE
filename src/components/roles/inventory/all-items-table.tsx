"use client";

import { DataTablePagination } from "@/components/shared/pagination";
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

const allSupplyColumnHelper = createColumnHelper<InventoryProductResponse>();

const allSupplyColumns = [
  allSupplyColumnHelper.accessor("sku", {
    header: "Item Code",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  allSupplyColumnHelper.accessor("name", {
    header: "Item",
    cell: (info) => <span className="text-foreground">{info.getValue()}</span>,
  }),
  allSupplyColumnHelper.accessor("category", {
    header: "Category",
    cell: (info) => (
      <span className="font-semibold text-foreground capitalize">
        {info.getValue()?.replace(/_/g, " ").toLowerCase() || "N/A"}
      </span>
    ),
  }),
  allSupplyColumnHelper.accessor("baseUnit", {
    header: "Item unit",
    cell: (info) => <span>{info.getValue() || "N/A"}</span>,
  }),
  allSupplyColumnHelper.accessor("status", {
    header: "Availability",
    cell: (info) => (
      <Badge variant="outline" className="capitalize">
        {info.getValue()?.replace(/_/g, " ").toLowerCase() || "N/A"}
      </Badge>
    ),
  }),
  allSupplyColumnHelper.accessor("currentStockOnHand", {
    header: "Quantity in stock",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  allSupplyColumnHelper.display({
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

function AllSupplySection({
  data,
  paginationMeta,
}: {
  data: InventoryProductResponse[];
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
    state: {
      pagination,
    },
    onPaginationChange,
  });

  return <InventoryTable table={table} />;
}

export function AllItemsTable({
  data,
  paginationMeta,
}: {
  data: InventoryProductResponse[];
  paginationMeta: Pagination;
}) {
  return (
    <AllSupplySection
      data={data as InventoryProductResponse[]}
      paginationMeta={paginationMeta}
    />
  );
}
