"use client";

import Link from "next/link";
import { Breadcrumb, breadcrumbAtom } from "@/lib/store";
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
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { type Table as TableType } from "@tanstack/react-table";
import {
  BanIcon,
  DoorOpenIcon,
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
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { RoomBooking } from "@/lib/types";
import {
  ExportData,
  ExportDialog,
  SuccessDialog,
} from "@/components/shared/shared-dialogs";

const successDialogAtom = atom({
  show: false,
  message: "",
});

const tableSectionAtom = atom<"bookings" | "reservations" | "history">(
  "bookings"
);

const columnHelper = createColumnHelper<RoomBooking>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("guestName", {
    header: "Guest Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("roomNumber", {
    header: "Room Number",
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
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const statusToVariant: Record<RoomBooking["status"], BadgeVariant> = {
        available: "green",
        pending: "yellow",
        "checked-in": "blue",
        "checked-out": "gray",
        cancelled: "red",
      };
      const status = info.getValue();
      return (
        <Badge className="capitalize" variant={statusToVariant[status]}>
          {status}
        </Badge>
      );
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white" align="end">
              <DropdownMenuItem asChild>
                <Link href={`/reports/branch-id/${info.row.original.id}`}>
                  <EyeIcon />
                  View branch report
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DialogTrigger className="w-full" onClick={() => setOpen("")}>
                  <DoorOpenIcon />
                  Configure room
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

function BookingList({ table }: { table: TableType<RoomBooking> }) {
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

function BookingsListToolbar({ table }: { table: TableType<RoomBooking> }) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [tableSection, setTableSection] = useAtom(tableSectionAtom);
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
    [setExportDialogOpen, setSuccessDialogOpen]
  );

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div className="flex items-center gap-x-2">
        <Button
          size="sm"
          variant="outline"
          data-active={tableSection === "bookings"}
          onClick={() => setTableSection("bookings")}
          className="shadow-none text-xs hover:border-transparent rounded-full"
        >
          All Bookings ({table.getRowModel().rows.length})
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={tableSection === "reservations"}
          onClick={() => setTableSection("reservations")}
          className="shadow-none text-xs hover:border-transparent rounded-full"
        >
          Reservations
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={tableSection === "history"}
          onClick={() => setTableSection("history")}
          className="shadow-none text-xs hover:border-transparent rounded-full"
        >
          Booking history
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

        <ExportDialog
          open={exportDialogOpen}
          setOpen={setExportDialogOpen}
          onSubmit={handleExport}
        />
      </div>
    </div>
  );
}

export function BookingsPage({
  breadcrumb,
  bookings,
}: {
  bookings: RoomBooking[];
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

  useLayoutEffect(() => {
    setBreadcrumb(breadcrumb);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumb]);

  return (
    <div className="p-4 space-y-2 md:space-y-4">
      <BookingsListToolbar table={table} />
      <BookingList table={table} />
      <SuccessDialog
        open={successDialogOpen.show}
        setOpen={(show) => setSuccessDialogOpen({ ...successDialogOpen, show })}
        message={successDialogOpen.message}
      />
    </div>
  );
}
