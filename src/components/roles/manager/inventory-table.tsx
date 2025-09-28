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
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
import { CheckIcon, Loader2Icon, PlusIcon, SearchIcon } from "lucide-react";
import {
  parseAsIsoDate,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useMemo, useState } from "react";
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
        description: "Failed to add staff",
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

      console.log(availability, info.row.original);

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
                className="hover:bg-gray-50"
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
              <TableRow
                key={row.id}
                className="hover:bg-gray-50"
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
      />
      {renderedSection}
    </div>
  );
}
