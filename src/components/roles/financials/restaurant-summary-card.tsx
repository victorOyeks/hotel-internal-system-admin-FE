"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Utensils, Coffee, DollarSign } from "lucide-react";

interface RestaurantSummaryProps {
    data: any; // Replace with proper type when available from API
}

export function RestaurantDailySummaryCard({ data }: RestaurantSummaryProps) {
    if (!data) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Restaurant Daily Summary
                </CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                    Today's total sales
                </p>
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                            <Coffee className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Room Charges</span>
                        </div>
                        <span className="font-medium">{formatCurrency(data.roomCharges || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                            <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Cash/Card</span>
                        </div>
                        <span className="font-medium">{formatCurrency(data.directPayments || 0)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
