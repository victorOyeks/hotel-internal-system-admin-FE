"use client";

import type { InventorySummaryResponse } from "@/lib/fetch";
import {
  ArchiveIcon,
  ChevronRightIcon,
  FolderSymlink,
  PackageCheckIcon,
  PlusIcon,
  TriangleAlert,
  TruckIcon,
} from "lucide-react";

export function InventoryStat({ data }: { data: InventorySummaryResponse }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
        <div className="size-10 aspect-square bg-blue-600/10 rounded-full flex items-center justify-center">
          <ArchiveIcon className="size-6 text-blue-600" />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-xs text-muted-foreground">Total Items</h3>
          <p className="text-xl font-semibold leading-tight">
            {data.totalItems}
          </p>
        </div>
      </div>

      <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
        <div className="size-10 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
          <ArchiveIcon className="size-6 text-green-600" />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-xs text-muted-foreground">Available Items</h3>
          <p className="text-xl font-semibold leading-tight">
            {data.available}
          </p>
        </div>
      </div>

      <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
        <div className="size-10 aspect-square bg-yellow-600/10 rounded-full flex items-center justify-center">
          <ArchiveIcon className="size-6 text-yellow-600" />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-xs text-muted-foreground">Low in Stock</h3>
          <p className="text-xl font-semibold leading-tight">
            {data.lowInStock}
          </p>
        </div>
      </div>

      <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
        <div className="size-10 aspect-square bg-red-600/10 rounded-full flex items-center justify-center">
          <TriangleAlert className="size-6 text-red-600" />
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-xs text-muted-foreground">Out of Stock</h3>
          <p className="text-xl font-semibold leading-tight">
            {data.outOfStock}
          </p>
        </div>
      </div>
    </div>
  );
}

const actions = [
  {
    title: "Add New Stock Item",
    icon: PlusIcon,
    key: "add-stock-item",
  },
  {
    title: "Receive Stock Item",
    icon: FolderSymlink,
    key: "receive-stock-item",
  },
  {
    title: "Issue Stock Item",
    icon: PackageCheckIcon,
    key: "issue-stock-item",
  },
  {
    title: "Request Restock",
    icon: TruckIcon,
    key: "request-restock",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map(({ icon: Icon, title, key }) => (
        <div
          className="flex flex-row items-center gap-x-2 bg-white p-2 rounded-4xl border border-primary-5/50"
          key={key}
        >
          <div className="flex items-center gap-x-2 flex-1">
            <div className="size-8 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
              <Icon className="size-5 text-green-600" />
            </div>

            <p className="text-sm font-medium">{title}</p>
          </div>

          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}


function InventoryDashboard() {}

export function Dashboard() {}