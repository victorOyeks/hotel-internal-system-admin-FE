"use client";

import { useQuery } from "@tanstack/react-query";
import { getRentalItemHistory } from "@/lib/rentals-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon, CalendarIcon } from "lucide-react";

export function ItemHistory({ itemId }: { itemId: string }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["rentals", "items", itemId, "history"],
    queryFn: async () => {
      const res = await getRentalItemHistory(itemId);
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    OVERDUE: "bg-red-100 text-red-800 border-red-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <CalendarIcon className="w-8 h-8 mb-2 opacity-50" />
        <p>No rental history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarIcon className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Recent Rental History</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Rental Period</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.orderNumber}
              </TableCell>
              <TableCell>{record.customerName}</TableCell>
              <TableCell>
                <div className="flex flex-col text-xs">
                  <span>
                    {new Date(record.rentalStartDate).toLocaleDateString()}
                  </span>
                  <span className="text-muted-foreground">
                    to {new Date(record.rentalEndDate).toLocaleDateString()}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">{record.quantity}</TableCell>
              <TableCell>
                <Badge className={statusColors[record.status] || "bg-gray-100"}>
                  {record.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
