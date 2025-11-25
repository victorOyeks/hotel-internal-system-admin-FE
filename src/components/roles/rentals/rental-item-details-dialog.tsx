"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackageIcon, DollarSignIcon, TrendingUpIcon, TrendingDownIcon, CalendarIcon, InfoIcon } from "lucide-react";

type RentalItem = {
  id: string;
  name: string;
  category: string;
  dailyRate: number;
  depositAmount: number;
  totalQuantity: number;
  availableQuantity: number;
  active: boolean;
};

type RentalHistory = {
  id: string;
  orderNumber: string;
  customerName: string;
  rentalStartDate: string;
  rentalEndDate: string;
  quantity: number;
  status: string;
};

type RentalItemDetailsDialogProps = {
  item: RentalItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RentalItemDetailsDialog({
  item,
  open,
  onOpenChange,
}: RentalItemDetailsDialogProps) {
  if (!item) return null;

  const isAvailable = item.availableQuantity > 0;
  const utilizationRate = ((item.totalQuantity - item.availableQuantity) / item.totalQuantity) * 100;

  const categoryLabels: Record<string, string> = {
    MOBILITY_AIDS: "Mobility Aids",
    ELECTRONICS: "Electronics",
    CONFERENCE_EQUIPMENT: "Conference Equipment",
    BABY_ITEMS: "Baby Items",
    SPORTS_EQUIPMENT: "Sports Equipment",
    RECREATION: "Recreation",
    VEHICLES: "Vehicles",
  };

  // Mock rental history - in real app, this would come from API
  const mockRentalHistory: RentalHistory[] = [
    {
      id: "1",
      orderNumber: "RO-2024-001",
      customerName: "John Smith",
      rentalStartDate: "2024-01-15",
      rentalEndDate: "2024-01-25",
      quantity: 1,
      status: "ACTIVE",
    },
    {
      id: "2",
      orderNumber: "RO-2024-008",
      customerName: "Sarah Johnson",
      rentalStartDate: "2024-01-10",
      rentalEndDate: "2024-01-20",
      quantity: 2,
      status: "COMPLETED",
    },
    {
      id: "3",
      orderNumber: "RO-2023-189",
      customerName: "Michael Brown",
      rentalStartDate: "2023-12-20",
      rentalEndDate: "2024-01-05",
      quantity: 1,
      status: "COMPLETED",
    },
  ];

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    OVERDUE: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <PackageIcon className="w-6 h-6 text-blue-600" />
            {item.name}
          </DialogTitle>
          <DialogDescription>Rental item details and availability</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div className="flex gap-3">
            <Badge className={isAvailable ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
              {isAvailable ? "Available" : "Out of Stock"}
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
              {categoryLabels[item.category] || item.category}
            </Badge>
            {item.active && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                Active
              </Badge>
            )}
          </div>

          <Separator />

          {/* Pricing Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSignIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Pricing</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Daily Rental Rate</p>
                <p className="text-2xl font-bold text-green-600">${item.dailyRate.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">per day</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Security Deposit</p>
                <p className="text-2xl font-bold">${item.depositAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">refundable</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Inventory & Availability */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PackageIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Inventory & Availability</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <InfoIcon className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Total Quantity</p>
                </div>
                <p className="text-3xl font-bold text-blue-600">{item.totalQuantity}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUpIcon className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-900">Available</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{item.availableQuantity}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDownIcon className="w-4 h-4 text-orange-600" />
                  <p className="text-sm font-medium text-orange-900">Currently Rented</p>
                </div>
                <p className="text-3xl font-bold text-orange-600">{item.totalQuantity - item.availableQuantity}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Utilization Rate</span>
                <span className="font-semibold">{utilizationRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${utilizationRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Rental History */}
          <div>
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
                {mockRentalHistory.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell className="font-medium">{history.orderNumber}</TableCell>
                    <TableCell>{history.customerName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span>{new Date(history.rentalStartDate).toLocaleDateString()}</span>
                        <span className="text-muted-foreground">to {new Date(history.rentalEndDate).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{history.quantity}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[history.status]}>
                        {history.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Revenue Statistics (Mock) */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSignIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Revenue Summary (Last 30 Days)</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-green-700 mb-1">Total Rentals</p>
                <p className="text-2xl font-bold text-green-900">12</p>
              </div>
              <div>
                <p className="text-sm text-green-700 mb-1">Total Days Rented</p>
                <p className="text-2xl font-bold text-green-900">87</p>
              </div>
              <div>
                <p className="text-sm text-green-700 mb-1">Revenue Generated</p>
                <p className="text-2xl font-bold text-green-900">${(87 * item.dailyRate).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
