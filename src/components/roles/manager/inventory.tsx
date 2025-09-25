"use client";

import { BoxIcon } from "lucide-react";
import { ManagerInventoryTable } from "./inventory-table";
import { breadcrumbAtom, type Breadcrumb } from "@/lib/store";
import type {
  InventoryResponse,
  InventoryRestockRequest,
  InventorySummaryResponse,
  Pagination,
} from "@/lib/fetch";
import { useSetAtom } from "jotai";
import { useLayoutEffect } from "react";

function InventoryStat({ data }: { data: InventorySummaryResponse }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
        <div className="size-10 aspect-square bg-blue-600/10 rounded-full flex items-center justify-center">
          <BoxIcon className="size-6 text-blue-600" />
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
          <BoxIcon className="size-6 text-green-600" />
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
          <BoxIcon className="size-6 text-yellow-600" />
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
          <BoxIcon className="size-6 text-red-600" />
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

export function ManagerInventoryPage({
  breadcrumbs,
  statData,
  inventoryData,
  paginationMeta,
}: {
  breadcrumbs: {
    title: string;
    breadcrumbs: Breadcrumb[];
  };
  inventoryData: InventoryResponse[] | InventoryRestockRequest[];
  statData: InventorySummaryResponse;
  paginationMeta: Pagination;
}) {
  const setBreadcrumb = useSetAtom(breadcrumbAtom);

  useLayoutEffect(() => {
    setBreadcrumb(breadcrumbs);
    return () => setBreadcrumb(null);
  }, [setBreadcrumb, breadcrumbs]);

  return (
    <div className="p-4 md:p-6 space-y-2 md:space-y-4">
      <InventoryStat data={statData} />
      <ManagerInventoryTable data={inventoryData}
      paginationMeta={paginationMeta}
      />
    </div>
  );
}
