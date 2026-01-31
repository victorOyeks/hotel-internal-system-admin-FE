/** biome-ignore-all lint/suspicious/noExplicitAny: explanation */
"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TableFilter } from "@/components/shared/table-filter";
import { SearchIcon } from "lucide-react";
import { useQueryStates, parseAsString, parseAsStringLiteral } from "nuqs";
import { useMemo, useCallback, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/shared/date-picker";
import { format } from "date-fns";
import { exportStockMovements } from "@/lib/inventory-actions";
import { toast } from "sonner";
import { ExportDialog, type ExportData } from "@/components/shared/shared-dialogs";

interface StockMovementToolbarProps {
    locations: { id: string; name: string }[];
    products: { id: string; name: string; sku: string }[];
}

export function StockMovementToolbar({ locations, products }: StockMovementToolbarProps) {
    const [filterStates, setFilterStates] = useQueryStates({
        search: parseAsString,
        type: parseAsStringLiteral([
            "PURCHASE_RECEIPT",
            "PURCHASE_RETURN_REVERSAL",
            "SALES_RETURN",
            "TRANSFER_IN",
            "ADJUSTMENT_IN",
            "PRODUCTION_IN",
            "SALES_ISSUE",
            "INTERNAL_CONSUMPTION",
            "TRANSFER_OUT",
            "ADJUSTMENT_OUT",
            "DAMAGE_WRITEOFF",
            "EXPIRY_WRITEOFF",
            "THEFT_WRITEOFF",
            "LOST_WRITEOFF",
            "SAMPLE_ISSUE",
            "STOCK_TAKE",
            "OPENING_BALANCE",
            "REVALUATION",
        ]),
        productId: parseAsString,
        locationId: parseAsString,
        startDate: parseAsString,
        endDate: parseAsString,
    });

    const filterQueryState = useMemo(
        () => ({
            type: filterStates.type,
            productId: filterStates.productId,
            locationId: filterStates.locationId,
            startDate: filterStates.startDate,
            endDate: filterStates.endDate,
        }),
        [filterStates],
    );

    const setFilterQueryState = useCallback(
        (state: Partial<typeof filterQueryState>) => {
            setFilterStates((prev) => ({
                ...prev,
                ...state,
            }));
        },
        [setFilterStates],
    );

    const appliedFilters = useMemo(() => {
        const filters: Array<{ key: string; label: string; value: string }> = [];

        if (filterStates.type) {
            filters.push({
                key: "type",
                label: "Type",
                value: filterStates.type.replace(/_/g, " "),
            });
        }
        if (filterStates.productId) {
            const product = products.find((p) => p.id === filterStates.productId);
            if (product) {
                filters.push({
                    key: "productId",
                    label: "Product",
                    value: product.name,
                });
            }
        }
        if (filterStates.locationId) {
            const location = locations.find((l) => l.id === filterStates.locationId);
            if (location) {
                filters.push({
                    key: "locationId",
                    label: "Location",
                    value: location.name,
                });
            }
        }
        if (filterStates.startDate) {
            filters.push({
                key: "startDate",
                label: "From",
                value: format(new Date(filterStates.startDate), "PP"),
            });
        }
        if (filterStates.endDate) {
            filters.push({
                key: "endDate",
                label: "To",
                value: format(new Date(filterStates.endDate), "PP"),
            });
        }

        return filters;
    }, [filterStates, products, locations]);

    const removeFilter = useCallback(
        (key: string) => {
            setFilterStates((prev) => ({
                ...prev,
                [key]: null,
            }));
        },
        [setFilterStates],
    );

    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

    const onExport = async (data: ExportData) => {
        try {
            const filters = {
                search: filterStates.search || undefined,
                movementType: filterStates.type || undefined,
                startDate: data.from_date?.toISOString(),
                endDate: data.to_date?.toISOString(),
                productId: filterStates.productId || undefined,
                locationId: filterStates.locationId || undefined,
                format: data.export_type.toUpperCase() as "CSV" | "PDF" | "EXCEL",
            };

            const response = await exportStockMovements(filters);

            if (response.success && response.data) {
                const blob = new Blob([response.data as unknown as BlobPart], {
                    type:
                        data.export_type === "csv"
                            ? "text/csv"
                            : data.export_type === "pdf"
                                ? "application/pdf"
                                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const extension =
                    data.export_type === "excel" ? "xlsx" : data.export_type;
                a.download = `${data.export_type === "csv"
                    ? "stock-movements"
                    : "stock-movements-report"
                    }-${format(new Date(), "yyyy-MM-dd")}.${extension}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Export downloaded successfully");
                setIsExportDialogOpen(false);
            } else {
                toast.error(response.error || "Failed to export movements");
            }
        } catch {
            toast.error("An error occurred during export");
        }
    };

    return (
        <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
            <div className="flex items-center gap-x-2 flex-1">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search movements..."
                        value={filterStates.search ?? ""}
                        onChange={(e) =>
                            setFilterStates((prev) => ({
                                ...prev,
                                search: e.target.value || null,
                            }))
                        }
                        className="w-full pl-9 py-2 bg-primary-5/10 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
                </div>

                {/* Applied Filter Chips */}
                {appliedFilters.map((filter) => (
                    <Badge
                        key={filter.key}
                        variant="secondary"
                        className="px-2 py-1 text-xs flex items-center gap-1 whitespace-nowrap"
                    >
                        {filter.label}: {filter.value}
                        <button
                            type="button"
                            onClick={() => removeFilter(filter.key)}
                            className="ml-1 hover:text-red-500"
                        >
                            ×
                        </button>
                    </Badge>
                ))}
            </div>

            <div className="flex items-center gap-x-2">
                <TableFilter count={appliedFilters.length}>
                    <StockMovementFilter
                        queryState={filterQueryState}
                        setQueryState={setFilterQueryState}
                        locations={locations}
                        products={products}
                    />
                </TableFilter>

                <ExportDialog
                    open={isExportDialogOpen}
                    setOpenAction={setIsExportDialogOpen}
                    onSubmitAction={onExport}
                />
            </div>
        </div>
    );
}

function StockMovementFilter({
    queryState,
    setQueryState,
    locations,
    products,
}: {
    queryState: {
        type:
        | "PURCHASE_RECEIPT"
        | "PURCHASE_RETURN_REVERSAL"
        | "SALES_RETURN"
        | "TRANSFER_IN"
        | "ADJUSTMENT_IN"
        | "PRODUCTION_IN"
        | "SALES_ISSUE"
        | "INTERNAL_CONSUMPTION"
        | "TRANSFER_OUT"
        | "ADJUSTMENT_OUT"
        | "DAMAGE_WRITEOFF"
        | "EXPIRY_WRITEOFF"
        | "THEFT_WRITEOFF"
        | "LOST_WRITEOFF"
        | "SAMPLE_ISSUE"
        | "STOCK_TAKE"
        | "OPENING_BALANCE"
        | "REVALUATION"
        | null;
        productId: string | null;
        locationId: string | null;
        startDate: string | null;
        endDate: string | null;
    };
    setQueryState: (state: Partial<typeof queryState>) => void;
    locations: { id: string; name: string }[];
    products: { id: string; name: string; sku: string }[];
}) {
    return (
        <div className="space-y-4 max-w-sm w-full grid grid-flow-dense">
            <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                    <DatePicker
                        initialDate={queryState.startDate ?? ""}
                        onChange={(date) => setQueryState({ startDate: date || null })}
                        placeholder="Start Date"
                    />
                    <DatePicker
                        initialDate={queryState.endDate ?? ""}
                        onChange={(date) => setQueryState({ endDate: date || null })}
                        placeholder="End Date"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Movement Type</Label>
                <Select
                    value={queryState.type ?? "all"}
                    onValueChange={(value) =>
                        setQueryState({ type: value === "all" ? null : value as any })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="PURCHASE_RECEIPT">Purchase Receipt</SelectItem>
                        <SelectItem value="PURCHASE_RETURN_REVERSAL">Purchase Return Reversal</SelectItem>
                        <SelectItem value="SALES_RETURN">Sales Return</SelectItem>
                        <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
                        <SelectItem value="ADJUSTMENT_IN">Adjustment In</SelectItem>
                        <SelectItem value="PRODUCTION_IN">Production In</SelectItem>
                        <SelectItem value="SALES_ISSUE">Sales Issue</SelectItem>
                        <SelectItem value="INTERNAL_CONSUMPTION">Internal Consumption</SelectItem>
                        <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
                        <SelectItem value="ADJUSTMENT_OUT">Adjustment Out</SelectItem>
                        <SelectItem value="DAMAGE_WRITEOFF">Damage Writeoff</SelectItem>
                        <SelectItem value="EXPIRY_WRITEOFF">Expiry Writeoff</SelectItem>
                        <SelectItem value="THEFT_WRITEOFF">Theft Writeoff</SelectItem>
                        <SelectItem value="LOST_WRITEOFF">Lost Writeoff</SelectItem>
                        <SelectItem value="SAMPLE_ISSUE">Sample Issue</SelectItem>
                        <SelectItem value="STOCK_TAKE">Stock Take</SelectItem>
                        <SelectItem value="OPENING_BALANCE">Opening Balance</SelectItem>
                        <SelectItem value="REVALUATION">Revaluation</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Location</Label>
                <Combobox
                    options={locations.map(l => ({ label: l.name, value: l.id }))}
                    value={queryState.locationId ?? ""}
                    onSelect={(value: any) => setQueryState({ locationId: value || null })}
                    placeholder="Select location"
                />
            </div>

            <div className="space-y-2">
                <Label>Product</Label>
                <Combobox
                    options={products.map(p => ({ label: p.name, value: p.id }))}
                    value={queryState.productId ?? ""}
                    onSelect={(value: any) => setQueryState({ productId: value || null })}
                    placeholder="Select product"
                />
            </div>
        </div>
    );
}
