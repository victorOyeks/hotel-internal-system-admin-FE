"use client";

import { useState } from "react";
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
} from "@tanstack/react-table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";
import { format } from "date-fns";
import type { Pagination, StockMovementResponse } from "@/lib/fetch";
import { StockMovementTable } from "./stock-movement-table";
import { StockMovementToolbar } from "./stock-movement-toolbar";
import { CreateStockIssueForm } from "./create-stock-issue-form";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { ProductHistorySheet } from "./product-history-sheet";

const columnHelper = createColumnHelper<StockMovementResponse>();

const columns = [
    columnHelper.accessor("movementNumber", {
        header: "Movement #",
        cell: (info) => (
            <span className="font-mono font-medium">{info.getValue()}</span>
        ),
    }),
    columnHelper.accessor("movementType", {
        header: "Type",
        cell: (info) => {
            const type = info.getValue();
            let variant: "default" | "secondary" | "destructive" | "outline" =
                "outline";

            if (type.includes("IN") || type === "PURCHASE_RECEIPT") {
                variant = "secondary"; // Green-ish usually, but secondary is gray/blue
            } else if (type.includes("OUT") || type.includes("ISSUE")) {
                variant = "default";
            } else if (type.includes("WRITEOFF")) {
                variant = "destructive";
            }

            return (
                <Badge variant={variant} className="whitespace-nowrap">
                    {type.replace(/_/g, " ")}
                </Badge>
            );
        },
    }),
    columnHelper.accessor("productName", {
        header: "Product",
        cell: (info) => (
            <ProductHistorySheet
                productId={info.row.original.productId}
                productName={info.getValue() || "Unknown Product"}
                movement={info.row.original}
            >
                <div className="cursor-pointer hover:underline">
                    <p className="font-medium">{info.getValue()}</p>
                    <p className="text-xs text-muted-foreground">
                        {info.row.original.productSku}
                    </p>
                </div>
            </ProductHistorySheet>
        ),
    }),
    columnHelper.accessor("fromLocationName", {
        header: "From",
        cell: (info) => (
            <div>
                <p className="font-medium text-sm">{info.getValue() || "-"}</p>
            </div>
        ),
    }),
    columnHelper.accessor("toLocationName", {
        header: "To",
        cell: (info) => (
            <div>
                <p className="font-medium text-sm">{info.getValue() || "-"}</p>
            </div>
        ),
    }),
    columnHelper.accessor("quantity", {
        header: "Quantity",
        cell: (info) => {
            const qty = info.getValue();
            return (
                <span
                    className={`font-medium ${qty < 0 ? "text-red-600" : "text-green-600"
                        }`}
                >
                    {qty > 0 ? "+" : ""}
                    {qty}
                </span>
            );
        },
    }),
    columnHelper.accessor("movementDate", {
        header: "Date",
        cell: (info) => format(new Date(info.getValue()), "PPP"),
    }),
    columnHelper.accessor("performedBy", {
        header: "Performed By",
    }),
];

interface StockMovementPageProps {
    movements: StockMovementResponse[];
    paginationSchema: Pagination;
    locations: { id: string; name: string }[];
    products: { id: string; name: string; sku: string }[];
}

export function StockMovementPage({
    movements,
    paginationSchema,
    locations,
    products,
}: StockMovementPageProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [pagination, onPaginationChange] = usePaginationSearchParams();

    const table = useReactTable({
        data: movements,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
        pageCount: paginationSchema.totalPages,
        onPaginationChange,
        state: {
            pagination,
        },
    });

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage inventory movements
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Create Issue
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Stock Issue</DialogTitle>
                        </DialogHeader>
                        <CreateStockIssueForm
                            onClose={() => setIsCreateDialogOpen(false)}
                            locations={locations}
                            products={products}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Toolbar */}
            <StockMovementToolbar locations={locations} products={products} />

            {/* Table */}
            <StockMovementTable table={table} />
        </div>
    );
}
