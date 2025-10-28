"use client";

import Link from "next/link";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { useSetAtom, useAtom, atom } from "jotai";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Table as TableType } from "@tanstack/react-table";
import {
  EyeIcon,
  MessageCircleMoreIcon,
  MoreVerticalIcon,
  SearchIcon,
} from "lucide-react";
import { TableFilter } from "@/components/shared/table-filter";
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
import { DataTablePagination } from "@/components/shared/pagination";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  type ExportData,
  ExportDialog,
  SuccessDialog,
} from "@/components/shared/shared-dialogs";
import type {
  BookingStatus,
  BookingViewResponse,
  Pagination,
} from "@/lib/fetch";
import { parseAsStringLiteral, parseAsString, useQueryState, useQueryStates } from "nuqs";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcwIcon } from "lucide-react";

const successDialogAtom = atom({
  show: false,
  message: "",
});


const contactManagerFormSchema = z.object({
  title: z.string().nonempty("Title is required"),
  message: z.string().nonempty("Message is required"),
});

function ContactManagerForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const form = useForm({
    resolver: zodResolver(contactManagerFormSchema),
    defaultValues: {
      title: "",
      message: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof contactManagerFormSchema>) => {
    console.log("Message sent:", data.message);
    setOpen(false);
    setShowSuccessDialog({
      show: true,
      message: "Message delivered",
    });
    form.reset();
  };

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle>Contact Branch Manager</DialogTitle>
      <DialogDescription className="sr-only">
        Fill in the details below to send a message to the branch manager.
      </DialogDescription>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Message Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    className="resize-none"
                    placeholder="Type your message here..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full font-semibold">
            Send Message
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}

const columnHelper = createColumnHelper<BookingViewResponse>();

const columns = [
  columnHelper.display({
    header: "S/N",
    cell: (info) => info.row.index + 1,
  }),
  columnHelper.accessor("guestName", {
    header: "Guest Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("branchName", {
    header: "Branch Name",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("roomType", {
    header: "Room Type",
    cell: (info) => (
      <div className="flex items-center justify-center bg-[#fff5da] text-[#1c1c1c] p-2 rounded-md">
        {info.getValue()}
      </div>
    ),
  }),

  columnHelper.accessor("bookingStatus", {
    header: "Status",
    cell: (info) => {
      const statusToVariant: Record<BookingStatus, BadgeVariant> = {
        // AVAILABLE: "outline",
        CHECKED_IN: "green",
        CHECKED_OUT: "blue",
        RESERVED: "yellow",
        CANCELLED: "destructive",
      };
      const status = info.getValue();
      const normalizedStatus = status.replace(/_/g, " ").toLowerCase();
      return (
        <Badge className="capitalize" variant={statusToVariant[status]}>
          {normalizedStatus}
        </Badge>
      );
    },
  }),

  columnHelper.accessor("checkInDate", {
    header: "Date",
    cell: (info) => {
      const date = new Date(info.getValue());
      const dateString = date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      const timeString = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${dateString} | ${timeString.toLowerCase()}`;
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: (info) => {
      const [open, setOpen] = useState<"contact-manager" | false>(false);

      const dialog = useMemo(() => {
        switch (open) {
          case "contact-manager":
            return <ContactManagerForm setOpen={(open) => setOpen(open ? "contact-manager" : false)} />;
          default:
            return null;
        }
      }, [open]);

      return (
        <Dialog
          open={typeof open === "string"}
          onOpenChange={(isOpen) => {
            if (!isOpen) setOpen(false);
          }}
        >
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white" align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/reports/branch-id/${info.row.original.bookingId}`}
                >
                  <EyeIcon />
                  View branch report
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DialogTrigger className="w-full" onClick={() => setOpen("contact-manager")}>
                  <MessageCircleMoreIcon />
                  Contact Branch Manager
                </DialogTrigger>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {dialog}
        </Dialog>
      );
    },
  }),
];

function BookingList({ table }: { table: TableType<BookingViewResponse> }) {
  return (
    <div className="overflow-hidden rounded-md border">
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
                <p>
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected.
                </p>

                <DataTablePagination table={table} />
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

function BookingsListToolbar({
  table,
}: {
  table: TableType<BookingViewResponse>;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [bookingState, setBookingState] = useQueryState(
    "bookingStatus",
    parseAsStringLiteral(["RESERVED", "CHECKED_OUT"])
  );
  
  // Filter query states
  const [filterStates, setFilterStates] = useQueryStates({
    bookingStatus: parseAsStringLiteral(["CHECKED_IN", "CHECKED_OUT", "RESERVED", "CANCELLED", "AVAILABLE"]),
    roomType: parseAsString,
    search: parseAsString.withDefault(""),
  });
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const setSuccessDialogOpen = useSetAtom(successDialogAtom);

  const handleExport = useCallback(
    async (data: ExportData) => {
      // Handle the export logic here, e.g., sending data to an API
      console.log("Exporting data with the following details:", data);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setExportDialogOpen(false);
      setSuccessDialogOpen({
        show: true,
        message: "Data exported successfully!",
      });
    },
    [setSuccessDialogOpen]
  );

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div className="flex items-center gap-x-2">
        <Button
          size="sm"
          variant="outline"
          data-active={bookingState === null}
          onClick={() => setBookingState(null)}
          className="shadow-none text-xs hover:border-transparent rounded-full"
        >
          All Bookings{" "}
          {bookingState === null &&
            `(${table.getRowCount() * table.getPageCount()})`}
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={bookingState === "RESERVED"}
          onClick={() => setBookingState("RESERVED")}
          className="shadow-none text-xs hover:border-transparent rounded-full"
        >
          Reservations{" "}
          {bookingState === "RESERVED" &&
            `(${table.getFilteredRowModel().rows.length})`}
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={bookingState === "CHECKED_OUT"}
          onClick={() => setBookingState("CHECKED_OUT")}
          className="shadow-none text-xs hover:border-transparent rounded-full"
        >
          Booking history{" "}
          {bookingState === "CHECKED_OUT" &&
            `(${table.getFilteredRowModel().rows.length})`}
        </Button>
      </div>

      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search bookings"
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
            value={filterStates.search}
            onChange={(e) =>
              setFilterStates({ search: e.target.value })
            }
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
        
        {/* Applied Filter Chips */}
        {filterStates.bookingStatus && (
          <Badge
            variant="green"
            className="px-2 py-1 text-xs flex items-center gap-1"
          >
            Status: {filterStates.bookingStatus.replace(/_/g, " ").toLowerCase()}
            <button
              type="button"
              onClick={() => setFilterStates(prev => ({ ...prev, bookingStatus: null }))}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}
        
        {filterStates.roomType && (
          <Badge
            variant="green"
            className="px-2 py-1 text-xs flex items-center gap-1"
          >
            Room Type: {filterStates.roomType}
            <button
              type="button"
              onClick={() => setFilterStates(prev => ({ ...prev, roomType: null }))}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}
        
        <TableFilter
          open={filterOpen}
          setOpen={setFilterOpen}
        >
          <HotelOwnerBookingsFilter
            queryState={{
              bookingStatus: filterStates.bookingStatus,
              roomType: filterStates.roomType,
            }}
            setQueryState={(state) => {
              setFilterStates(prev => ({
                ...prev,
                bookingStatus: state.bookingStatus ?? prev.bookingStatus,
                roomType: state.roomType ?? prev.roomType,
              }));
            }}
            setOpen={setFilterOpen}
          />
        </TableFilter>

        {/* <AddNewHotelDialog /> */}

        <ExportDialog
          open={exportDialogOpen}
          setOpenAction={setExportDialogOpen}
          onSubmitAction={handleExport}
        />
      </div>
    </div>
  );
}

// Hotel Owner Bookings Filter Component
const HotelOwnerBookingsFilter = ({
  queryState,
  setQueryState,
  setOpen,
}: {
  setOpen: (open: boolean) => void;
  queryState: {
    bookingStatus: "CHECKED_IN" | "CHECKED_OUT" | "RESERVED" | "CANCELLED" | "AVAILABLE" | null;
    roomType: string | null;
  };
  setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
  const [tempFilters, setTempFilters] = useState({
    bookingStatus: queryState.bookingStatus || null,
    roomType: queryState.roomType || null,
  });

  // Memoized callback functions to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    setQueryState({
      ...queryState,
      bookingStatus: tempFilters.bookingStatus,
      roomType: tempFilters.roomType,
    });
    setOpen(false);
  }, [queryState, tempFilters.bookingStatus, tempFilters.roomType, setQueryState, setOpen]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      bookingStatus: null,
      roomType: null,
    };
    setTempFilters(clearedFilters);
    setQueryState({
      ...queryState,
      bookingStatus: null,
      roomType: null,
    });
  }, [queryState, setQueryState]);

  // Memoize filter state computations
  const filterStates = useMemo(() => {
    const hasActiveFilters = !!tempFilters.bookingStatus || !!tempFilters.roomType;
    const hasAppliedFilters = !!queryState.bookingStatus || !!queryState.roomType;
    const appliedFiltersCount = 
      (queryState.bookingStatus ? 1 : 0) + 
      (queryState.roomType ? 1 : 0);
    
    return {
      hasActiveFilters,
      hasAppliedFilters,
      appliedFiltersCount,
    };
  }, [tempFilters.bookingStatus, tempFilters.roomType, queryState.bookingStatus, queryState.roomType]);

  const bookingStatusOptions = useMemo(() => [
    { value: "CHECKED_IN", label: "Checked In", color: "bg-green-500" },
    { value: "CHECKED_OUT", label: "Checked Out", color: "bg-blue-500" },
    { value: "RESERVED", label: "Reserved", color: "bg-yellow-500" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-red-500" },
    { value: "AVAILABLE", label: "Available", color: "bg-gray-500" },
  ], []);

  return (
    <div className="space-y-4 w-80">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Filter Bookings</h4>
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

      {/* Booking Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Booking Status</Label>
        <Select
          value={tempFilters.bookingStatus || "all"}
          onValueChange={(value) =>
            setTempFilters({
              ...tempFilters,
              bookingStatus: value === "all" ? null : (value as typeof tempFilters.bookingStatus),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {bookingStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 ${option.color} rounded-full`}></div>
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Room Type Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Room Type</Label>
        <Input
          placeholder="Enter room type (e.g., Standard, Deluxe)"
          value={tempFilters.roomType || ""}
          onChange={(e) =>
            setTempFilters({
              ...tempFilters,
              roomType: e.target.value || null,
            })
          }
        />
      </div>

      {/* Filter Summary */}
      {filterStates.hasActiveFilters && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-1">
            {tempFilters.bookingStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Status: {bookingStatusOptions.find(s => s.value === tempFilters.bookingStatus)?.label}
              </span>
            )}
            {tempFilters.roomType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                Room Type: {tempFilters.roomType}
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

export function BookingsPage({
  breadcrumb,
  paginationMeta,
  bookings,
}: {
  bookings: BookingViewResponse[];
  paginationMeta: Pagination;
  breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
}) {
  const [pagination, onPaginationChange] = usePaginationSearchParams();
  const table = useReactTable({
    data: bookings,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange,
    manualPagination: true,
    pageCount: paginationMeta.totalPages,
    state: {
      pagination,
    },
  });
  const setBreadcrumb = useSetAtom(breadcrumbAtom);
  const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

  useEffect(() => {
    setBreadcrumb(breadcrumb);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumb]);

  return (
    <div className="p-4 space-y-2 md:space-y-4">
      <BookingsListToolbar table={table} />
      <BookingList table={table} />
      <SuccessDialog
        open={successDialogOpen.show}
        setOpenAction={(show) =>
          setSuccessDialogOpen({ ...successDialogOpen, show })
        }
        message={successDialogOpen.message}
      />
    </div>
  );
}
