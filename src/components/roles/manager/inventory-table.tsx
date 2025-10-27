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
import type {
  InventoryResponse,
  InventoryRestockRequest,
  Pagination,
} from "@/lib/fetch";
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
    category: parseAsStringLiteral([
      "FRONT_DESK",
      "MAINTENANCE",
      "INVENTORY",
      "BAR",
      "KITCHEN",
      "HOUSEKEEPING",
      "MANAGEMENT",
      "OTHER",
    ]),
    unit: parseAsString,
    availability: parseAsString,
    approvalStatus: parseAsStringLiteral(["PENDING", "APPROVED", "REJECTED"]),
    customId: parseAsString,
    itemCustomId: parseAsString,
    searchName: parseAsString,
  });

  // Memoized filter state and handlers
  const filterQueryState = useMemo(
    () => ({
      category: filterStates.category,
      unit: filterStates.unit,
      availability: filterStates.availability,
      approvalStatus: filterStates.approvalStatus,
      customId: filterStates.customId,
      itemCustomId: filterStates.itemCustomId,
    }),
    [
      filterStates.category,
      filterStates.unit,
      filterStates.availability,
      filterStates.approvalStatus,
      filterStates.customId,
      filterStates.itemCustomId,
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

    if (filterStates.category) {
      const categoryLabels = {
        FRONT_DESK: "Front Desk",
        MAINTENANCE: "Maintenance",
        INVENTORY: "Inventory",
        BAR: "Bar",
        KITCHEN: "Kitchen",
        HOUSEKEEPING: "Housekeeping",
        MANAGEMENT: "Management",
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
      const availabilityLabels = {
        AVAILABLE: "Available",
        LOW_IN_STOCK: "Low in Stock",
        OUT_OF_STOCK: "Out of Stock",
      };
      filters.push({
        key: "availability",
        label: "Availability",
        value:
          availabilityLabels[
            filterStates.availability as keyof typeof availabilityLabels
          ] || filterStates.availability,
      });
    }

    if (filterStates.approvalStatus) {
      const statusLabels = {
        PENDING: "Pending",
        APPROVED: "Approved",
        REJECTED: "Rejected",
      };
      filters.push({
        key: "approvalStatus",
        label: "Status",
        value: statusLabels[filterStates.approvalStatus],
      });
    }

    if (filterStates.customId) {
      filters.push({
        key: "customId",
        label: "Item Code",
        value: filterStates.customId,
      });
    }

    if (filterStates.itemCustomId) {
      filters.push({
        key: "itemCustomId",
        label: "Item ID",
        value: filterStates.itemCustomId,
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
            value={filterStates.searchName ?? ""}
            onChange={(e) =>
              setFilterStates((prev) => ({
                ...prev,
                searchName: e.target.value || null,
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

        <TableFilter>
          <InventoryFilter
            queryState={filterQueryState}
            setQueryState={setFilterQueryState}
            setOpen={(_open: boolean) => {}} // TableFilter handles this
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
        LOW_IN_STOCK: "yellow",
        OUT_OF_STOCK: "red",
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

export function ManagerInventoryTable({
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
    category:
      | "FRONT_DESK"
      | "MAINTENANCE"
      | "INVENTORY"
      | "BAR"
      | "KITCHEN"
      | "HOUSEKEEPING"
      | "MANAGEMENT"
      | "OTHER"
      | null;
    unit: string | null;
    availability: string | null;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
    customId: string | null;
    itemCustomId: string | null;
  };
  setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
  const [tempFilters, setTempFilters] = useState({
    category: queryState.category || null,
    unit: queryState.unit || null,
    availability: queryState.availability || null,
    approvalStatus: queryState.approvalStatus || null,
    customId: queryState.customId || null,
    itemCustomId: queryState.itemCustomId || null,
  });

  // Memoized callback functions to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    setQueryState({
      ...queryState,
      category: tempFilters.category,
      unit: tempFilters.unit,
      availability: tempFilters.availability,
      approvalStatus: tempFilters.approvalStatus,
      customId: tempFilters.customId,
      itemCustomId: tempFilters.itemCustomId,
    });
    setOpen(false);
  }, [queryState, tempFilters, setQueryState, setOpen]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      category: null,
      unit: null,
      availability: null,
      approvalStatus: null,
      customId: null,
      itemCustomId: null,
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
      tempFilters.category ||
      tempFilters.unit ||
      tempFilters.availability ||
      tempFilters.approvalStatus ||
      tempFilters.customId ||
      tempFilters.itemCustomId
    );

    const hasAppliedFilters = !!(
      queryState.category ||
      queryState.unit ||
      queryState.availability ||
      queryState.approvalStatus ||
      queryState.customId ||
      queryState.itemCustomId
    );

    const appliedFiltersCount =
      (queryState.category ? 1 : 0) +
      (queryState.unit ? 1 : 0) +
      (queryState.availability ? 1 : 0) +
      (queryState.approvalStatus ? 1 : 0) +
      (queryState.customId ? 1 : 0) +
      (queryState.itemCustomId ? 1 : 0);

    return {
      hasActiveFilters,
      hasAppliedFilters,
      appliedFiltersCount,
    };
  }, [tempFilters, queryState]);

  const categoryOptions = useMemo(
    () => [
      { value: "FRONT_DESK", label: "Front Desk" },
      { value: "MAINTENANCE", label: "Maintenance" },
      { value: "INVENTORY", label: "Inventory" },
      { value: "BAR", label: "Bar" },
      { value: "KITCHEN", label: "Kitchen" },
      { value: "HOUSEKEEPING", label: "Housekeeping" },
      { value: "MANAGEMENT", label: "Management" },
      { value: "OTHER", label: "Other" },
    ],
    []
  );

  const availabilityOptions = useMemo(
    () => [
      { value: "AVAILABLE", label: "Available", color: "bg-green-500" },
      { value: "LOW_IN_STOCK", label: "Low in Stock", color: "bg-yellow-500" },
      { value: "OUT_OF_STOCK", label: "Out of Stock", color: "bg-red-500" },
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
          value={tempFilters.category || "all"}
          onValueChange={(value) =>
            setTempFilters({
              ...tempFilters,
              category:
                value === "all" ? null : (value as typeof tempFilters.category),
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

      {/* Availability Filter (only for inventory section) */}
      {currentSection === "inventory" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Availability</Label>
          <Select
            value={tempFilters.availability || "all"}
            onValueChange={(value) =>
              setTempFilters({
                ...tempFilters,
                availability: value === "all" ? null : value,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Availability</SelectItem>
              {availabilityOptions.map((option) => (
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

      {/* Approval Status Filter (only for restock section) */}
      {currentSection === "restock" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Approval Status</Label>
          <Select
            value={tempFilters.approvalStatus || "all"}
            onValueChange={(value) =>
              setTempFilters({
                ...tempFilters,
                approvalStatus:
                  value === "all"
                    ? null
                    : (value as typeof tempFilters.approvalStatus),
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

      {/* Item Custom ID Filter (only for restock section) */}
      {currentSection === "restock" ? (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Item Custom ID</Label>
          <Input
            placeholder="Enter item custom ID"
            value={tempFilters.itemCustomId || ""}
            onChange={(e) =>
              setTempFilters({
                ...tempFilters,
                itemCustomId: e.target.value || null,
              })
            }
          />
        </div>
      ) : (
        /* Custom ID Filter */
        <div className="space-y-2">
          <Label className="text-sm font-medium">Item Code</Label>
          <Input
            placeholder="Enter item code"
            value={tempFilters.customId || ""}
            onChange={(e) =>
              setTempFilters({
                ...tempFilters,
                customId: e.target.value || null,
              })
            }
          />
        </div>
      )}

      {/* Filter Summary */}
      {filterStates.hasActiveFilters && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-1">
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
                Availability:{" "}
                {
                  availabilityOptions.find(
                    (a) => a.value === tempFilters.availability
                  )?.label
                }
              </span>
            )}
            {tempFilters.approvalStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Status:{" "}
                {
                  approvalStatusOptions.find(
                    (s) => s.value === tempFilters.approvalStatus
                  )?.label
                }
              </span>
            )}
            {tempFilters.customId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Code: {tempFilters.customId}
              </span>
            )}
            {tempFilters.itemCustomId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Item ID: {tempFilters.itemCustomId}
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
