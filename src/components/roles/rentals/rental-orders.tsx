"use client";

import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardListIcon, EyeIcon } from "lucide-react";
import type { Pagination } from "@/lib/fetch";

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

type RentalOrdersPageProps = {
  orders: RentalOrder[];
  paginationMeta: Pagination;
  breadcrumbs: {
    title: string;
    breadcrumbs: Array<{ label: string; href: string }>;
  };
};

export function RentalOrdersPage({ orders, paginationMeta, breadcrumbs }: RentalOrdersPageProps) {
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
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </BreadCrumbWrapper>
  );
}

function OrderCard({ order }: { order: RentalOrder }) {
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ClipboardListIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
              <p className="text-sm text-muted-foreground">
                {order.customerName} • {order.customerPhone}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(order.rentalStartDate).toLocaleDateString()} - {new Date(order.rentalEndDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold text-lg">${order.totalAmount.toLocaleString()}</p>
              <div className="flex gap-2 mt-1">
                <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                  {order.status}
                </Badge>
                <Badge variant="outline">{order.paymentStatus}</Badge>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <EyeIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
