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
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Table as TableType } from "@tanstack/react-table";
import {
  EditIcon,
  EyeIcon,
  MessageCircleMoreIcon,
  MoreVerticalIcon,
  PenLineIcon,
  PlusIcon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { SuccessDialog } from "@/components/shared/shared-dialogs";
import type { BookingStatus, Pagination } from "@/lib/fetch";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import type { APIOutput, Prettify } from "@/lib/action-utils";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";

type BookingViewResponse = Prettify<
  APIOutput<"@get/api/front-desks/bookings">["data"]["content"][number]
>;

const successDialogAtom = atom({
  show: false,
  message: "",
});


function ChangeBookingStatus() {
  const setShowSuccessDialog = useSetAtom(successDialogAtom);


  const handleSubmit = () => {
    setShowSuccessDialog({
      show: true,
      message: "Booking status updated",
    });
  };

  return (
    <DialogContent className="p-4 rounded-2xl">
      <DialogTitle>Change booking status</DialogTitle>
      <DialogDescription className="sr-only">

      </DialogDescription>

    </DialogContent>
  );
}

const columnHelper = createColumnHelper<BookingViewResponse>();

const columns = [
  columnHelper.accessor("bookingId", {
    header: "ID",
    cell: (info) => info.getValue(),
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

  columnHelper.accessor("amountPaid", {
    header: "Amount Paid",
    cell: (info) => formatCurrency(info.getValue()),
  }),

  columnHelper.accessor("bookingStatus", {
    header: "Status",
    cell: (info) => {
      const statusToVariant: Record<BookingStatus, BadgeVariant> = {
        AVAILABLE: "outline",
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

  columnHelper.display({
    header: "Duration",
    cell: (info) => {
      const checkInDate = new Date(info.row.original.checkInDate);
      const checkOutDate = new Date(info.row.original.checkOutDate);

      // e.g Sep 03, 2025 - Sep 03, 2025

      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "2-digit",
        year: "numeric",
      };

      const formattedCheckIn = checkInDate.toLocaleDateString(
        undefined,
        options
      );
      const formattedCheckOut = checkOutDate.toLocaleDateString(
        undefined,
        options
      );

      return (
        <span>
          {formattedCheckIn} - {formattedCheckOut}
        </span>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: (info) => {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={"ghost"}>
              <EditIcon />
            </Button>
          </DialogTrigger>

          <ChangeBookingStatus
          />
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
  const [bookingState, setBookingState] = useQueryState(
    "bookingStatus",
    parseAsStringLiteral(["RESERVED", "CHECKED_OUT"])
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
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
        <TableFilter></TableFilter>

        {/* <AddNewHotelDialog /> */}

        <Button size={"sm"} className="rounded-xl">
          <PlusIcon />
          Add Booking
        </Button>
      </div>
    </div>
  );
}

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
