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
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Table as TableType } from "@tanstack/react-table";
import {
  BanIcon,
  DoorOpenIcon,
  EyeIcon,
  MessageCircleMoreIcon,
  MoreVerticalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  SuccessDialog,
} from "@/components/shared/shared-dialogs";
import type { BookingStatus, ManagerBookingViewResponse } from "@/lib/fetch";
import { formatCurrency } from "@/lib/utils";

const successDialogAtom = atom({
  show: false,
  message: "",
});


const columnHelper = createColumnHelper<ManagerBookingViewResponse>();

const columns = [
  columnHelper.accessor("customId", {
    header: "Booking ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("guestName", {
    header: "Guest Name",
    cell: (info) => info.getValue(),
  }),

  // columnHelper.accessor("branchName", {
  //   header: "Branch Name",
  //   cell: (info) => info.getValue(),
  // }),


  columnHelper.accessor("amountPaid", {
    header: "Amount Paid",
    cell: (info) => formatCurrency(info.getValue()),
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
    header: "Check In",
    cell: (info) => {
      const date = new Date(info.getValue());
      const dateString = date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      return <span>{dateString}</span>;
    },
  }),

  columnHelper.accessor("checkOutDate", {
    header: "Check Out",
    cell: (info) => {
      const date = new Date(info.getValue());
      const dateString = date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      return <span>{dateString}</span>;
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: (info) => {
      const [open, setOpen] = useState<"" | false>(false);

      const dialog = useMemo(() => {
        switch (open) {
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
                  href={`/reports/branch-id/${info.row.original.id}`}
                >
                  <EyeIcon />
                  View branch report
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DialogTrigger className="w-full" onClick={() => setOpen("")}>
                  <DoorOpenIcon />
                  Edit room
                </DialogTrigger>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DialogTrigger className="w-full" onClick={() => setOpen("")}>
                  <BanIcon />
                  Block Room
                </DialogTrigger>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DialogTrigger className="w-full" onClick={() => setOpen("")}>
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

function BookingList({ table }: { table: TableType<ManagerBookingViewResponse> }) {
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
      </Table>
    </div>
  );
}

export function BookingsData({
  breadcrumb,
  bookings,
}: {
  bookings: ManagerBookingViewResponse[];
  breadcrumb: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
}) {
  const table = useReactTable({
    data: bookings,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const setBreadcrumb = useSetAtom(breadcrumbAtom);
  const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

  useEffect(() => {
    setBreadcrumb(breadcrumb);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumb]);

  return (
    <>
      <BookingList table={table} />
      <SuccessDialog
        open={successDialogOpen.show}
        setOpenAction={(show) => setSuccessDialogOpen({ ...successDialogOpen, show })}
        message={successDialogOpen.message}
      />
    </>
  );
}
