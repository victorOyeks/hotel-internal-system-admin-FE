"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    DollarSignIcon,
    PercentIcon,
    TrendingUpIcon,
    WalletIcon,
    CreditCardIcon,
    ActivityIcon,
} from "lucide-react";
import type { FinancialDashboardMetrics } from "@/lib/api-routes/financials";
import { cn } from "@/lib/utils";

interface MetricsCardsProps {
    metrics: FinancialDashboardMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
                title="Total Revenue"
                value={metrics.totalRevenue}
                icon={DollarSignIcon}
                trend={metrics.revenueGrowth}
                format="currency"
            />
            <MetricCard
                title="Total Expenses"
                value={metrics.totalExpenses}
                icon={CreditCardIcon}
                trend={metrics.expenseGrowth}
                trendInverse
                format="currency"
            />
            <MetricCard
                title="Net Profit"
                value={metrics.netProfit}
                icon={WalletIcon}
                trend={metrics.revenueGrowth} // Assuming profit growth follows revenue for now, or calculate generic trend
                format="currency"
            />
            <MetricCard
                title="Gross Profit Margin"
                value={metrics.grossProfitMargin}
                icon={PercentIcon}
                format="percent"
            />
            <MetricCard
                title="RevPAR"
                value={metrics.revPAR}
                icon={TrendingUpIcon}
                format="currency"
            />
            <MetricCard
                title="ADR"
                value={metrics.adr}
                icon={ActivityIcon}
                format="currency"
            />
            <MetricCard
                title="Occupancy Rate"
                value={metrics.occupancyRate}
                icon={ActivityIcon}
                format="percent"
            />
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    trend?: number;
    trendInverse?: boolean;
    format?: "currency" | "percent" | "number";
}

function MetricCard({
    title,
    value,
    icon: Icon,
    trend,
    trendInverse,
    format = "number",
}: MetricCardProps) {
    const formattedValue =
        format === "currency"
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(value)
            : format === "percent"
                ? `${value.toFixed(1)}%`
                : value.toLocaleString();

    const isPositive = trend && trend > 0;
    const isNegative = trend && trend < 0;

    // validation for trendInverse: if true, positive trend is bad (red), negative is good (green)
    // default: positive is good (green), negative is bad (red)

    let trendColor = "text-muted-foreground";
    if (trend !== undefined && trend !== 0) {
        if (trendInverse) {
            trendColor = isPositive ? "text-red-500" : "text-emerald-500";
        } else {
            trendColor = isPositive ? "text-emerald-500" : "text-red-500";
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formattedValue}</div>
                {trend !== undefined && (
                    <p className={cn("text-xs flex items-center mt-1", trendColor)}>
                        {isPositive ? (
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                        ) : isNegative ? (
                            <ArrowDownIcon className="h-3 w-3 mr-1" />
                        ) : null}
                        <span className="font-medium">{Math.abs(trend)}%</span>
                        <span className="text-muted-foreground ml-1">
                            from last period
                        </span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
