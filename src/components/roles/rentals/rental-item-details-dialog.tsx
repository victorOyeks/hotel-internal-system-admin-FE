"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  PackageIcon,
  DollarSignIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  InfoIcon,
  Trash2Icon,
  Loader2Icon,
  AlertTriangleIcon,
} from "lucide-react";
import { deleteRentalItem } from "@/lib/rentals-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RentalItem } from "@/lib/fetch";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceHistory } from "./maintenance-history";
import { ItemHistory } from "./item-history";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Define mutation strictly using the server action's return type implicitly through usage
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const result = await deleteRentalItem({ itemId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Rental item deactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["rentals", "items"] });
      router.refresh();
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deactivate item");
    },
  });

  if (!item) return null;

  const isAvailable = item.availableQuantity > 0;
  const utilizationRate =
    item.totalQuantity > 0
      ? ((item.totalQuantity - item.availableQuantity) / item.totalQuantity) *
        100
      : 0;

  // Default to daily rate as it is required in the schema
  const displayRate = item.dailyRate ?? 0;
  const rateLabel = "Daily Rental Rate";
  const rateUnit = "per day";

  const categoryLabels: Record<string, string> = {
    MOBILITY_AIDS: "Mobility Aids",
    ELECTRONICS: "Electronics",
    CONFERENCE_EQUIPMENT: "Conference Equipment",
    BABY_ITEMS: "Baby Items",
    SPORTS_EQUIPMENT: "Sports Equipment",
    RECREATION: "Recreation",
    VEHICLES: "Vehicles",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <PackageIcon className="w-6 h-6 text-blue-600" />
                {item.name}
              </DialogTitle>
              <DialogDescription>
                Rental item details and availability
              </DialogDescription>
            </div>
            {item.active && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2Icon className="w-4 h-4" />
                Deactivate Item
              </Button>
            )}
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">Rental History</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Status Section */}
              <div className="flex gap-3">
                <Badge
                  className={
                    isAvailable
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  }
                >
                  {isAvailable ? "Available" : "Out of Stock"}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800 border-purple-200"
                >
                  {categoryLabels[item.category] || item.category}
                </Badge>
                {item.active && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-200"
                  >
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
                    <p className="text-sm text-muted-foreground mb-1">
                      {rateLabel}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ₦{displayRate.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rateUnit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Security Deposit
                    </p>
                    <p className="text-2xl font-bold">
                      ₦{(item.depositAmount ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      refundable
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Inventory & Availability */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <PackageIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">
                    Inventory & Availability
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <InfoIcon className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">
                        Total Quantity
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      {item.totalQuantity}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUpIcon className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900">
                        Available
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {item.availableQuantity}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDownIcon className="w-4 h-4 text-orange-600" />
                      <p className="text-sm font-medium text-orange-900">
                        Currently Rented
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">
                      {item.totalQuantity - item.availableQuantity}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Utilization Rate
                    </span>
                    <span className="font-semibold">
                      {utilizationRate.toFixed(1)}%
                    </span>
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

              {/* Revenue Statistics (Mock - ideally replace this too eventually, but keeping for now as placeholder for stats endpoint integration later) */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSignIcon className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">
                    Revenue Summary (Last 30 Days)
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-green-700 mb-1">Total Rentals</p>
                    <p className="text-2xl font-bold text-green-900">12</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 mb-1">
                      Total Days Rented
                    </p>
                    <p className="text-2xl font-bold text-green-900">87</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 mb-1">
                      Revenue Generated
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      ₦{(87 * displayRate).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <ItemHistory itemId={item.id} />
            </TabsContent>

            <TabsContent value="maintenance">
              <MaintenanceHistory itemId={item.id} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangleIcon className="w-5 h-5" />
              Deactivate Rental Item
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-semibold text-foreground">{item.name}</span>
              ? This item will no longer be available for new rentals. Existing
              orders will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(item.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
              )}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
