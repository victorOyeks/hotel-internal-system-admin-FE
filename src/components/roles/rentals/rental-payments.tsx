"use client";

import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSignIcon } from "lucide-react";
import type { Pagination } from "@/lib/fetch";

type RentalPayment = {
  id: string;
  orderNumber: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  paymentDate: string;
  customerName: string;
};

type RentalPaymentsPageProps = {
  payments: RentalPayment[];
  paginationMeta: Pagination;
  breadcrumbs: {
    title: string;
    breadcrumbs: Array<{ label: string; href: string }>;
  };
};

export function RentalPaymentsPage({ payments, paginationMeta, breadcrumbs }: RentalPaymentsPageProps) {
  return (
    <BreadCrumbWrapper breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground mt-1">
            View all rental payments and transactions
          </p>
        </div>

        <div className="space-y-4">
          {payments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      </div>
    </BreadCrumbWrapper>
  );
}

function PaymentCard({ payment }: { payment: RentalPayment }) {
  const paymentTypeColors: Record<string, string> = {
    DEPOSIT: "bg-blue-100 text-blue-800",
    RENTAL_FEE: "bg-green-100 text-green-800",
    DAMAGE_FEE: "bg-red-100 text-red-800",
    LATE_FEE: "bg-orange-100 text-orange-800",
    REFUND: "bg-purple-100 text-purple-800",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSignIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{payment.orderNumber}</h3>
              <p className="text-sm text-muted-foreground">{payment.customerName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(payment.paymentDate).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold text-lg text-green-600">
                ${payment.amount.toLocaleString()}
              </p>
              <div className="flex gap-2 mt-1">
                <Badge className={paymentTypeColors[payment.paymentType] || "bg-gray-100 text-gray-800"}>
                  {payment.paymentType.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline">{payment.paymentMethod}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
