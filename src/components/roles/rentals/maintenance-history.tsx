"use client";

import { useQuery } from "@tanstack/react-query";
import { getRentalMaintenanceHistory } from "@/lib/rentals-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon, PenToolIcon } from "lucide-react";
import type { RentalMaintenanceRecord } from "@/lib/fetch";

export function MaintenanceHistory({ itemId }: { itemId: string }) {
  const { data: maintenanceHistory, isLoading } = useQuery({
    queryKey: ["rentals", "items", itemId, "maintenance"],
    queryFn: async () => {
      const res = await getRentalMaintenanceHistory(itemId);
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!maintenanceHistory || maintenanceHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <PenToolIcon className="w-8 h-8 mb-2 opacity-50" />
        <p>No maintenance history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <PenToolIcon className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Maintenance History</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead>Technician</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {maintenanceHistory.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                {new Date(record.startDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{record.maintenanceType}</TableCell>
              <TableCell
                className="max-w-[200px] truncate"
                title={record.description}
              >
                {record.description}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[record.status] || "bg-gray-100"}>
                  {record.status.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {record.cost ? `₦${record.cost.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell>{record.performedBy || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
