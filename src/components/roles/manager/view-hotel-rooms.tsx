"use client";

import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { atom, useAtom, useSetAtom } from "jotai";
import {
  ArrowLeftIcon,
  CheckIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type ColumnFiltersState,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table as TableType,
} from "@tanstack/table-core";
import { formatCurrency } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { flexRender, useReactTable } from "@tanstack/react-table";
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
import { TableFilter } from "@/components/shared/table-filter";
import type { Pagination, RoomDetails } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { parseAsString, useQueryStates } from "nuqs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiInput, MultiInputTag } from "@/components/ui/multi-input";
import { SuccessDialog } from "@/components/shared/shared-dialogs";
import { addNewRoomToHotel } from "@/lib/manager-actions";

const successDialogAtom = atom({
  show: false,
  message: "",
});

function AddNewRoomDialog() {
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
          <span className="hidden md:inline">Add New Room</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="p-4 rounded-2xl">
        <DialogTitle>New Room</DialogTitle>
        <DialogDescription className="sr-only">
          Fill in the details below to add a new room.
        </DialogDescription>
        <div className="mt-4">
          <SingleRoomForm setOpen={setOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const RoomFormSchema = z.object({
  roomName: z.string().min(2, "Room name must be at least 2 characters"),
  roomType: z.string().min(2, "Room type must be at least 2 characters"),
  roomPrice: z.string().nonempty("Room price is required"),
  roomFacilities: z.string().array().nonempty("Select at least one facility"),
  roomNumber: z.string().nonempty("Room number is required"),
});

function SingleRoomForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { mutate, isPending } = useMutation({
    mutationFn: addNewRoomToHotel,
    onSuccess: async () => {
      setOpen(false);
      form.reset();
      setShowSuccessDialog({
        show: true,
        message: "Room Added successfully",
      });
      window.location.reload();
    },
    onError: (e) => {
      toast.error("Failed to add room", {
        description: e.message,
      });
    },
  });
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(RoomFormSchema),
    defaultValues: {
      roomName: "",
      roomType: "",
      roomPrice: "0",
      roomFacilities: [],
      roomNumber: "0",
    },
    progressive: true,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => mutate({
          roomFacility: data.roomFacilities,
          roomIdentifier: data.roomName,
          // roomPrice: Number(data.roomPrice),
          roomType: data.roomType,
          // roomNo: data.roomNumber,
          roomStatus: "AVAILABLE"
        }))}
      >
        <div className="grid grid-cols-2 gap-x-2">
          <FormField
            name="roomName"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g Deluxe Suite" {...field} />
                </FormControl>
                {/* <FormMessage /> */}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roomNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g 101"
                    min={0}
                    {...field}
                  />
                </FormControl>
                {/* <FormMessage /> */}
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-2">
          <FormField
            control={form.control}
            name="roomType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g Executive" {...field} />
                </FormControl>
                {/* <FormMessage /> */}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="roomPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Price</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g 200" {...field} />
                </FormControl>
                {/* <FormMessage /> */}
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="roomFacilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Facilities</FormLabel>
              <FormControl>
                <MultiInputTag value={field.value} onChange={field.onChange}>
                  <MultiInput
                    placeholder="e.g WiFi, Air Conditioning"
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    disabled={field.disabled}
                  />
                </MultiInputTag>
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
            <span>Add New Room</span>
          )}
        </Button>
      </form>
    </Form>
  );
}

function ListToolbar({ table }: { table: TableType<RoomDetails> }) {
  const [currentFilter, setCurrentFilter] = useState<string>("dateRange");
  const [searchParam, setSearchParam] = useQueryStates({
    search: parseAsString.withDefault(""),
  });
  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div>
        <p className="text-primary md:pl-2">
          All rooms ({table.getRowModel().rows.length})
        </p>
      </div>

      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Hotels"
            value={searchParam.search}
            onChange={(e) =>
              setSearchParam((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
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
                  onClick={() => setCurrentFilter("dateRange")}
                  data-active={currentFilter === "dateRange"}
                >
                  {currentFilter === "dateRange" && <CheckIcon />}
                  <span>Date Range</span>
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  onClick={() => setCurrentFilter("status")}
                  data-active={currentFilter === "status"}
                >
                  {currentFilter === "status" && <CheckIcon />}
                  <span>Status</span>
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  onClick={() => setCurrentFilter("roomType")}
                  data-active={currentFilter === "roomType"}
                >
                  {currentFilter === "roomType" && <CheckIcon />}
                  <span>Room Type</span>
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  className="shadow-none text-xs hover:border-transparent"
                  onClick={() => setCurrentFilter("branchName")}
                  data-active={currentFilter === "branchName"}
                >
                  {currentFilter === "branchName" && <CheckIcon />}
                  <span>Branch Name</span>
                </Button>
              </div>

              <Button
                variant={"link"}
                className="text-blue-600"
                onClick={() => setCurrentFilter("dateRange")}
              >
                Reset
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-x-2">
              <Button
                size={"sm"}
                variant={"outline"}
                data-active
                className="rounded-xl shadow-none border-transparent font-semibold"
                onClick={() => setCurrentFilter("")}
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

        <AddNewRoomDialog />

        <Button size={"sm"} className="rounded-md md:rounded-xl">
          Export
        </Button>
      </div>
    </div>
  );
}

function RoomsListTable({ table }: { table: TableType<RoomDetails> }) {
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

const columnHelper = createColumnHelper<RoomDetails>();

const columns = [
  columnHelper.accessor("roomIdentifier", {
    header: "Room Number",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("roomType", {
    header: "Room Type",
    cell: (info) => (
      <div className="flex items-center justify-center bg-[#fff5da] text-[#1c1c1c] p-2 rounded-md">
        {info.getValue()}
      </div>
    ),
    filterFn: "equalsString",
  }),
  columnHelper.accessor("hotelName", {
    header: "Branch Name",
    cell: (info) => info.getValue(),
    filterFn: "includesString",
  }),
  columnHelper.accessor("roomPrice", {
    header: "Room Price",
    cell: (info) => formatCurrency(info.getValue()),
    filterFn: "equals",
  }),

  columnHelper.accessor("roomFacility", {
    header: "Room Facilities",
    cell: (info) => (
      <div className="flex flex-wrap gap-2">
        {info.getValue().map((facility, i) => (
          <span key={facility}>
            {facility}
            {i < info.getValue().length - 1 ? ", " : "."}
          </span>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor("checkInStatus", {
    header: "Status",
    cell: (info) => {
      const statusToVariant: Record<
        RoomDetails["checkInStatus"],
        BadgeVariant
      > = {
        AVAILABLE: "green",
        RESERVED: "yellow",
        BOOKED: "blue",
        CHECKED_IN: "blue",
        CHECKED_OUT: "secondary",
        BLOCKED: "gray",
        DIRTY: "red",
      };

      const status = info.getValue();
      const statusToLabel = status.replace(/_/g, " ").toLowerCase();
      return (
        <Badge className="capitalize" variant={statusToVariant[status]}>
          {statusToLabel}
        </Badge>
      );
    },
  }),
];

export function ViewRoomsInHotelPage({
  breadcrumbs,
  rooms = [],
  paginationMeta,
}: {
  breadcrumbs: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  rooms: RoomDetails[];
  paginationMeta: Pagination;
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, onPaginationChange] = usePaginationSearchParams();

  const table = useReactTable({
    data: rooms,
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
  const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);
  const setBreadcrumb = useSetAtom(breadcrumbAtom);

  useLayoutEffect(() => {
    setBreadcrumb(breadcrumbs);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumbs]);


  return (
    <div className="h-full w-full p-4 space-y-2 md:space-y-4">
      <Link
        href={"/dashboard/hotels"}
        className="inline-flex items-center gap-x-1 px-3 py-1.5 border-2 border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        <span>Back</span>
      </Link>

      <ListToolbar table={table} />
      <RoomsListTable table={table} />
      <SuccessDialog
        open={successDialogOpen.show}
        setOpenAction={(show) => setSuccessDialogOpen({ ...successDialogOpen, show })}
        message={successDialogOpen.message}
      />
    </div>
  );
}
