"use client"

import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";
import type { StockLevelResponse, Pagination } from "@/lib/fetch";
import { StockLevelTable } from "./stock-level-table";
import { Button } from "@/components/ui/button";
import { SearchIcon, RotateCcwIcon } from "lucide-react";
import { TableFilter } from "@/components/shared/table-filter";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export function StockLevelToolbar({
    totalCount,
}: {
    totalCount?: number;
}) {
    const [queryState, setQueryState] = useQueryStates({
        search: parseAsString,
        category: parseAsString,
        lowStock: parseAsBoolean,
        outOfStock: parseAsBoolean,
        locationId: parseAsString,
    });

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Helper to calculate active filter count
    const activeFilterCount = [
        queryState.category,
        queryState.locationId,
        queryState.lowStock,
        queryState.outOfStock,
    ].filter(Boolean).length;

    const clearFilters = () => {
        setQueryState({
            category: null,
            locationId: null,
            lowStock: null,
            outOfStock: null,
            search: null,
        });
    };

    return (
        <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
            <div>
                <p className="font-medium px-2 text-primary">
                    Stock Levels {totalCount !== undefined && `(${totalCount})`}
                </p>
            </div>

            <div className="flex items-center gap-x-2">
                <div className="relative w-[250px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input
                        placeholder="Search products..."
                        value={queryState.search ?? ""}
                        onChange={(e) =>
                            setQueryState({ search: e.target.value || null })
                        }
                        className="pl-9 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full border-none"
                    />
                </div>

                <TableFilter
                    open={isFilterOpen}
                    setOpen={setIsFilterOpen}
                    count={activeFilterCount}
                >
                    <div className="flex flex-col gap-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">Filters</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-auto p-1 text-xs text-muted-foreground"
                            >
                                <RotateCcwIcon className="h-3 w-3 mr-1" />
                                Clear
                            </Button>
                        </div>

                        {/* Stock Status Filter */}
                        <div className="space-y-2">
                            <Label>Stock Status</Label>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setQueryState({
                                            lowStock: null,
                                            outOfStock: null,
                                        })
                                    }
                                    className="text-xs"
                                    data-active={
                                        !queryState.lowStock && !queryState.outOfStock
                                    }
                                >
                                    All
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setQueryState({
                                            lowStock: true,
                                            outOfStock: null,
                                        })
                                    }
                                    className={`text-xs ${queryState.lowStock ? "border-primary bg-primary/5" : ""}`}
                                >
                                    Low Stock
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setQueryState({
                                            lowStock: null,
                                            outOfStock: true,
                                        })
                                    }
                                    className={`text-xs ${queryState.outOfStock ? "border-primary bg-primary/5" : ""}`}
                                >
                                    Out of Stock
                                </Button>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={queryState.category || "all"}
                                onValueChange={(val) =>
                                    setQueryState({
                                        category: val === "all" ? null : val,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="FOOD_FRESH">Food Fresh</SelectItem>
                                    <SelectItem value="FOOD_FROZEN">Food Frozen</SelectItem>
                                    <SelectItem value="BEVERAGES">Beverages</SelectItem>
                                    <SelectItem value="CLEANING_SUPPLIES">
                                        Cleaning Supplies
                                    </SelectItem>
                                    {/* Add more categories as needed or fetch dynamically */}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-end gap-x-2 pt-2">
                            <Button
                                size={"sm"}
                                variant={"ghost"}
                                onClick={clearFilters}
                            >
                                Reset
                            </Button>
                            <Button
                                size={"sm"}
                                onClick={() => setIsFilterOpen(false)}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </TableFilter>
            </div>
        </div>
    );
}

export function StockLevelPageContent({
    data,
    paginationMeta,
}: {
    data: StockLevelResponse[];
    paginationMeta: Pagination;
}) {
    return (
        <div className="space-y-4 p-4">
            <StockLevelToolbar />
            <StockLevelTable data={data} paginationMeta={paginationMeta} />
        </div>
    );
}
