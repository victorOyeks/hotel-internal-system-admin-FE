"use client";

import { useState } from "react";
import { useQueryStates, parseAsString } from "nuqs";
import { TableFilter } from "@/components/shared/table-filter";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

export function FinancialFilters() {
    const [queryState, setQueryState] = useQueryStates({
        startDate: parseAsString,
        endDate: parseAsString,
        period: parseAsString,
    });

    const [open, setOpen] = useState(false);

    const activeFilterCount =
        (queryState.startDate ? 1 : 0) +
        (queryState.endDate ? 1 : 0) +
        (queryState.period ? 1 : 0);

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <TableFilter open={open} setOpen={setOpen} count={activeFilterCount}>
                <div className="flex flex-col gap-y-4 w-[280px]">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Start Date</h4>
                        <input
                            type="date"
                            value={queryState.startDate ?? ""}
                            onChange={(e) =>
                                setQueryState({
                                    startDate: e.target.value || null,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">End Date</h4>
                        <input
                            type="date"
                            value={queryState.endDate ?? ""}
                            onChange={(e) =>
                                setQueryState({
                                    endDate: e.target.value || null,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Period</h4>
                        <Select
                            value={queryState.period ?? "all"}
                            onValueChange={(value) =>
                                setQueryState({
                                    period: value === "all" ? null : value,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All periods" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Periods</SelectItem>
                                <SelectItem value="day">Daily</SelectItem>
                                <SelectItem value="week">Weekly</SelectItem>
                                <SelectItem value="month">Monthly</SelectItem>
                                <SelectItem value="year">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setQueryState({
                                    startDate: null,
                                    endDate: null,
                                    period: null,
                                });
                            }}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                setOpen(false);
                            }}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </TableFilter>

            {/* Applied Filters Display */}
            {activeFilterCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                    {queryState.startDate && (
                        <span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                            From: {queryState.startDate}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                    setQueryState({ startDate: null })
                                }
                            >
                                <XIcon className="h-3 w-3" />
                            </Button>
                        </span>
                    )}
                    {queryState.endDate && (
                        <span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                            To: {queryState.endDate}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                    setQueryState({ endDate: null })
                                }
                            >
                                <XIcon className="h-3 w-3" />
                            </Button>
                        </span>
                    )}
                    {queryState.period && (
                        <span className="inline-flex items-center gap-1 bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                            Period: {queryState.period}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                    setQueryState({ period: null })
                                }
                            >
                                <XIcon className="h-3 w-3" />
                            </Button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
