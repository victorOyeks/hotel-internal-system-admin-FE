"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, Activity } from "lucide-react";
import type { ComprehensiveSummaryData } from "@/lib/api-routes/financials";

interface ComprehensiveSummaryProps {
    data: ComprehensiveSummaryData | null;
}

export function ComprehensiveSummary({ data }: ComprehensiveSummaryProps) {
    if (!data) return null;

    // Using placeholder logic since we don't know the exact shape yet, 
    // assuming it has standard summary fields
    const { netProfit, totalRevenue, totalExpenses, occupancyRate } = data;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Revenue"
                    value={formatCurrency(totalRevenue || 0)}
                    icon={DollarSign}
                    className="bg-primary/5 text-primary border-primary/20"
                />
                <SummaryCard
                    title="Total Expenses"
                    value={formatCurrency(totalExpenses || 0)}
                    icon={Activity}
                    className="text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                />
                <SummaryCard
                    title="Net Profit"
                    value={formatCurrency(netProfit || 0)}
                    icon={TrendingUp}
                    className="text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                />
                <SummaryCard
                    title="Occupancy Rate"
                    value={`${occupancyRate || 0}%`}
                    icon={Activity}
                />
            </div>

            <Card className="border border-primary-5/40 py-2 md:rounded-3xl overflow-clip gap-x-0 mt-6">
                <CardHeader>
                    <CardTitle>
                        <h2 className="text-primary text-xl">Executive Summary</h2>
                    </CardTitle>
                    <CardDescription>High-level overview of financial health.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-muted-foreground text-sm">
                        <p>
                            During this period, the property generated <strong>{formatCurrency(totalRevenue || 0)}</strong> in revenue
                            against <strong>{formatCurrency(totalExpenses || 0)}</strong> in expenses, resulting in a net profit of
                            <strong>{formatCurrency(netProfit || 0)}</strong>. The occupancy rate stands at <strong>{occupancyRate || 0}%</strong>.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface SummaryCardProps {
    title: string;
    value: React.ReactNode;
    icon: React.ElementType;
    className?: string;
}

function SummaryCard({ title, value, icon: Icon, className }: SummaryCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}
