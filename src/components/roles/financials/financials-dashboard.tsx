"use client";

import {
    DollarSign,
    CreditCardIcon,
    WalletIcon,
    PieChartIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    ArrowRightToLineIcon,
    type LucideIcon,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend
} from "recharts";
import { formatCurrency } from "@/lib/utils";

// Types matching the actions we defined
interface FinancialDashboardMetrics {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    grossProfitMargin: number;
    revenueGrowth: number;
    expenseGrowth: number;
    occupancyRate: number;
    revPAR: number;
    adr: number;
}

interface FinancialDashboardGraphData {
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
}

interface FinancialsDashboardProps {
    metrics?: FinancialDashboardMetrics;
    graphData?: FinancialDashboardGraphData[];
}

import Link from "next/link";
import { cn } from "@/lib/utils";

// Minimal Metric Card Component
function MetricCard({
    title,
    value,
    icon: Icon,
    subtitle,
    trend,
    href,
    actionLabel,
    className
}: {
    title: string;
    value: string | number;
    icon: LucideIcon;
    subtitle?: string;
    trend?: { value: number; direction: "up" | "down" };
    href?: string;
    actionLabel?: string;
    className?: string;
}) {
    return (
        <div className={cn("bg-white p-5 rounded-2xl border border-border flex flex-col justify-between h-full", className)}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <Icon className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight truncate" title={value.toString()}>
                    {value}
                </h3>

                <div className="flex items-center gap-2 text-xs">
                    {trend && (
                        <span className={cn(
                            "flex items-center gap-0.5 font-medium",
                            trend.direction === "up" ? "text-green-600" : "text-red-600"
                        )}>
                            {trend.direction === "up" ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
                            {trend.value}%
                        </span>
                    )}
                    {subtitle && (
                        <span className="text-muted-foreground truncate">{subtitle}</span>
                    )}
                </div>
            </div>

            {href && actionLabel && (
                <div className="mt-4 pt-3 border-t border-dashed">
                    <Link
                        href={href}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                        {actionLabel} <ArrowRightToLineIcon className="w-3 h-3" />
                    </Link>
                </div>
            )}
        </div>
    );
}

function MetricsCards({ metrics }: { metrics?: FinancialDashboardMetrics }) {
    if (!metrics) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
                title="Total Revenue"
                value={formatCurrency(metrics.totalRevenue)}
                icon={DollarSign}
                trend={metrics.revenueGrowth ? { value: Math.abs(metrics.revenueGrowth), direction: metrics.revenueGrowth >= 0 ? "up" : "down" } : undefined}
                subtitle="Gross revenue for period"
            />
            <MetricCard
                title="Total Expenses"
                value={formatCurrency(metrics.totalExpenses)}
                icon={CreditCardIcon}
                trend={metrics.expenseGrowth ? { value: Math.abs(metrics.expenseGrowth), direction: metrics.expenseGrowth >= 0 ? "up" : "down" } : undefined} // Expense growth up is usually bad visually but we track direction
                subtitle="Total expenditure"
                href="/dashboard/financials/expenditures"
                actionLabel="View Expenses"
            />
            <MetricCard
                title="Net Profit"
                value={formatCurrency(metrics.netProfit)}
                icon={WalletIcon}
                subtitle="Revenue less expenses"
            />
            <MetricCard
                title="Gross Margin"
                value={`${(metrics.grossProfitMargin * 100).toFixed(1)}%`}
                icon={PieChartIcon}
                subtitle="Profitability ratio"
            />
        </div>
    );
}

function RevenueExpenseChart({ data }: { data: FinancialDashboardGraphData[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickFormatter={(value) => formatCurrency(value, "short")}
                />
                <Tooltip
                    cursor={{ fill: "#F9FAFB" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "none" }}
                    formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
        </ResponsiveContainer>
    );
}

function ProfitTrendChart({ data }: { data: FinancialDashboardGraphData[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickFormatter={(value) => formatCurrency(value, "short")}
                />
                <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "none" }}
                    formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                <Line
                    type="monotone"
                    dataKey="profit"
                    name="Net Profit"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}


export function FinancialsDashboard({ metrics, graphData = [] }: FinancialsDashboardProps) {

    return (
        <div className="space-y-6">
            <MetricsCards metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-primary-5/10">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-primary">Revenue vs Expenses</h3>
                        <p className="text-sm text-gray-400">Overview of financial performance over time</p>
                    </div>
                    <RevenueExpenseChart data={graphData} />
                </div>

                <div className="bg-white p-6 rounded-3xl border border-primary-5/10">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-primary">Profit Trend</h3>
                        <p className="text-sm text-gray-400">Net profit trend over time</p>
                    </div>
                    <ProfitTrendChart data={graphData} />
                </div>
            </div>
        </div>
    );
}
