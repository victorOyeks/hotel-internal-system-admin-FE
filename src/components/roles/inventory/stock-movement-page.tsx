"use client";

import { DataTable } from "@/components/ui/data-table";
import type { Pagination, StockMovementResponse } from "@/lib/fetch";
import { useQueryState } from "nuqs";
import { columns } from "./stock-movement-table";

interface StockMovementPageProps {
    movements: StockMovementResponse[];
    paginationSchema: Pagination;
}

export function StockMovementPage({
    movements,
    paginationSchema,
}: StockMovementPageProps) {
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
        throttleMs: 500,
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Stock Movements</h2>
            </div>
            <div className="flex items-center gap-2">
                <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-sm"
                    placeholder="Search movements..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <DataTable
                columns={columns}
                data={movements}
                pageCount={paginationSchema.totalPages}
            />
        </div>
    );
}
