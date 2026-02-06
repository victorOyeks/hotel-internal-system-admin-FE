"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RentalOrderDialog } from "./rental-order-dialog";
import { RentalOrderDetailsDialog } from "./rental-order-details-dialog";
import { EyeIcon } from "lucide-react";
import type { Pagination, RentalOrder } from "@/lib/fetch";
import { useQueryState } from "nuqs";

type RentalOrdersPageProps = {
  orders: RentalOrder[];
  paginationMeta: Pagination;
  breadcrumbs: {
    title: string;
    breadcrumbs: Array<{ label: string; href: string }>;
  };
  currentPage?: number;
};

export function RentalOrdersPage({
  orders,
  paginationMeta,
  breadcrumbs,
  currentPage,
}: RentalOrdersPageProps) {
  const [selectedOrder, setSelectedOrder] = useState<RentalOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [status, setStatus] = useQueryState("status", { defaultValue: "all" });
  const [paymentStatus, setPaymentStatus] = useQueryState("paymentStatus", {
    defaultValue: "all",
  });

  const page = currentPage ?? paginationMeta.pageNumber;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    RESERVED: "bg-purple-100 text-purple-800 border-purple-200",
    ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    OVERDUE: "bg-red-100 text-red-800 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const paymentStatusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-800 border-green-200",
    PARTIAL: "bg-orange-100 text-orange-800 border-orange-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    DEPOSIT_PAID: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <BreadCrumbWrapper breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rental Orders</h1>
            <p className="text-muted-foreground mt-1">
              Manage all rental orders and returns
            </p>
          </div>
          <RentalOrderDialog />
        </div>

        <div className="bg-card border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl mb-4">
          <div className="flex flex-col md:flex-row items-center gap-4 p-2">
            <div className="flex-1 relative w-full">
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full border-none focus:ring-2 focus:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px] rounded-full border-primary-5/20 bg-primary-5/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger className="w-[150px] rounded-full border-primary-5/20 bg-primary-5/10">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PENDING">Unpaid</SelectItem>
                  <SelectItem value="DEPOSIT_PAID">Deposit Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              All Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {order.customerName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.customerPhone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span>
                          {new Date(order.rentalStartDate).toLocaleDateString()}
                        </span>
                        <span className="text-muted-foreground">
                          to{" "}
                          {new Date(order.rentalEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₦{order.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusColors[order.status] ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={paymentStatusColors[order.paymentStatus]}
                      >
                        {order.paymentStatus.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls inside Card Content */}
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={paginationMeta.first}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {page + 1} of {paginationMeta.totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={paginationMeta.last}
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <RentalOrderDetailsDialog
        order={selectedOrder}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </BreadCrumbWrapper>
  );
}
