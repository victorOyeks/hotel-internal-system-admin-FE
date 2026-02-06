"use client";

import { useQuery } from "@tanstack/react-query";
import { $fetch } from "@/lib/fetch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  DollarSignIcon,
  PackageIcon,
  MoreVerticalIcon,
  PrinterIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentDialog } from "./payment-dialog";
import { ReturnDialog } from "./return-dialog";
import { ExtensionDialog } from "./extension-dialog";
import { InspectionDialog } from "./inspection-dialog";
import { Button } from "@/components/ui/button";

type RentalOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  rentalStartDate: string;
  rentalEndDate: string;
};

type RentalOrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  dailyRate: number;
  totalDays: number;
  subtotal: number;
};

type Payment = {
  id: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  paymentDate: string;
};

type RentalOrderDetailsDialogProps = {
  order: RentalOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RentalOrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: RentalOrderDetailsDialogProps) {
  // Fetch real order details
  const { data: detailedOrder } = useQuery({
    queryKey: ["rentals", "orders", order?.id],
    queryFn: async () => {
      if (!order?.id) return null;
      // Using any cast for path because generic path might not match interpolated string exactly in generated types
      const response = await $fetch(
        `@get/api/hotels/rentals/orders/${order.id}` as any,
      );
      return response.data;
    },
    enabled: !!order?.id && open,
  });

  if (!order) return null;

  const items: RentalOrderItem[] = detailedOrder?.items || [];
  const payments: Payment[] = detailedOrder?.payments || [];

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

  const totalDays = Math.ceil(
    (new Date(order.rentalEndDate).getTime() -
      new Date(order.rentalStartDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const totalPaid = payments.reduce(
    (sum: number, payment: Payment) => sum + payment.amount,
    0,
  );
  const balance = order.totalAmount - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {order.orderNumber}
              </DialogTitle>
              <DialogDescription>
                Rental order details and information
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <ExtensionDialog
                orderId={order.id}
                currentReturnDate={new Date(order.rentalEndDate)}
                onSuccess={() => onOpenChange(false)}
              />
              <InspectionDialog orderId={order.id} onSuccess={() => {}} />
              <ReturnDialog
                orderId={order.id}
                onSuccess={() => onOpenChange(false)}
              />
              <PaymentDialog
                orderId={order.id}
                onSuccess={() => onOpenChange(false)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVerticalIcon className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Print Agreement
                  </DropdownMenuItem>
                  {(order.status === "PENDING" ||
                    order.status === "RESERVED") && (
                    <>
                      <DropdownMenuItem className="text-blue-600">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Mark as Picked Up
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <XCircleIcon className="w-4 h-4 mr-2" />
                        Cancel Order
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div className="flex gap-3">
            <Badge className={statusColors[order.status]}>{order.status}</Badge>
            <Badge className={paymentStatusColors[order.paymentStatus]}>
              Payment: {order.paymentStatus.replace(/_/g, " ")}
            </Badge>
          </div>

          <Separator />

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Rental Period */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Rental Period</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {new Date(order.rentalStartDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {new Date(order.rentalEndDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Days</p>
                  <p className="font-medium">{totalDays} days</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Rented Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PackageIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Rented Items</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Daily Rate</TableHead>
                  <TableHead className="text-center">Days</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.itemName}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ₦{item.dailyRate?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.totalDays || totalDays}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₦{item.subtotal?.toFixed(2) || "0.00"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Payment History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSignIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Payment History</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.paymentType.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ₦{payment.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Financial Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">
                  ₦{order.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Paid:</span>
                <span className="font-semibold text-green-600">
                  ₦{totalPaid.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Balance:</span>
                <span
                  className={`font-bold ${balance > 0 ? "text-orange-600" : "text-green-600"}`}
                >
                  ₦{balance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
