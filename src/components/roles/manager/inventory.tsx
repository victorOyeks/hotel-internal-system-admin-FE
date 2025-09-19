"use client";

import { BoxIcon } from "lucide-react";
import { ManagerInventoryTable } from "./inventory-table";

const stats = {
  totalItems: 1200,
  availableItems: 1100,
  lowInStock: 50,
  outOfStock: 50,
};

function InventoryStat() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

        <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
          <div className="size-10 aspect-square bg-blue-600/10 rounded-full flex items-center justify-center">
            <BoxIcon className="size-6 text-blue-600" />
          </div>

          <div className="flex flex-col flex-1">
            <h3 className="text-xs text-muted-foreground">Total Items</h3>
            <p className="text-xl font-semibold leading-tight">{stats.totalItems}</p>
          </div>
        </div>

        <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
            <div className="size-10 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
                <BoxIcon className="size-6 text-green-600" />
            </div>
            
            <div className="flex flex-col flex-1">
                <h3 className="text-xs text-muted-foreground">Available Items</h3>
                <p className="text-xl font-semibold leading-tight">{stats.availableItems}</p>
            </div>
        </div>
        
        <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
            <div className="size-10 aspect-square bg-yellow-600/10 rounded-full flex items-center justify-center">
                <BoxIcon className="size-6 text-yellow-600" />
            </div>
            
            <div className="flex flex-col flex-1">
                <h3 className="text-xs text-muted-foreground">Low in Stock</h3>
                <p className="text-xl font-semibold leading-tight">{stats.lowInStock}</p>
            </div>
        </div>
        
        <div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
            <div className="size-10 aspect-square bg-red-600/10 rounded-full flex items-center justify-center">
                <BoxIcon className="size-6 text-red-600" />
            </div>
            
            <div className="flex flex-col flex-1">
                <h3 className="text-xs text-muted-foreground">Out of Stock</h3>
                <p className="text-xl font-semibold leading-tight">{stats.outOfStock}</p>
            </div>
        </div>

    </div>
  );
}

export function ManagerInventoryPage() {
  return (
    <div className="p-4 md:p-6 space-y-2 md:space-y-4">
      <InventoryStat />
      <ManagerInventoryTable data={[]} />
    </div>
  );
}
