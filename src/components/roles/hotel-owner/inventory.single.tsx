"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import type { InventoryResponse, Pagination } from "@/lib/fetch";
import {
  SearchIcon,
  ArrowLeftIcon,
  RotateCcwIcon,
} from "lucide-react";
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
import { useCallback, useMemo, useState } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
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
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQueryStates, parseAsString, parseAsStringLiteral } from "nuqs";

// Hotel Owner Inventory Filter Component
const HotelOwnerInventoryFilter = ({
  queryState,
  setQueryState,
  setOpen,
}: {
  setOpen: (open: boolean) => void;
  queryState: {
    searchName: string | null;
    customId: string | null;
    category:
      | "BAR"
      | "KITCHEN"
      | "HOUSEKEEPING"
      | "FRONT_DESK"
      | "MAINTENANCE"
      | "MANAGEMENT"
      | "INVENTORY"
      | "OTHER"
      | null;
    unit: string | null;
    availability: string | null;
  };
  setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
  const [tempFilters, setTempFilters] = useState({
    searchName: queryState.searchName || null,
    customId: queryState.customId || null,
    category: queryState.category || null,
    unit: queryState.unit || null,
    availability: queryState.availability || null,
  });

  // Memoized callback functions to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    setQueryState({
      ...queryState,
      searchName: tempFilters.searchName,
      customId: tempFilters.customId,
      category: tempFilters.category,
      unit: tempFilters.unit,
      availability: tempFilters.availability,
    });
    setOpen(false);
  }, [queryState, tempFilters, setQueryState, setOpen]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      searchName: null,
      customId: null,
      category: null,
      unit: null,
      availability: null,
    };
    setTempFilters(clearedFilters);
    setQueryState({
      ...queryState,
      ...clearedFilters,
    });
  }, [queryState, setQueryState]);

  // Memoize filter state computations
  const filterStates = useMemo(() => {
    const hasActiveFilters = !!(
      tempFilters.searchName ||
      tempFilters.customId ||
      tempFilters.category ||
      tempFilters.unit ||
      tempFilters.availability
    );

    const hasAppliedFilters = !!(
      queryState.searchName ||
      queryState.customId ||
      queryState.category ||
      queryState.unit ||
      queryState.availability
    );

    const appliedFiltersCount = [
      queryState.searchName,
      queryState.customId,
      queryState.category,
      queryState.unit,
      queryState.availability,
    ].filter(Boolean).length;

    return {
      hasActiveFilters,
      hasAppliedFilters,
      appliedFiltersCount,
    };
  }, [tempFilters, queryState]);

  const categoryOptions = useMemo(
    () => [
      { value: "BAR", label: "Bar" },
      { value: "KITCHEN", label: "Kitchen" },
      { value: "HOUSEKEEPING", label: "Housekeeping" },
      { value: "FRONT_DESK", label: "Front Desk" },
      { value: "MAINTENANCE", label: "Maintenance" },
      { value: "MANAGEMENT", label: "Management" },
      { value: "INVENTORY", label: "Inventory" },
      { value: "OTHER", label: "Other" },
    ],
    []
  );

  return (
    <div className="space-y-4 w-96">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Filter Inventory</h4>
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

      {/* Filter Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Search Name Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search Name</Label>
          <Input
            placeholder="Enter search term"
            value={tempFilters.searchName || ""}
            onChange={(e) =>
              setTempFilters({
                ...tempFilters,
                searchName: e.target.value || null,
              })
            }
          />
        </div>

        {/* Custom ID Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Custom ID</Label>
          <Input
            placeholder="Enter custom ID"
            value={tempFilters.customId || ""}
            onChange={(e) =>
              setTempFilters({
                ...tempFilters,
                customId: e.target.value || null,
              })
            }
          />
        </div>

        {/* Category Filter - spans full width */}
        <div className="space-y-2 col-span-2">
          <Label className="text-sm font-medium">Category</Label>
          <Select
            value={tempFilters.category || "all"}
            onValueChange={(value) =>
              setTempFilters({
                ...tempFilters,
                category:
                  value === "all"
                    ? null
                    : (value as typeof tempFilters.category),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Unit Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Unit</Label>
          <Input
            placeholder="Enter unit (e.g., pieces, kg)"
            value={tempFilters.unit || ""}
            onChange={(e) =>
              setTempFilters({
                ...tempFilters,
                unit: e.target.value || null,
              })
            }
          />
        </div>

        {/* Availability Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Availability</Label>
          <Input
            placeholder="Enter availability status"
            value={tempFilters.availability || ""}
            onChange={(e) =>
              setTempFilters({
                ...tempFilters,
                availability: e.target.value || null,
              })
            }
          />
        </div>
      </div>

      {/* Filter Summary */}
      {filterStates.hasActiveFilters && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-1">
            {tempFilters.searchName && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Search: {tempFilters.searchName}
              </span>
            )}
            {tempFilters.customId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                ID: {tempFilters.customId}
              </span>
            )}
            {tempFilters.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Category:{" "}
                {
                  categoryOptions.find((c) => c.value === tempFilters.category)
                    ?.label
                }
              </span>
            )}
            {tempFilters.unit && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Unit: {tempFilters.unit}
              </span>
            )}
            {tempFilters.availability && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Availability: {tempFilters.availability}
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

function ListToolbar() {
  const router = useRouter();
  const pageParams = useParams();
  const searchParams = useSearchParams();

  const currentSection = useMemo(() => {
    return (searchParams.get("section") || "all") as "all" | "history";
  }, [searchParams]);

  const setSection = (section: "all" | "history") => {
    const params = new URLSearchParams(searchParams);
    params.set("section", section === "all" ? "all" : "history");
    router.replace(
      `/dashboard/inventory/${pageParams.id}?${params.toString()}`
    );
  };

  // Filter query states
  const [filterStates, setFilterStates] = useQueryStates({
    searchName: parseAsString,
    customId: parseAsString,
    category: parseAsStringLiteral([
      "BAR",
      "KITCHEN",
      "HOUSEKEEPING",
      "FRONT_DESK",
      "MAINTENANCE",
      "MANAGEMENT",
      "INVENTORY",
      "OTHER",
    ]),
    unit: parseAsString,
    availability: parseAsString,
  });

  // Memoized filter state and handlers
  const filterQueryState = useMemo(
    () => ({
      searchName: filterStates.searchName,
      customId: filterStates.customId,
      category: filterStates.category,
      unit: filterStates.unit,
      availability: filterStates.availability,
    }),
    [filterStates]
  );

  const setFilterQueryState = useCallback(
    (state: Partial<typeof filterQueryState>) => {
      setFilterStates((prev) => ({
        ...prev,
        ...state,
      }));
    },
    [setFilterStates]
  );

  // Memoized applied filters for chips
  const appliedFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; value: string }> = [];

    if (filterStates.searchName) {
      filters.push({
        key: "searchName",
        label: "Search",
        value: filterStates.searchName,
      });
    }

    if (filterStates.customId) {
      filters.push({
        key: "customId",
        label: "ID",
        value: filterStates.customId,
      });
    }

    if (filterStates.category) {
      const categoryLabels = {
        BAR: "Bar",
        KITCHEN: "Kitchen",
        HOUSEKEEPING: "Housekeeping",
        FRONT_DESK: "Front Desk",
        MAINTENANCE: "Maintenance",
        MANAGEMENT: "Management",
        INVENTORY: "Inventory",
        OTHER: "Other",
      };
      filters.push({
        key: "category",
        label: "Category",
        value: categoryLabels[filterStates.category],
      });
    }

    if (filterStates.unit) {
      filters.push({
        key: "unit",
        label: "Unit",
        value: filterStates.unit,
      });
    }

    if (filterStates.availability) {
      filters.push({
        key: "availability",
        label: "Availability",
        value: filterStates.availability,
      });
    }

    return filters;
  }, [filterStates]);

  // Handler to remove individual filters
  const removeFilter = useCallback(
    (key: string) => {
      setFilterStates((prev) => ({
        ...prev,
        [key]: null,
      }));
    },
    [setFilterStates]
  );

  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div className="flex items-center gap-x-2">
        <Button
          variant={"outline"}
          onClick={() => setSection("all")}
          className={cn(
            "rounded-full shadow-none border-none",
            currentSection === "all"
              ? "bg-primary-5/20 text-primary"
              : "bg-gray-100"
          )}
          size={"sm"}
        >
          All Item
        </Button>
        <Button
          variant={"outline"}
          onClick={() => setSection("history")}
          className={cn("rounded-full shadow-none border-none", {
            "bg-primary-5/20 text-primary": currentSection === "history",
            "bg-gray-100": currentSection !== "history",
          })}
          size={"sm"}
        >
          Supply History
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

        <TableFilter open={filterOpen} setOpen={setFilterOpen}>
          <HotelOwnerInventoryFilter
            queryState={filterQueryState}
            setQueryState={setFilterQueryState}
            setOpen={setFilterOpen}
          />
        </TableFilter>

        <div className="flex items-center gap-x-2 ">
          {/* Applied Filter Chips */}
          {appliedFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="green"
              className="px-2 py-1 text-xs flex items-center gap-1"
            >
              {filter.label}: {filter.value}
              <button
                type="button"
                onClick={() => removeFilter(filter.key)}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>

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
  data: InventoryResponse[];
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

  return <InventoryTable table={table} />;
}

type InventoryHistoryResponse = InventoryResponse & {
  supplyDate: string;
  supplier: string;
  supplyQuantity: number;
};

const inventoryHistoryColumnHelper =
  createColumnHelper<InventoryHistoryResponse>();

const inventoryHistoryColumns = [
  inventoryHistoryColumnHelper.display({
    header: "Item Code",
    cell: (info) => <span>{info.row.original.customId}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("name", {
    header: "Item",
    cell: (info) => <span className="text-foreground">{info.getValue()}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("supplier", {
    header: "Supplier",
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
  inventoryHistoryColumnHelper.accessor("supplyDate", {
    header: "Supply Date",
    cell: (info) => (
      <span>{new Date(info.getValue()).toLocaleDateString()}</span>
    ),
  }),
];

function InventoryHistoryTable({
  table,
}: {
  table: TableType<InventoryHistoryResponse>;
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

function InventHistorySection({
  data,
  paginationMeta,
}: {
  data: InventoryHistoryResponse[];
  paginationMeta: Pagination;
}) {
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
      pagination,
    },
  });

  return <InventoryHistoryTable table={table} />;
}

export function SingleInventoryPage({
  data,
  paginationMeta,
}: {
  data: InventoryResponse[];
  paginationMeta: Pagination;
}) {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get("section") || "all";

  return (
    <div className="h-full w-full p-4 space-y-2 md:space-y-4">
      <Link
        href={"/dashboard/inventory"}
        className="inline-flex items-center gap-x-1 px-3 py-1.5 border-2 border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        <span>Back</span>
      </Link>

      <ListToolbar />
      {currentSection === "all" ? (
        <AllSupplySection data={data} paginationMeta={paginationMeta} />
      ) : (
        <InventHistorySection
          data={data as InventoryHistoryResponse[]}
          paginationMeta={paginationMeta}
        />
      )}
    </div>
  );
}
