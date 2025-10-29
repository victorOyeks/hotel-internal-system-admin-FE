"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { ExportDialog } from "@/components/shared/shared-dialogs";
import { TableFilter } from "@/components/shared/table-filter";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useMutation } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderInputIcon,
  PackageCheckIcon,
  PlusIcon,
  SearchIcon,
  TruckIcon,
} from "lucide-react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useState, type PropsWithChildren, type ReactNode } from "react";
import { toast } from "sonner";

const actions = [
  {
    title: "Create New Order",
    heading: "Create new order",
    Component: CreateOrderForm,
    icon: PlusIcon,
    key: "create-new-order",
  },
  {
    title: "Receive Stock Item",
    icon: FolderInputIcon,
    key: "receive-stock-item",
  },
  {
    title: "Report wastage",
    icon: PackageCheckIcon,
    key: "report-wastage",
  },
  {
    title: "Request Restock",
    icon: TruckIcon,
    key: "request-restock",
  },
];

export function QuickActions() {
  const [open, setOpen] = useState<false | string>(false);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

function CreateOrderForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  return (
    <div>
      <p>This is a placeholder for Create Order Form.</p>
      <Button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        onClick={() => setOpen(false)}
      >
        Close
      </Button>
    </div>
  );
}

export function KitchenToolbar() {
  const [queryState, setQueryState] = useQueryStates({
    status: parseAsStringLiteral(["COMPLETED"]),
    search: parseAsString,
  });

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

      <div className="flex items-center gap-x-2 ">
        {" "}
        <div className="relative">
          <input
            type="text"
            placeholder="Search rooms..."
            className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
            value={queryState.search ?? ""}
            onChange={(e) => setQueryState({ search: e.target.value || null })}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <TableFilter></TableFilter>

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
  APIOutput<"@get/api/restaurants/kitchen-orders">["data"]["content"][number];

function OrderCard({ order }: { order: OrderItem }) {
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
      revalidateRoute("/restaurant")
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
    <div className="border border-primary-5/20 rounded-2xl p-4 bg-white">
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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="col-span-1">
            <OrderCard order={order} />
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
    </div>
  );
}
