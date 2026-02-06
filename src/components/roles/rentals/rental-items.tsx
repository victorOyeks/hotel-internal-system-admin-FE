"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  PlusCircleIcon,
  SearchIcon,
  PackageIcon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { Pagination, RentalItem } from "@/lib/fetch";
import { RentalItemDialog } from "./rental-item-dialog";
import { RentalItemDetailsDialog } from "./rental-item-details-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryState } from "nuqs";

type RentalItemsPageProps = {
  items: RentalItem[];
  paginationMeta: Pagination;
  breadcrumbs: {
    title: string;
    breadcrumbs: Array<{ label: string; href: string }>;
  };
};

export function RentalItemsPage({
  items,
  paginationMeta,
  breadcrumbs,
}: RentalItemsPageProps) {
  const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [category, setCategory] = useQueryState("category", {
    defaultValue: "all",
  });
  const [status, setStatus] = useQueryState("status", { defaultValue: "all" });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <BreadCrumbWrapper breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rental Items</h1>
            <p className="text-muted-foreground mt-1">
              Manage your rental inventory and pricing
            </p>
          </div>
          <RentalItemDialog />
        </div>

        <div className="bg-card border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl mb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2">
            <div className="relative w-full md:max-w-md">
              <Input
                placeholder="Search rental items..."
                className="pl-9 bg-primary-5/15 border-none focus-visible:ring-primary/20 rounded-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[150px] rounded-full border-primary-5/20 bg-primary-5/10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="MOBILITY_AIDS">Mobility Aids</SelectItem>
                  <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                  <SelectItem value="RECREATION">Recreation</SelectItem>
                  <SelectItem value="FAMILY">Family & Baby</SelectItem>
                  <SelectItem value="VEHICLES">Vehicles</SelectItem>
                  <SelectItem value="CONFERENCE_EQUIPMENT">
                    Conference
                  </SelectItem>
                  <SelectItem value="SPORTS_EQUIPMENT">Sports</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px] rounded-full border-primary-5/20 bg-primary-5/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <RentalItemCard
              key={item.id}
              item={item}
              onViewDetails={(item) => {
                setSelectedItem(item);
                setIsDetailsOpen(true);
              }}
            />
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No rental items found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationMeta.pageNumber - 1)}
            disabled={paginationMeta.first}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {paginationMeta.pageNumber + 1} of{" "}
            {paginationMeta.totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationMeta.pageNumber + 1)}
            disabled={paginationMeta.last}
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <RentalItemDetailsDialog
        item={selectedItem}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </BreadCrumbWrapper>
  );
}

function RentalItemCard({
  item,
  onViewDetails,
}: {
  item: RentalItem;
  onViewDetails: (item: RentalItem) => void;
}) {
  const isAvailable = item.availableQuantity > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <PackageIcon className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">{item.name}</CardTitle>
          </div>
          <Badge variant={isAvailable ? "default" : "secondary"}>
            {isAvailable ? "Available" : "Out of Stock"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Daily Rate:</span>
          <span className="font-semibold">₦{item.dailyRate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Deposit:</span>
          <span className="font-semibold">₦{item.depositAmount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Available:</span>
          <span className="font-semibold">
            {item.availableQuantity} / {item.totalQuantity}
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => onViewDetails(item)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
