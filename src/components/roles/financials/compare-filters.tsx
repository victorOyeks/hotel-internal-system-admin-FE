"use client";

import { useQueryStates, parseAsString } from "nuqs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";

export function CompareFilters() {
    const [queryState, setQueryState] = useQueryStates({
        period1Start: parseAsString,
        period1End: parseAsString,
        period2Start: parseAsString,
        period2End: parseAsString,
    });

    function handleReset() {
        setQueryState({
            period1Start: null,
            period1End: null,
            period2Start: null,
            period2End: null,
        });
    }

    return (
        <Card className="border border-primary-5/30">
            <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-end gap-4">
                    {/* Period 1 */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Period 1
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="p1Start" className="text-xs text-gray-500">
                                    Start Date
                                </Label>
                                <Input
                                    id="p1Start"
                                    type="date"
                                    value={queryState.period1Start ?? ""}
                                    onChange={(e) =>
                                        setQueryState({
                                            period1Start: e.target.value || null,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="p1End" className="text-xs text-gray-500">
                                    End Date
                                </Label>
                                <Input
                                    id="p1End"
                                    type="date"
                                    value={queryState.period1End ?? ""}
                                    onChange={(e) =>
                                        setQueryState({
                                            period1End: e.target.value || null,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider arrow */}
                    <div className="hidden md:flex items-center justify-center pb-1">
                        <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                    </div>

                    {/* Period 2 */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Period 2
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="p2Start" className="text-xs text-gray-500">
                                    Start Date
                                </Label>
                                <Input
                                    id="p2Start"
                                    type="date"
                                    value={queryState.period2Start ?? ""}
                                    onChange={(e) =>
                                        setQueryState({
                                            period2Start: e.target.value || null,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="p2End" className="text-xs text-gray-500">
                                    End Date
                                </Label>
                                <Input
                                    id="p2End"
                                    type="date"
                                    value={queryState.period2End ?? ""}
                                    onChange={(e) =>
                                        setQueryState({
                                            period2End: e.target.value || null,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pb-0.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
