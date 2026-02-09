"use client";

import { useQueryState } from "nuqs";
import { type StockLevelResponse, type Pagination } from "@/lib/fetch";
import { StockLevelTable } from "./stock-level-table";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon, RotateCcwIcon } from "lucide-react";
import { TableFilter } from "@/components/shared/table-filter";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { productSearchParams } from "@/lib/search-params.inventory"; // Reuse or create new ones?

// Define search params mapping locally if not exporting from shared file yet
// We'll use simple strings for now or reuse where appropriate
import { parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";

export function StockLevelToolbar() {
    const [search, setSearch] = useQueryState("search", { throttleMs: 500 });
    const [category, setCategory] = useQueryState("category");
    const [locationId, setLocationId] = useQueryState("locationId");
    const [lowStock, setLowStock] = useQueryState("lowStock", parseAsBoolean);
    const [outOfStock, setOutOfStock] = useQueryState("outOfStock", parseAsBoolean);

    const [tempFilters, setTempFilters] = useState({
        category: category || null,
        locationId: locationId || null,
        stockStatus: lowStock ? "low" : outOfStock ? "out" : "all",
    });

    // For demo purposes, we might need to fetch locations or categories. 
    // Assuming categories are static enum or fetched elsewhere.
    // We'll use a simple input for locationId for now or just text search.

    const applyFilters = () => {
        setCategory(tempFilters.category);
        setLocationId(tempFilters.locationId);
        if (tempFilters.stockStatus === "low") {
            setLowStock(true);
            setOutOfStock(null);
        } else if (tempFilters.stockStatus === "out") {
            setLowStock(null);
            setOutOfStock(true);
        } else {
            setLowStock(null);
            setOutOfStock(null);
        }
    };

    const clearFilters = () => {
        setTempFilters({ category: null, locationId: null, stockStatus: "all" });
        setCategory(null);
        setLocationId(null);
        setLowStock(null);
        setOutOfStock(null);
    };

    const activeFilterCount = [category, locationId, lowStock, outOfStock].filter(Boolean).length;

    return (
        <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
            <div>
                <p className="font-medium px-2">Stock Levels</p>
            </div>

            <div className="flex items-center gap-x-2">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search product..."
                        value={search || ""}
                        onChange={(e) => setSearch(e.target.value || null)}
                        className="w-full pl-9 py-2 bg-primary-5/10 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                </div>

                <TableFilter count={activeFilterCount}>
                    <div className="space-y-4 w-[250px]">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">Filters</h4>
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs text-muted-foreground">
                                <RotateCcwIcon className="h-3 w-3 mr-1" />
                                Clear
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Stock Status</Label>
                            <Select
                                value={tempFilters.stockStatus}
                                onValueChange={(val) => setTempFilters(prev => ({ ...prev, stockStatus: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="low">Low Stock</SelectItem>
                                    <SelectItem value="out">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Category</Label>
                            {/* Ideally this comes from a fetched list of categories */}
                            <Select
                                value={tempFilters.category || "all"}
                                onValueChange={(val) => setTempFilters(prev => ({ ...prev, category: val === "all" ? null : val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="FOOD_FRESH">Food Fresh</SelectItem>
                                    <SelectItem value="FOOD_FROZEN">Food Frozen</SelectItem>
                                    <SelectItem value="BEVERAGES">Beverages</SelectItem>
                                    <SelectItem value="CLEANING_SUPPLIES">Cleaning Supplies</SelectItem>
                                    {/* Add more as needed */}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={applyFilters} className="w-full">Apply Filters</Button>
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
