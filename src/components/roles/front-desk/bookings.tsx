"use client";

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
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Table as TableType } from "@tanstack/react-table";
import {
  EditIcon,
  PlusIcon,
  SearchIcon,
  CheckIcon,
  XIcon,
  CalendarIcon,
  UserIcon,
  Loader2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
} from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { SuccessDialog } from "@/components/shared/shared-dialogs";
import type { BookingStatus, Pagination, RoomDetails } from "@/lib/fetch";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { cn, formatCurrency } from "@/lib/utils";
import type { APIOutput, Prettify } from "@/lib/action-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelReservation,
  checkInGuest,
  checkOutGuest,
} from "@/lib/front-desk-actions";
import { revalidateRoute } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { CheckInForm, ReservationForm } from "./dashboard";
import { TableFilter } from "@/components/shared/table-filter";

type BookingViewResponse = Prettify<
  APIOutput<"@get/api/front-desks/bookings">["data"]["content"][number]
>;

const successDialogAtom = atom({
  show: false,
  message: "",
});

function ChangeBookingStatus({
  booking,
  onClose,
}: {
  booking?: BookingViewResponse;
  onClose?: () => void;
}) {
  const setShowSuccessDialog = useSetAtom(successDialogAtom);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "">("");
  const [notes, setNotes] = useState("");
  const [optionalFields, setOptionalFields] = useState<{
    finalAmountPaid?: number;
  }>({});

  const allStatusOptions: Array<{
    value: BookingStatus;
    label: string;
    description: string;
  }> = [
      {
        value: "RESERVED",
        label: "Reserved",
        description: "Room is reserved for the guest",
      },
      {
        value: "CHECKED_IN",
        label: "Checked In",
        description: "Guest has checked into the room",
      },
      {
        value: "CHECKED_OUT",
        label: "Checked Out",
        description: "Guest has checked out from the room",
      },
      {
        value: "CANCELLED",
        label: "Cancelled",
        description: "Booking has been cancelled",
      },
    ];

  const currentStatus = booking?.bookingStatus;

  // Define valid transitions based on business logic
  // Booking workflow: RESERVED → CHECKED_IN → CHECKED_OUT
  // Cancellation is only allowed from RESERVED status
  // Once CHECKED_OUT or CANCELLED, no further transitions are allowed
  const getValidTransitions = (
    currentStatus: BookingStatus
  ): BookingStatus[] => {
    switch (currentStatus) {
      case "RESERVED":
        // From Reserved: can check in or cancel
        return ["CHECKED_IN", "CANCELLED"];

      case "CHECKED_IN":
        // From Checked In: can only check out (no cancellation once checked in)
        return ["CHECKED_OUT"];

      case "CHECKED_OUT":
        // From Checked Out: no further transitions allowed (final state)
        return [];

      case "CANCELLED":
        // From Cancelled: no further transitions allowed (final state)
        return [];

      // case "AVAILABLE":
      //   // From Available: can be reserved
      //   return ["RESERVED"];

      default:
        return [];
    }
  };

  const validTransitions = currentStatus
    ? getValidTransitions(currentStatus)
    : [];
  const statusOptions = allStatusOptions.filter((option) =>
    validTransitions.includes(option.value)
  );
  const currentStatusLabel =
    statusOptions.find((option) => option.value === currentStatus)?.label ||
    currentStatus?.replaceAll("_", " ").toLowerCase();

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      if (!selectedStatus) return;

      switch (selectedStatus) {
        case "CANCELLED": {
          const response = await cancelReservation({
            roomId: booking?.roomIdentifier!,
          });
          if (!response.success) {
            throw new Error(response.error || "Failed to create reservation.");
          }
          return;
        }
        case "CHECKED_IN": {
          const response = await checkInGuest({
            roomId: booking?.roomIdentifier!,
            amountPaid: booking?.amountPaid!,
            checkInDate: new Date().toISOString(),
            guestName: booking?.guestName!,
            phoneNumber: booking?.guestPhoneNumber!,
            roomStatus: "CHECKED_IN",
          });

          if (!response.success) {
            throw new Error(response.error || "Failed to check in guest.");
          }
          return;
        }
        case "CHECKED_OUT": {
          const response = await checkOutGuest({
            roomId: booking?.roomIdentifier!,
            finalAmountPaid: optionalFields.finalAmountPaid!,
          });

          if (!response.success) {
            throw new Error(response.error || "Failed to check out guest.");
          }
          return;
        }
        default: {
          toast.info("Status update feature coming soon!");
        }
      }
    },
    onSuccess: () => {
      setShowSuccessDialog({
        show: true,
        message: "Booking status updated successfully.",
      });
      onClose?.();
      revalidateRoute("/front-desk/bookings");
    },
    onError: (e) => {
      toast.error("Failed to update booking status.", {
        description: e instanceof Error ? e.message : undefined,
      });
    },
  });

  const getStatusColor = (status: BookingStatus) => {
    const colors = {
      RESERVED: "bg-yellow-100 text-yellow-800 border-yellow-200",
      CHECKED_IN: "bg-green-100 text-green-800 border-green-200",
      CHECKED_OUT: "bg-blue-100 text-blue-800 border-blue-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
      AVAILABLE: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || colors.AVAILABLE;
  };

  return (
    <DialogContent className="p-6 rounded-2xl max-w-md">
      <DialogTitle className="text-xl font-semibold">
        Change Booking Status
      </DialogTitle>
      <DialogDescription className="text-gray-600">
        {statusOptions.length > 0
          ? "Update the status of this booking following the hotel workflow."
          : "View booking details and current status."}
      </DialogDescription>

      <div className="space-y-2">
        {/* Current Booking Info */}
        {booking && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{booking.guestName}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Room {booking.roomType} • ID: {booking.customId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Current Status:</span>
              <span
                className={cn`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(
                  currentStatus!
                )}`}
              >
                {currentStatusLabel}
              </span>
            </div>
          </div>
        )}

        {/* Status Selection */}
        <div className="space-y-3">
          <Label htmlFor="status-select" className="text-sm font-medium">
            New Status
          </Label>
          {statusOptions.length > 0 ? (
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setSelectedStatus(value as BookingStatus)
              }
            >
              <SelectTrigger id="status-select" className="w-full">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
              No status changes available for this booking
            </div>
          )}
        </div>

        {/* Status Change Warning */}
        {selectedStatus && selectedStatus !== currentStatus && (
          <Alert
            variant={
              selectedStatus === "CANCELLED"
                ? "destructive"
                : selectedStatus === "CHECKED_OUT"
                  ? "info"
                  : selectedStatus === "CHECKED_IN"
                    ? "success"
                    : "warning"
            }
          >
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              {selectedStatus === "CANCELLED" &&
                currentStatus === "RESERVED" &&
                "Cancelling this reservation will free up the room for new bookings. This action cannot be undone."}
              {selectedStatus === "CHECKED_OUT" &&
                currentStatus === "CHECKED_IN" &&
                "Checking out will finalize the stay and make the room available for cleaning and new guests."}
              {selectedStatus === "CHECKED_IN" &&
                currentStatus === "RESERVED" &&
                "Checking in will mark the guest as currently occupying the room and start their stay."}
              {selectedStatus === "RESERVED" &&
                "Creating a reservation will hold this room for the guest's arrival."}
            </AlertDescription>
          </Alert>
        )}

        {/* No valid transitions message */}
        {statusOptions.length === 0 && (
          <Alert variant="info">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              {currentStatus === "CHECKED_OUT" &&
                "This booking is completed. No further status changes are available."}
              {currentStatus === "CANCELLED" &&
                "This booking was cancelled. No further status changes are available."}
            </AlertDescription>
          </Alert>
        )}

        {/* Optional field for checkout */}
        {selectedStatus === "CHECKED_OUT" && (
          <div className="space-y-3">
            <Label htmlFor="finalAmountPaid" className="text-sm font-medium">
              Final Amount Paid
            </Label>
            <Input
              id="finalAmountPaid"
              type="number"
              value={optionalFields.finalAmountPaid}
              onChange={(e) =>
                setOptionalFields((prev) => ({
                  ...prev,
                  finalAmountPaid: Number(e.target.value),
                }))
              }
              placeholder="Enter the final amount paid by the guest"
              className="w-full"
            />
          </div>
        )}

        {/* Notes */}
        {statusOptions.length > 0 && selectedStatus === "RESERVED" && (
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isPending}
          >
            <XIcon className="w-4 h-4 mr-2" />
            {statusOptions.length > 0 ? "Cancel" : "Close"}
          </Button>
          {statusOptions.length > 0 && (
            <Button
              onClick={() => mutate()}
              disabled={
                !selectedStatus || selectedStatus === currentStatus || isPending
              }
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
}

const columnHelper = createColumnHelper<BookingViewResponse>();

const columns = [
  columnHelper.accessor("customId", {
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
      const [open, setOpen] = useState(false);

      return (
        <Dialog open={open} onOpenChange={setOpen} modal>
          <DialogTrigger asChild>
            <Button variant={"ghost"} size="sm">
              <EditIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>

          <ChangeBookingStatus
            booking={info.row.original}
            onClose={() => setOpen(false)}
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

function BookingsFilter({
  rooms,
  roomTypes,
  queryState,
  setQueryState,
}: {
  rooms: string[];
  roomTypes: string[];
  queryState: {
    bookingStatus:
    | "RESERVED"
    | "CHECKED_OUT"
    | "CHECKED_IN"
    | "CANCELLED"
    | null;
    search: string | null;
    roomType: string | null;
  };
  setQueryState: (state: Partial<typeof queryState>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    roomType: queryState.roomType,
    bookingStatus: queryState.bookingStatus,
  });

  // Memoize filter state computations
  const filterStates = useMemo(() => {
    const hasActiveFilters = tempFilters.roomType || tempFilters.bookingStatus;
    const hasAppliedFilters = queryState.bookingStatus || queryState.roomType;
    const appliedFiltersCount = [
      queryState.bookingStatus,
      queryState.roomType,
    ].filter(Boolean).length;

    return {
      hasActiveFilters,
      hasAppliedFilters,
      appliedFiltersCount,
    };
  }, [
    tempFilters.roomType,
    tempFilters.bookingStatus,
    queryState.bookingStatus,
    queryState.roomType,
  ]);

  // Memoized callback functions to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    setQueryState({
      ...queryState,
      bookingStatus: tempFilters.bookingStatus,
      roomType: tempFilters.roomType,
    });
    setIsOpen(false);
  }, [
    queryState,
    tempFilters.bookingStatus,
    tempFilters.roomType,
    setQueryState,
  ]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      roomType: null,
      bookingStatus: null,
    };
    setTempFilters(clearedFilters);
    setQueryState({
      search: queryState.search,
      bookingStatus: null,
      roomType: null,
    });
    setIsOpen(false);
  }, [queryState.search, setQueryState]);

  return (
    <TableFilter open={isOpen} setOpen={(open) => setIsOpen(open)}>
      <div className="space-y-4">
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
          <Label className="text-sm font-medium">Status</Label>
          <Select
            value={tempFilters.bookingStatus ?? ""}
            onValueChange={(value) =>
              setTempFilters({
                ...tempFilters,
                bookingStatus:
                  value === ""
                    ? null
                    : (value as typeof queryState.bookingStatus),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RESERVED">Reserved</SelectItem>
              <SelectItem value="CHECKED_IN">Checked In</SelectItem>
              <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Room Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Room Type</Label>
          <Select
            value={tempFilters.roomType || ""}
            onValueChange={(value) =>
              setTempFilters({ ...tempFilters, roomType: value || null })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All room types" />
            </SelectTrigger>
            <SelectContent>
              {roomTypes.map((roomType) => (
                <SelectItem key={roomType} value={roomType}>
                  {roomType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Summary */}
        {filterStates.hasActiveFilters && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Active filters:
            </p>
            <div className="flex flex-wrap gap-1">
              {tempFilters.bookingStatus && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                  Status:{" "}
                  {tempFilters.bookingStatus.toLowerCase().replace("_", " ")}
                </span>
              )}
              {tempFilters.roomType && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
                  Room: {tempFilters.roomType}
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
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button size="sm" onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </div>
    </TableFilter>
  );
}

function BookingsListToolbar({
  rooms,
  roomTypes,
  table,
}: {
  rooms: string[];
  roomTypes: string[];
  table: TableType<BookingViewResponse>;
}) {
  const [queryState, setQueryState] = useQueryStates({
    bookingStatus: parseAsStringLiteral([
      "RESERVED",
      "CHECKED_OUT",
      "CHECKED_IN",
      "CANCELLED",
    ]),
    search: parseAsString,
    roomType: parseAsString,
  });

  const [modalStates, setModalStates] = useState({
    checkInModalOpen: false,
    reservationModalOpen: false,
  });

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
      <div className="flex items-center gap-x-2">
        <Button
          size="sm"
          variant="outline"
          data-active={queryState.bookingStatus === null}
          onClick={() => setQueryState({ bookingStatus: null })}
          className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${queryState.bookingStatus === null
              ? "bg-primary text-primary-foreground border-primary"
              : ""
            }`}
        >
          All Bookings{" "}
          {queryState.bookingStatus === null &&
            `(${table.getRowCount() * table.getPageCount()})`}
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={queryState.bookingStatus === "RESERVED"}
          onClick={() => setQueryState({ bookingStatus: "RESERVED" })}
          className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${queryState.bookingStatus === "RESERVED"
              ? "bg-primary text-primary-foreground border-primary"
              : ""
            }`}
        >
          Reservations{" "}
          {queryState.bookingStatus === "RESERVED" &&
            `(${table.getFilteredRowModel().rows.length})`}
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={queryState.bookingStatus === "CHECKED_OUT"}
          onClick={() => setQueryState({ bookingStatus: "CHECKED_OUT" })}
          className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${queryState.bookingStatus === "CHECKED_OUT"
              ? "bg-primary text-primary-foreground border-primary"
              : ""
            }`}
        >
          Booking history{" "}
          {queryState.bookingStatus === "CHECKED_OUT" &&
            `(${table.getFilteredRowModel().rows.length})`}
        </Button>
      </div>

      <div className="flex items-center gap-x-2 ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search bookings"
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
            value={queryState.search ?? ""}
            onChange={(e) => setQueryState({ search: e.target.value || null })}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <BookingsFilter
            rooms={rooms}
            roomTypes={roomTypes}
            queryState={queryState}
            setQueryState={setQueryState}
          />

          {/* Applied Filters Display */}
          {queryState.roomType && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Room Type:</span>
              <span className="bg-primary/10 px-2 py-1 rounded-md font-medium">
                {queryState.roomType}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setQueryState({ roomType: null })}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {queryState.bookingStatus === "RESERVED" ? (
          <Dialog
            open={modalStates.reservationModalOpen}
            onOpenChange={(open) =>
              setModalStates({ ...modalStates, reservationModalOpen: open })
            }
          >
            <DialogTrigger asChild>
              <Button size={"sm"} className="rounded-xl gap-2">
                <PlusIcon className="w-4 h-4" />
                New Reservation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Reservation</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new reservation.
                </DialogDescription>
              </DialogHeader>

              <ReservationForm
                data={{
                  rooms,
                  roomTypes
                }}
                setOpen={(open) =>
                  setModalStates({
                    ...modalStates,
                    reservationModalOpen: open,
                  })
                }
              />
            </DialogContent>
          </Dialog>
        ) : queryState === null ? (
          <Dialog
            open={modalStates.checkInModalOpen}
            onOpenChange={(open) =>
              setModalStates({ ...modalStates, checkInModalOpen: open })
            }
          >
            <DialogTrigger asChild>
              <Button size={"sm"} className="rounded-xl gap-2">
                <PlusIcon className="w-4 h-4" />
                Add Booking
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Booking</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new booking.
                </DialogDescription>
              </DialogHeader>

              <CheckInForm
                data={{ rooms, roomTypes }}
                setOpen={(open) =>
                  setModalStates({
                    ...modalStates,
                    checkInModalOpen: open,
                  })
                }
              />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    </div>
  );
}

export function BookingsPage({
  breadcrumb,
  paginationMeta,
  bookings,
  rooms,
  roomTypes,
}: {
  bookings: BookingViewResponse[];
  rooms: string[];
  roomTypes: string[];
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
      <BookingsListToolbar rooms={rooms} roomTypes={roomTypes} table={table} />
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
