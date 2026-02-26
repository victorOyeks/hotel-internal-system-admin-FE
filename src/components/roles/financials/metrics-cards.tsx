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
import { cn, formatCurrency } from "@/lib/utils";

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
                trend={metrics.profitGrowth}
                format="currency"
            />
            <MetricCard
                title="Profit Margin"
                value={metrics.netProfitMargin}
                icon={PercentIcon}
                format="percent"
            />
            <MetricCard
                title="RevPAR"
                value={metrics.revenuePerAvailableRoom}
                icon={TrendingUpIcon}
                format="currency"
            />
            <MetricCard
                title="ADR"
                value={metrics.averageDailyRate}
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
    value: number | null | undefined;
    icon: React.ElementType;
    trend?: number | null;
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
    const safeValue = value ?? 0;
    const formattedValue =
        format === "currency"
            ? formatCurrency(safeValue)
            : format === "percent"
                ? `${safeValue.toFixed(1)}%`
                : safeValue.toLocaleString();

    const isPositive = trend != null && trend > 0;
    const isNegative = trend != null && trend < 0;

    let trendColor = "text-muted-foreground";
    if (trend != null && trend !== 0) {
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
                {trend != null && (
                    <p className={cn("text-xs flex items-center mt-1", trendColor)}>
                        {isPositive ? (
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                        ) : isNegative ? (
                            <ArrowDownIcon className="h-3 w-3 mr-1" />
                        ) : null}
                        <span className="font-medium">{Math.abs(trend).toFixed(1)}%</span>
                        <span className="text-muted-foreground ml-1">
                            from last period
                        </span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
