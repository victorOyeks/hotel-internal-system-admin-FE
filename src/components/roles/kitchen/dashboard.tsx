"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { ExportDialog } from "@/components/shared/shared-dialogs";
import { TableFilter } from "@/components/shared/table-filter";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import type { APIOutput } from "@/lib/action-utils";
import { revalidateRoute } from "@/lib/actions";
import type { Pagination } from "@/lib/fetch";
import { updateOrderStatus } from "@/lib/restaurant-actions";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderInputIcon,
  type LucideProps,
  PackageCheckIcon,
  PlusIcon,
  SearchIcon,
  TruckIcon,
  RotateCcwIcon,
  CalendarIcon,
} from "lucide-react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsIsoDate,
  useQueryState,
  useQueryStates,
} from "nuqs";
import {
  type ForwardRefExoticComponent,
  type RefAttributes,
  useState,
  useMemo,
  useCallback,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReceiveStockItem, ReportWastage, RequestRestock } from "./quick-action-modals";

// Kitchen Orders Filter Component
const KitchenOrdersFilter = ({
  queryState,
  setQueryState,
  setOpen,
}: {
  setOpen: (open: boolean) => void;
  queryState: {
    destination: string | null;
    status: "COMPLETED" | "CANCELLED" | "PENDING" | null;
    searchText: string | null;
    startDate: Date | null;
    endDate: Date | null;
  };
  setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
  const [tempFilters, setTempFilters] = useState({
    destination: queryState.destination || "",
    status: queryState.status || null,
    searchText: queryState.searchText || "",
    startDate: queryState.startDate || null,
    endDate: queryState.endDate || null,
  });

  // Memoized callback functions to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    setQueryState({
      destination: tempFilters.destination || null,
      status: tempFilters.status,
      searchText: tempFilters.searchText || null,
      startDate: tempFilters.startDate,
      endDate: tempFilters.endDate,
    });
    setOpen(false);
  }, [tempFilters, setQueryState, setOpen]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      destination: "",
      status: null,
      searchText: "",
      startDate: null,
      endDate: null,
    };
    setTempFilters(clearedFilters);
    setQueryState({
      destination: null,
      status: null,
      searchText: null,
      startDate: null,
      endDate: null,
    });
  }, [setQueryState]);

  // Memoize filter state computations
  const filterStates = useMemo(() => {
    const hasActiveFilters = !!(
      tempFilters.destination ||
      tempFilters.status ||
      tempFilters.searchText ||
      tempFilters.startDate ||
      tempFilters.endDate
    );

    const hasAppliedFilters = !!(
      queryState.destination ||
      queryState.status ||
      queryState.searchText ||
      queryState.startDate ||
      queryState.endDate
    );

    const appliedFiltersCount =
      (queryState.destination ? 1 : 0) +
      (queryState.status ? 1 : 0) +
      (queryState.searchText ? 1 : 0) +
      (queryState.startDate ? 1 : 0) +
      (queryState.endDate ? 1 : 0);

    return {
      hasActiveFilters,
      hasAppliedFilters,
      appliedFiltersCount,
    };
  }, [tempFilters, queryState]);

  const statusOptions = useMemo(
    () => [
      { value: "PENDING", label: "Pending" },
      { value: "COMPLETED", label: "Completed" },
      { value: "CANCELLED", label: "Cancelled" },
    ],
    []
  );

  return (
    <div className="space-y-4 w-96">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Filter Kitchen Orders</h4>
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

      {/* Filter Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Destination Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Destination</Label>
          <Input
            placeholder="Room number or location..."
            value={tempFilters.destination}
            onChange={(e) =>
              setTempFilters({
                ...tempFilters,
                destination: e.target.value,
              })
            }
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
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
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Text Filter - Full Width */}
        <div className="col-span-2 space-y-2">
          <Label className="text-sm font-medium">Search Text</Label>
          <Input
            placeholder="Search orders..."
            value={tempFilters.searchText}
            onChange={(e) =>
              setTempFilters({
                ...tempFilters,
                searchText: e.target.value,
              })
            }
          />
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {tempFilters.startDate ? (
                  format(tempFilters.startDate, "MMM dd")
                ) : (
                  <span>Pick start date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={tempFilters.startDate || undefined}
                onSelect={(date) =>
                  setTempFilters({
                    ...tempFilters,
                    startDate: date || null,
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {tempFilters.endDate ? (
                  format(tempFilters.endDate, "MMM dd")
                ) : (
                  <span>Pick end date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={tempFilters.endDate || undefined}
                onSelect={(date) =>
                  setTempFilters({
                    ...tempFilters,
                    endDate: date || null,
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          size="sm"
          onClick={applyFilters}
          disabled={!filterStates.hasActiveFilters}
          className="flex-1"
        >
          Apply Filters
        </Button>
      </div>

      {/* Applied Filters Summary */}
      {filterStates.hasAppliedFilters && (
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-1">
            {queryState.destination && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ destination: null })}
              >
                Destination: {queryState.destination}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
            {queryState.status && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ status: null })}
              >
                Status: {queryState.status}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
            {queryState.searchText && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ searchText: null })}
              >
                Search: {queryState.searchText}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
            {queryState.startDate && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ startDate: null })}
              >
                From: {format(queryState.startDate, "MMM dd")}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
            {queryState.endDate && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ endDate: null })}
              >
                To: {format(queryState.endDate, "MMM dd")}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

type QuickAction = {
  title: string;
  heading?: string;
  Component?: ({
    setOpen,
  }: {
    setOpen: (open: boolean) => void;
  }) => React.JSX.Element;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  key: string;
};

const actions: QuickAction[] = [
  {
    title: "Receive Stock Item",
    icon: FolderInputIcon,
    Component: ReceiveStockItem,
    key: "receive-stock-item",
  },
  {
    title: "Report wastage",
    icon: PackageCheckIcon,
    Component: ReportWastage,
    key: "report-wastage",
  },
  {
    title: "Request Restock",
    icon: TruckIcon,
    Component: RequestRestock,
    key: "request-restock",
  },
];

export function QuickActions() {
  const [open, setOpen] = useState<false | string>(false);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Link
        className="flex flex-row items-center gap-x-2 bg-white p-2 rounded-4xl border border-primary-5/50"
        href={"/dashboard/create-order"}
      >
        <div className="flex items-center gap-x-2 flex-1">
          <div className="size-8 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
            <PlusIcon className="size-5 text-green-600" />
          </div>

          <p className="text-sm font-medium">Create New Order</p>
        </div>

        <ChevronRightIcon className="size-4 text-muted-foreground" />
      </Link>
      {actions.map(({ icon: Icon, title, key, heading, Component }) => {
        return (
          <BaseModal
            key={key}
            open={open === key}
            setOpen={(open) => setOpen(open ? key : false)}
            trigger={
              <div className="flex flex-row items-center gap-x-2 bg-white p-2 rounded-4xl border border-primary-5/50">
                <div className="flex items-center gap-x-2 flex-1">
                  <div className="size-8 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
                    <Icon className="size-5 text-green-600" />
                  </div>

                  <p className="text-sm font-medium">{title}</p>
                </div>

                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </div>
            }
          >
            <DialogTitle>{heading || title}</DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
            {Component && (
              <Component setOpen={(open) => setOpen(open ? key : false)} />
            )}
          </BaseModal>
        );
      })}
    </div>
  );
}

function BaseModal({
  children,
  open,
  setOpen,
  trigger,
}: PropsWithChildren<{
  trigger: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}>) {
  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>

      <DialogContent className="rounded-4xl max-w-sm">{children}</DialogContent>
    </Dialog>
  );
}

export function KitchenToolbar() {
  const [queryState, setQueryState] = useQueryStates({
    status: parseAsStringLiteral(["COMPLETED", "CANCELLED", "PENDING"]),
    destination: parseAsString,
    searchText: parseAsString,
    startDate: parseAsIsoDate,
    endDate: parseAsIsoDate,
    page: parseAsInteger.withDefault(1),
    size: parseAsInteger.withDefault(10),
  });

  const [filterOpen, setFilterOpen] = useState(false);

  // Memoize applied filters count for performance
  const appliedFiltersCount = useMemo(() => {
    return (
      (queryState.destination ? 1 : 0) +
      (queryState.status && queryState.status !== "COMPLETED" ? 1 : 0) +
      (queryState.searchText ? 1 : 0) +
      (queryState.startDate ? 1 : 0) +
      (queryState.endDate ? 1 : 0)
    );
  }, [
    queryState.destination,
    queryState.status,
    queryState.searchText,
    queryState.startDate,
    queryState.endDate,
  ]);

  return (
    <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
      <div className="flex items-center gap-x-2">
        <Button
          size="sm"
          variant="outline"
          data-active={queryState.status === null}
          onClick={() => setQueryState({ status: null })}
          className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
            queryState.status === null
              ? "bg-primary text-primary-foreground border-primary"
              : ""
          }`}
        >
          All Orders
        </Button>

        <Button
          size="sm"
          variant="outline"
          data-active={queryState.status === "COMPLETED"}
          onClick={() => setQueryState({ status: "COMPLETED" })}
          className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
            queryState.status === "COMPLETED"
              ? "bg-primary text-primary-foreground border-primary"
              : ""
          }`}
        >
          Order History
        </Button>
      </div>

      <div className="flex items-center gap-x-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
            value={queryState.searchText ?? ""}
            onChange={(e) =>
              setQueryState({ searchText: e.target.value || null })
            }
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>

        {/* Applied Filters Chips */}
        {appliedFiltersCount > 0 && (
          <div className="flex items-center gap-1">
            {queryState.destination && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ destination: null })}
              >
                Destination: {queryState.destination}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
            {queryState.status && queryState.status !== "COMPLETED" && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ status: null })}
              >
                Status: {queryState.status}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
            {queryState.searchText && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ searchText: null })}
              >
                Search: {queryState.searchText}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
            {queryState.startDate && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ startDate: null })}
              >
                From: {format(queryState.startDate, "MMM dd")}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
            {queryState.endDate && (
              <Badge
                variant="green"
                className="text-xs cursor-pointer"
                onClick={() => setQueryState({ endDate: null })}
              >
                To: {format(queryState.endDate, "MMM dd")}
                <button
                  type="button"
                  className="ml-1 hover:bg-gray-200 rounded"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <TableFilter
            open={filterOpen}
            setOpen={setFilterOpen}
            count={appliedFiltersCount}
          >
            <KitchenOrdersFilter
              queryState={{
                destination: queryState.destination,
                status: queryState.status,
                searchText: queryState.searchText,
                startDate: queryState.startDate,
                endDate: queryState.endDate,
              }}
              setQueryState={setQueryState}
              setOpen={setFilterOpen}
            />
          </TableFilter>

          <ExportDialog
            onSubmitAction={() => Promise.resolve()}
            open={false}
            setOpenAction={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

type OrderItem =
  APIOutput<"@get/api/restaurants/restaurant-orders">["data"]["content"][number];

function OrderCard({
  order,
  onClick,
}: {
  order: OrderItem;
  onClick: () => void;
}) {
  const statusToVariant = {
    COMPLETED: "green",
    CANCELLED: "red",
    PENDING: "blue",
  } satisfies Record<string, BadgeVariant>;

  const [orderStatus, setOrderStatus] = useState(order.status);

  const { mutate, isPending } = useMutation({
    mutationKey: ["update-order-status", order.id],
    mutationFn: async (newStatus: "COMPLETED" | "CANCELLED" | "PENDING") => {
      const response = await updateOrderStatus({
        orderId: order.id,
        status: newStatus,
      });
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: (data) => {
      toast.success("Order status updated successfully", {
        description: data.data,
      });
      revalidateRoute("/restaurant");
    },
    onMutate: (status) => {
      toast.loading("Updating order status...");
      setOrderStatus(status);
    },
    onError: (error) => {
      toast.error("Failed to update order status", {
        description: error.message,
      });
      setOrderStatus(order.status);
    },
    onSettled: () => {
      toast.dismiss();
    },
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: true
    <div
      className="border border-primary-5/20 rounded-2xl p-4 bg-white h-full flex flex-col justify-between"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      key={order.id}
    >
      <div>
        <div className="flex justify-between items-center">
          <Badge
            variant={
              statusToVariant[orderStatus as keyof typeof statusToVariant] ||
              "blue"
            }
            className="capitalize"
          >
            {orderStatus.replaceAll("_", " ").toLowerCase()}
          </Badge>

          {order.status !== "COMPLETED" && (
            <DropdownMenu>
              <DropdownMenuTrigger disabled={isPending} asChild>
                <button
                  type="button"
                  className="flex items-center gap-x-1 text-xs bg-muted text-muted-foreground rounded-full px-2 py-1"
                >
                  Update <ChevronDownIcon className="size-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => mutate("PENDING")}
                  >
                    New order{" "}
                    <Checkbox
                      checked={orderStatus === "PENDING"}
                      onCheckedChange={(checked) =>
                        mutate(checked ? "PENDING" : orderStatus)
                      }
                    />
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => mutate("COMPLETED")}
                  >
                    Completed{" "}
                    <Checkbox
                      checked={orderStatus === "COMPLETED"}
                      onCheckedChange={(checked) =>
                        mutate(checked ? "COMPLETED" : orderStatus)
                      }
                    />
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => mutate("CANCELLED")}
                  >
                    Cancel{" "}
                    <Checkbox
                      checked={orderStatus === "CANCELLED"}
                      onCheckedChange={(checked) =>
                        mutate(checked ? "CANCELLED" : orderStatus)
                      }
                    />
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="space-y-1">
          <p className="font-medium text-lg mt-2">Order #{order.customId}</p>
          <p className="text-sm text-muted-foreground">{order.destination}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <hr className="my-4 border-t border-primary-5/20" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-semibold">
          <p>{order.orderItems.length} items</p>
          <p>Total: {formatCurrency(order.totalAmount)}</p>
        </div>
        {order.orderItems.map((item) => (
          <div
            key={item.itemName}
            className="flex justify-between items-center text-sm"
          >
            <div>
              <p className="font-medium">{item.itemName}</p>
              <p className="text-muted-foreground text-xs font-medium">
                {formatCurrency(item.price)}
              </p>
            </div>
            <p className="font-medium">x{item.quantity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetailSheet({ order }: { order: OrderItem }) {
  const statusToVariant = {
    COMPLETED: "green",
    CANCELLED: "red",
    PENDING: "blue",
  } satisfies Record<string, BadgeVariant>;

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Order #{order.customId}</SheetTitle>
        <SheetDescription>
          Complete order information and items
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="h-[calc(100vh-120px)] px-4">
        <div className="space-y-4 pb-6">
          {/* Order Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Order Status</h3>
              <Badge
                variant={
                  statusToVariant[order.status as keyof typeof statusToVariant] ||
                  "blue"
                }
                className="capitalize"
              >
                {order.status.replaceAll("_", " ").toLowerCase()}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{order.customId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium">
                  {format(new Date(order.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Destination:</span>
                <span className="font-medium">{order.destination}</span>
              </div>
              {order.note && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-600 block mb-1">Order Note:</span>
                  <p className="font-medium text-gray-900 bg-white rounded p-2 text-sm">
                    {order.note}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.orderItems.map((item, index) => (
                <div
                  key={`${item.itemName}-${index}`}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.itemName}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Subtotal</p>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Items:</span>
                <span className="font-medium">
                  {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Number of Dishes:</span>
                <span className="font-medium">{order.orderItems.length}</span>
              </div>
              <div className="border-t border-gray-300 my-2 pt-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 text-base">Total Amount:</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </SheetContent>
  );
}

export function Orders({
  orders,
  pagination,
}: {
  orders: OrderItem[];
  pagination: Pagination;
}) {
  const [localPagination, setLocalPagination] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [orderDetailState, setOrderDetailState] = useState<null | OrderItem>(
    null
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="col-span-1">
            <OrderCard
              order={order}
              onClick={() => setOrderDetailState(order)}
            />
          </div>
        ))}
      </div>
      <div className="w-full flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Page {pagination.pageNumber} of {pagination.totalPages}
        </span>
        <DataTablePagination
          pageIndex={pagination.pageNumber - 1}
          pageCount={pagination.totalPages}
          canNextPage={!pagination.last}
          canPreviousPage={!pagination.first}
          nextPage={() => {
            setLocalPagination(localPagination + 1);
          }}
          previousPage={() => {
            setLocalPagination(localPagination - 1);
          }}
          setPageIndex={(pageIndex: number) => {
            setLocalPagination(pageIndex + 1);
          }}
        />
      </div>
      {orderDetailState && (
        <Sheet
          open={!!orderDetailState}
          onOpenChange={(open) => {
            if (!open) setOrderDetailState(null);
          }}
        >
          <OrderDetailSheet order={orderDetailState} />
        </Sheet>
      )}
    </div>
  );
}
