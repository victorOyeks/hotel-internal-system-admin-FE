"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { TableFilter } from "@/components/shared/table-filter";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { revalidateRoute } from "@/lib/actions";
import type { Pagination } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RotateCcwIcon } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
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
import { atom, useSetAtom } from "jotai";
import { Loader2Icon, PlusIcon, SearchIcon } from "lucide-react";
import {
  parseAsIsoDate,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import type { APIOutput } from "@/lib/action-utils";
import { DatePicker } from "@/components/shared/date-picker";

export type InventoryResponse =
  APIOutput<"@get/api/restaurants/stock">["data"]["content"][number];
export type InventoryRestockRequest =
  APIOutput<"@get/api/restaurants/bar-restock-requests">["data"]["content"][number];

const successDialogAtom = atom({
  show: false,
  message: "",
});

function _AddNewItemDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-md md:rounded-xl"
        >
          <PlusIcon />
          <span className="hidden md:inline">Add Item</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="p-4 rounded-2xl">
        <DialogTitle>New Item</DialogTitle>
        <DialogDescription className="sr-only">
          Fill in the details below to add a new item.
        </DialogDescription>

        <div className="mt-4">
          <AddItemForm setOpen={setOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const newItemFormSchema = z.object({
  name: z.string().nonempty("Item name is required"),
  category: z.string().nonempty("Category is required"),
  unit: z.string().nonempty("Unit is required"),
  quantity: z
    .number({ error: "Quantity must be a number" })
    .nonnegative("Quantity cannot be negative"),
  itemId: z.string().optional(),
});

function AddItemForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof newItemFormSchema>) => {
      console.log(data);
    },
    onSuccess: async () => {
      setOpen(false);
      form.reset();
      setShowSuccessDialog({
        show: true,
        message: "Item added successfully",
      });
      await queryClient.invalidateQueries({
        exact: true,
        queryKey: ["items"],
      });
      await revalidateRoute("/manager/staff-management");
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Failed to add item",
      });
    },
  });
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(newItemFormSchema),
    defaultValues: {
      name: "",
      category: "",
      unit: "",
      quantity: 1,
    },
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => mutate(data))}
      >
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Category</FormLabel>
              <FormControl>
                <Input placeholder="e.g Electronics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <FormControl>
                <Input placeholder="e.g Pieces" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={() => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g 100"
                  {...form.register("quantity", { valueAsNumber: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="mt-4 w-full font-semibold"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              <span>Adding, please wait...</span>
            </>
          ) : (
            "Add Item"
          )}
        </Button>
      </form>
    </Form>
  );
}

function InventoryTableToolbar({
  currentSection,
  setCurrentSection,
  totalItems,
}: {
  currentSection: "inventory" | "restock";
  setCurrentSection: (value: "inventory" | "restock") => void;
  totalItems: number;
}) {
  // Filter query states matching the schema
  const [filterStates, setFilterStates] = useQueryStates({
    search: parseAsString,
    customId: parseAsString,
    department: parseAsStringLiteral([
      "RESTAURANT",
      "HOUSEKEEPING",
      "FRONT_DESK",
      "MAINTENANCE",
      "MANAGEMENT",
      "INVENTORY",
      "OTHER",
    ]),
    status: parseAsStringLiteral(["APPROVED", "PENDING", "REJECTED"]),
    startDate: parseAsIsoDate,
    endDate: parseAsIsoDate,
  });

  // Memoized filter state and handlers
  const filterQueryState = useMemo(
    () => ({
      department: filterStates.department,
      status: filterStates.status,
      customId: filterStates.customId,
      startDate: filterStates.startDate,
      endDate: filterStates.endDate,
    }),
    [
      filterStates.department,
      filterStates.status,
      filterStates.customId,
      filterStates.startDate,
      filterStates.endDate,
    ]
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

    if (filterStates.department) {
      const departmentLabels = {
        FRONT_DESK: "Front Desk",
        MAINTENANCE: "Maintenance",
        INVENTORY: "Inventory",
        RESTAURANT: "Restaurant",
        HOUSEKEEPING: "Housekeeping",
        MANAGEMENT: "Management",
        OTHER: "Other",
      };
      filters.push({
        key: "department",
        label: "Department",
        value: departmentLabels[filterStates.department],
      });
    }

    if (filterStates.status) {
      const statusLabels = {
        PENDING: "Pending",
        APPROVED: "Approved",
        REJECTED: "Rejected",
      };
      filters.push({
        key: "status",
        label: "Status",
        value: statusLabels[filterStates.status],
      });
    }

    if (filterStates.customId) {
      filters.push({
        key: "customId",
        label: "Item Code",
        value: filterStates.customId,
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
          className={cn(
            "rounded-full shadow-none border-none",
            currentSection === "inventory"
              ? "bg-primary-5/20 text-primary"
              : "bg-gray-100"
          )}
          size={"sm"}
          onClick={() =>
            currentSection !== "inventory" && setCurrentSection("inventory")
          }
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
          onClick={() =>
            currentSection !== "restock" && setCurrentSection("restock")
          }
        >
          Restock Request
          {currentSection === "restock" && (
            <span className="size-4 text-xs flex items-center justify-center rounded-full bg-red-600 text-white">
              {totalItems}
            </span>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={filterStates.search ?? ""}
            onChange={(e) =>
              setFilterStates((prev) => ({
                ...prev,
                search: e.target.value || null,
              }))
            }
            className="w-full pl-9 py-2 bg-primary-5/10 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>

        {/* Applied Filter Chips */}
        {appliedFilters.map((filter) => (
          <Badge
            key={filter.key}
            variant="secondary"
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

        <TableFilter open={filterOpen} setOpen={setFilterOpen}>
          <InventoryFilter
            queryState={filterQueryState}
            setQueryState={setFilterQueryState}
            setOpen={setFilterOpen}
            currentSection={currentSection}
          />
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
  allSupplyColumnHelper.accessor("department", {
    header: "Department",
    cell: (info) => (
      <Badge className="capitalize" variant={"outline"}>
        {info.getValue().toLowerCase()}
      </Badge>
    ),
  }),
  allSupplyColumnHelper.accessor("unit", {
    header: "Item unit",
    cell: (info) => <span>{info.getValue()}</span>,
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

const inventoryHistoryColumnHelper =
  createColumnHelper<InventoryRestockRequest>();

const inventoryHistoryColumns = [
  inventoryHistoryColumnHelper.display({
    header: "Item Code",
    cell: (info) => <span>{info.row.original.barItemCustomId}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("barItemName", {
    header: "Item",
    cell: (info) => <span className="text-foreground">{info.getValue()}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("requestedBy", {
    header: "Requested By",
    cell: (info) => <span>{info.getValue()}</span>,
  }),

  inventoryHistoryColumnHelper.accessor("requestedQuantity", {
    header: "Requested Quantity",
    cell: (info) => <span>{info.getValue()}</span>,
  }),
  inventoryHistoryColumnHelper.accessor("status", {
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
  data: InventoryRestockRequest[];
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

export function RestaurantInventoryTable({
  data,
  section,
  paginationMeta,
}: {
  data: InventoryResponse[] | InventoryRestockRequest[];
  section: "restock" | null;
  paginationMeta: Pagination;
}) {
  const [currentSection, setCurrentSection] = useQueryState(
    "section",
    parseAsStringLiteral(["inventory", "restock"]).withDefault(
      section ?? "inventory"
    )
  );

  const isPending = useMemo(
    () => currentSection !== (section ?? "inventory"),
    [currentSection, section]
  );

  const renderedSection = useMemo(() => {
    if (isPending) {
      return (
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              {Array.from({
                length:
                  section === "restock"
                    ? inventoryHistoryColumns.length
                    : allSupplyColumns.length,
              }).map((_, index) => (
                <TableHead key={index} className="text-gray-500">
                  <Skeleton className="h-4 w-20 animate-pulse" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {Array.from({
              length:
                // use existing data length or 5 rows as placeholder
                data.length > 0 ? data.length : 5,
            }).map((_, rowIndex) => (
              <TableRow
                key={rowIndex}
                className="cursor-pointer hover:bg-gray-50"
              >
                {Array.from({
                  length:
                    section === "restock"
                      ? inventoryHistoryColumns.length
                      : allSupplyColumns.length,
                }).map((_, cellIndex) => (
                  <TableCell key={cellIndex} className="text-gray-600">
                    <Skeleton className="h-4 w-full animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return currentSection === "inventory" ? (
      <AllSupplySection
        paginationMeta={paginationMeta}
        data={data as InventoryResponse[]}
      />
    ) : (
      <InventHistorySection
        paginationMeta={paginationMeta}
        data={data as InventoryRestockRequest[]}
      />
    );
  }, [currentSection, section, isPending, data, paginationMeta]);

  return (
    <div className="h-full w-full space-y-2 md:space-y-4">
      <InventoryTableToolbar
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        totalItems={data.length}
      />
      {renderedSection}
    </div>
  );
}

// Inventory Filter Component
const InventoryFilter = ({
  queryState,
  setQueryState,
  setOpen,
  currentSection,
}: {
  setOpen: (open: boolean) => void;
  currentSection: "inventory" | "restock";
  queryState: {
    department:
      | "FRONT_DESK"
      | "MAINTENANCE"
      | "INVENTORY"
      | "RESTAURANT"
      | "HOUSEKEEPING"
      | "MANAGEMENT"
      | "OTHER"
      | null;
    status: "PENDING" | "APPROVED" | "REJECTED" | null;
    customId: string | null;
    startDate: Date | null;
    endDate: Date | null;
  };
  setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
  const [tempFilters, setTempFilters] = useState({
    department: queryState.department || null,
    status: queryState.status || null,
    customId: queryState.customId || null,
    startDate: queryState.startDate || null,
    endDate: queryState.endDate || null,
  });

  // Memoized callback functions to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    setQueryState({
      ...queryState,
      department: tempFilters.department,
      status: tempFilters.status,
      customId: tempFilters.customId,
      startDate: tempFilters.startDate,
      endDate: tempFilters.endDate,
    });
    setOpen(false);
  }, [queryState, tempFilters, setQueryState, setOpen]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      department: null,
      status: null,
      customId: null,
      startDate: null,
      endDate: null,
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
      tempFilters.department ||
      tempFilters.status ||
      tempFilters.customId ||
      tempFilters.startDate ||
      tempFilters.endDate
    );

    const hasAppliedFilters = !!(
      queryState.department ||
      queryState.status ||
      queryState.customId ||
      queryState.startDate ||
      queryState.endDate
    );

    const appliedFiltersCount =
      (queryState.department ? 1 : 0) +
      (queryState.status ? 1 : 0) +
      (queryState.customId ? 1 : 0) +
      (queryState.startDate ? 1 : 0) +
      (queryState.endDate ? 1 : 0);

    return {
      hasActiveFilters,
      hasAppliedFilters,
      appliedFiltersCount,
    };
  }, [tempFilters, queryState]);

  const departmentOptions = useMemo(
    () => [
      { value: "FRONT_DESK", label: "Front Desk" },
      { value: "MAINTENANCE", label: "Maintenance" },
      { value: "INVENTORY", label: "Inventory" },
      { value: "RESTAURANT", label: "Restaurant" },
      { value: "HOUSEKEEPING", label: "Housekeeping" },
      { value: "MANAGEMENT", label: "Management" },
      { value: "OTHER", label: "Other" },
    ],
    []
  );

  const approvalStatusOptions = useMemo(
    () => [
      { value: "PENDING", label: "Pending", color: "bg-yellow-500" },
      { value: "APPROVED", label: "Approved", color: "bg-green-500" },
      { value: "REJECTED", label: "Rejected", color: "bg-red-500" },
    ],
    []
  );

  return (
    <div className="space-y-4 w-80">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">
          Filter{" "}
          {currentSection === "restock" ? "Restock Requests" : "Inventory"}
        </h4>
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

      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Category</Label>
        <Select
          value={tempFilters.department || "all"}
          onValueChange={(value) =>
            setTempFilters({
              ...tempFilters,
              department:
                value === "all"
                  ? null
                  : (value as typeof tempFilters.department),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departmentOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Approval Status Filter (only for restock section) */}
      {currentSection === "restock" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Approval Status</Label>
          <Select
            value={tempFilters.status || "all"}
            onValueChange={(value) =>
              setTempFilters({
                ...tempFilters,
                status:
                  value === "all" ? null : (value as typeof tempFilters.status),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {approvalStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 ${option.color} rounded-full`}
                    ></div>
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date Filters for Inventory section */}
      {currentSection === "inventory" && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Start Date</Label>
            <DatePicker
              initialDate={
                tempFilters.startDate
                  ? tempFilters.startDate.toDateString()
                  : ""
              }
              onChange={(date) =>
                setTempFilters({ ...tempFilters, startDate: new Date(date) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">End Date</Label>
            <DatePicker
              initialDate={
                tempFilters.endDate ? tempFilters.endDate.toDateString() : ""
              }
              onChange={(date) =>
                setTempFilters({ ...tempFilters, endDate: new Date(date) })
              }
            />
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {filterStates.hasActiveFilters && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-1">
            {tempFilters.department && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Department:{" "}
                {
                  departmentOptions.find(
                    (c) => c.value === tempFilters.department
                  )?.label
                }
              </span>
            )}
            {tempFilters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Status:{" "}
                {
                  approvalStatusOptions.find(
                    (s) => s.value === tempFilters.status
                  )?.label
                }
              </span>
            )}
            {tempFilters.customId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Code: {tempFilters.customId}
              </span>
            )}
            {tempFilters.startDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                From: {tempFilters.startDate.toLocaleDateString()}
              </span>
            )}
            {tempFilters.endDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                To: {tempFilters.endDate.toLocaleDateString()}
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
