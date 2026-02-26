"use client";

import type {
    FinancialDashboardResponse,
    FinancialDashboardGraphData,
    FinancialDashboardTopRevenueStream,
    FinancialDashboardTopExpenseCategory,
    Expenditure,
} from "@/lib/api-routes/financials";
import {
    DollarSignIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    WalletIcon,
    PercentIcon,
    BedDoubleIcon,
    BarChart3Icon,
    BuildingIcon,
    ArrowRightIcon,
    AlertTriangleIcon,
    ReceiptIcon,
    FileTextIcon,
    CreditCardIcon,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ResponsiveContainer,
    Pie,
    Cell,
    PieChart as RechartPieChart,
    BarChart,
    Bar,
    Tooltip,
    XAxis,
    YAxis,
    AreaChart,
    Area,
    CartesianGrid,
    Legend,
} from "recharts";
import Link from "next/link";
import { OverdueAlerts } from "./overdue-alerts";
import { useMemo } from "react";

// --- Types ---

interface RevenueBreakdown {
    totalRevenue: number;
    totalReceivedRevenue?: number | null;
    totalPendingRevenue?: number | null;
    roomBookingsRevenue: number;
    restaurantRevenue: number;
    laundryRevenue: number;
    rentalsRevenue: number;
    otherIncomeRevenue: number;
    revenueGrowthPercentage?: number | null;
    averageDailyRevenue?: number | null;
    revenueBySource?: Array<{
        source: string;
        amount: number;
        paidAmount?: number | null;
        pendingAmount?: number | null;
        transactionCount: number;
        percentage: number;
    }> | null;
}

interface FinancialsDashboardProps {
    metrics?: FinancialDashboardResponse;
    graphData?: FinancialDashboardGraphData[];
    revenueBreakdown?: RevenueBreakdown;
    overdueExpenditures?: Expenditure[];
}

// --- Shared Tooltip ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 z-50">
                <p className="font-medium mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium">
                            {typeof entry.value === "number"
                                ? formatCurrency(entry.value)
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Financial Alerts Banner ---

function FinancialAlertsBanner({
    alerts,
    overdueExpenditures,
}: {
    alerts?: string[] | null;
    overdueExpenditures?: Expenditure[];
}) {
    const hasAlerts = (alerts && alerts.length > 0) || (overdueExpenditures && overdueExpenditures.length > 0);
    if (!hasAlerts) return null;

    return (
        <div className="space-y-1">
            {overdueExpenditures && overdueExpenditures.length > 0 && (
                <OverdueAlerts overdueItems={overdueExpenditures} />
            )}
            {alerts && alerts.length > 0 &&
                alerts.map((alert, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-sm"
                    >
                        <AlertTriangleIcon className="size-4 text-amber-500 shrink-0" />
                        <p className="text-amber-700 dark:text-amber-400">{alert}</p>
                    </div>
                ))}
        </div>
    );
}

// --- KPI Metric Card ---

function KPICard({
    title,
    value,
    icon: Icon,
    growth,
    growthInverse,
    format = "currency",
    iconBg = "bg-green-500/20",
    iconColor = "text-secondary",
}: {
    title: string;
    value: number | null | undefined;
    icon: React.ElementType;
    growth?: number | null;
    growthInverse?: boolean;
    format?: "currency" | "percent" | "number";
    iconBg?: string;
    iconColor?: string;
}) {
    const safeValue = value ?? 0;

    let formattedValue: string;
    switch (format) {
        case "percent":
            formattedValue = `${safeValue.toFixed(1)}%`;
            break;
        case "number":
            formattedValue = safeValue.toLocaleString();
            break;
        default:
            formattedValue = formatCurrency(safeValue);
    }

    const isPositiveGrowth =
        growth != null && (growthInverse ? growth < 0 : growth > 0);
    const isNegativeGrowth =
        growth != null && (growthInverse ? growth > 0 : growth < 0);

    return (
        <div className="col-span-1 bg-white border border-primary-5/40 p-2 md:p-3 rounded-2xl md:rounded-3xl flex items-center space-x-2">
            <div
                className={cn(
                    "size-8 md:size-10 aspect-square rounded-full flex items-center justify-center",
                    iconBg,
                )}
            >
                <Icon className={cn("size-4 md:size-5", iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 truncate">{title}</p>
                <p className="text-sm md:text-lg text-primary font-semibold font-inter tracking-[0.01em] truncate">
                    {formattedValue}
                </p>
                {growth != null && (
                    <p
                        className={cn(
                            "text-xs flex items-center gap-0.5",
                            isPositiveGrowth && "text-green-600",
                            isNegativeGrowth && "text-red-500",
                            !isPositiveGrowth && !isNegativeGrowth && "text-gray-400",
                        )}
                    >
                        {isPositiveGrowth && <TrendingUpIcon className="size-3" />}
                        {isNegativeGrowth && <TrendingDownIcon className="size-3" />}
                        <span>
                            {growth > 0 ? "+" : ""}
                            {growth.toFixed(1)}%
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}

function KPIMetricsGrid({ metrics }: { metrics: FinancialDashboardResponse }) {
    return (
        <div className="space-y-2">
            {/* Row 1: Core Financial Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <KPICard
                    title="Total Revenue"
                    value={metrics.totalRevenue}
                    icon={DollarSignIcon}
                    growth={metrics.revenueGrowth}
                />
                <KPICard
                    title="Total Expenses"
                    value={metrics.totalExpenses}
                    icon={CreditCardIcon}
                    growth={metrics.expenseGrowth}
                    growthInverse
                    iconBg="bg-red-500/20"
                    iconColor="text-red-500"
                />
                <KPICard
                    title="Net Profit"
                    value={metrics.netProfit}
                    icon={TrendingUpIcon}
                    growth={metrics.profitGrowth}
                />
                <KPICard
                    title="Cash Balance"
                    value={metrics.cashBalance}
                    icon={WalletIcon}
                    iconBg="bg-blue-500/20"
                    iconColor="text-blue-500"
                />
            </div>

            {/* Row 2: Growth & Margins */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <KPICard
                    title="Revenue Growth"
                    value={metrics.revenueGrowth}
                    icon={TrendingUpIcon}
                    format="percent"
                    iconBg="bg-emerald-500/20"
                    iconColor="text-emerald-600"
                />
                <KPICard
                    title="Expense Growth"
                    value={metrics.expenseGrowth}
                    icon={TrendingDownIcon}
                    format="percent"
                    iconBg="bg-orange-500/20"
                    iconColor="text-orange-500"
                />
                <KPICard
                    title="Profit Growth"
                    value={metrics.profitGrowth}
                    icon={BarChart3Icon}
                    format="percent"
                    iconBg="bg-teal-500/20"
                    iconColor="text-teal-600"
                />
                <KPICard
                    title="Profit Margin"
                    value={metrics.netProfitMargin}
                    icon={PercentIcon}
                    format="percent"
                    iconBg="bg-purple-500/20"
                    iconColor="text-purple-500"
                />
            </div>

            {/* Row 3: Hotel KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <KPICard
                    title="Occupancy Rate"
                    value={metrics.occupancyRate}
                    icon={BedDoubleIcon}
                    format="percent"
                    iconBg="bg-indigo-500/20"
                    iconColor="text-indigo-500"
                />
                <KPICard
                    title="Avg Daily Rate"
                    value={metrics.averageDailyRate}
                    icon={BuildingIcon}
                    iconBg="bg-sky-500/20"
                    iconColor="text-sky-500"
                />
                <KPICard
                    title="RevPAR"
                    value={metrics.revenuePerAvailableRoom}
                    icon={BarChart3Icon}
                    iconBg="bg-violet-500/20"
                    iconColor="text-violet-500"
                />
                <KPICard
                    title="Avg Rev/Txn"
                    value={metrics.averageRevenuePerTransaction}
                    icon={ReceiptIcon}
                    iconBg="bg-rose-500/20"
                    iconColor="text-rose-500"
                />
            </div>
        </div>
    );
}

// --- Profit Trend Section ---

function ProfitTrendSection({
    graphData,
    netProfit,
    profitGrowth,
}: {
    graphData: FinancialDashboardGraphData[];
    netProfit: number;
    profitGrowth?: number | null;
}) {
    if (graphData.length === 0) {
        return (
            <Card className="h-full border-primary-5/40">
                <CardHeader>
                    <CardTitle>Net Profit Trend</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    No trend data available for the selected period.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="bg-white py-4 px-2 md:py-6 md:px-5 rounded-3xl space-y-4 border border-primary-5/40">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-primary">
                    {formatCurrency(netProfit)}
                </h1>
                <p className="text-gray-500 text-sm flex items-center space-x-1">
                    <span>Net Profit</span>
                    {profitGrowth != null && (
                        <span
                            className={cn(
                                "font-semibold flex items-center space-x-1",
                                profitGrowth >= 0
                                    ? "text-green-500"
                                    : "text-red-500",
                            )}
                        >
                            {profitGrowth >= 0 ? (
                                <TrendingUpIcon className="inline size-4" />
                            ) : (
                                <TrendingDownIcon className="inline size-4" />
                            )}
                            <span>
                                {profitGrowth > 0 ? "+" : ""}
                                {profitGrowth.toFixed(1)}%
                            </span>
                        </span>
                    )}
                </p>
            </div>

            <div className="h-52 md:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={graphData}
                        margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="profitGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#22c55e"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#22c55e"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e5e5e5"
                        />
                        <XAxis
                            dataKey="periodLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 12,
                                fill: "#9ca3af",
                            }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 11,
                                fill: "#9ca3af",
                            }}
                            tickFormatter={(v) => formatCurrency(v, "short")}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            name="Net Profit"
                            stroke="#22c55e"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#profitGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// --- Receivables & Payables Card ---

function ReceivablesPayablesCard({
    metrics,
}: {
    metrics: FinancialDashboardResponse;
}) {
    const items = [
        {
            label: "Outstanding Receivables",
            value: metrics.totalOutstandingReceivables,
            color: "text-amber-600",
            isCurrency: true,
        },
        {
            label: "Overdue Payables",
            value: metrics.totalOverduePayables,
            color: "text-red-500",
            isCurrency: true,
        },
        {
            label: "Overdue Bills",
            value: metrics.overdueExpendituresCount,
            color: "text-red-500",
            isCurrency: false,
        },
        {
            label: "Customer Transactions",
            value: metrics.totalCustomerTransactions,
            color: "text-primary",
            isCurrency: false,
        },
    ];

    return (
        <Card className="h-full border-primary-5/40 py-4 gap-3">
            <CardHeader className="pb-0">
                <CardTitle className="text-base">
                    Receivables & Payables
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between"
                    >
                        <span className="text-sm text-gray-500">
                            {item.label}
                        </span>
                        <span className={cn("text-sm font-semibold", item.color)}>
                            {item.isCurrency
                                ? formatCurrency(item.value ?? 0)
                                : (item.value ?? 0).toLocaleString()}
                        </span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// --- Revenue by Source Chart ---

const CHART_COLORS = [
    "#4c091e",
    "#297045",
    "#6366f1",
    "#f59e0b",
    "#ec4899",
    "#0ea5e9",
    "#8b5cf6",
    "#14b8a6",
];

function RevenueBySourceChart({
    streams,
}: {
    streams?: FinancialDashboardTopRevenueStream[] | null;
}) {
    const data = useMemo(
        () =>
            (streams ?? []).map((s) => ({
                name: s.source,
                paid: s.paidAmount ?? 0,
                pending: s.pendingAmount ?? 0,
                refunded: s.refundedAmount ?? 0,
                total: s.amount,
                percentage: s.percentage,
            })),
        [streams],
    );

    if (data.length === 0) {
        return (
            <Card className="h-full border-primary-5/40">
                <CardHeader>
                    <CardTitle className="text-base">Revenue by Source</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    No revenue source data available.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-primary-5/40">
            <CardHeader>
                <CardTitle className="text-base">Revenue by Source</CardTitle>
                <CardDescription>Breakdown by payment status</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                                stroke="#e5e5e5"
                            />
                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fontSize: 11,
                                    fill: "#9ca3af",
                                }}
                                tickFormatter={(v) => formatCurrency(v, "short")}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fontSize: 11,
                                    fill: "#9ca3af",
                                }}
                                width={90}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            <Legend
                                wrapperStyle={{ paddingTop: "10px" }}
                                formatter={(v) => (
                                    <span className="text-xs text-muted-foreground">
                                        {v}
                                    </span>
                                )}
                            />
                            <Bar
                                dataKey="paid"
                                name="Paid"
                                stackId="a"
                                fill="#22c55e"
                            />
                            <Bar
                                dataKey="pending"
                                name="Pending"
                                stackId="a"
                                fill="#f59e0b"
                            />
                            <Bar
                                dataKey="refunded"
                                name="Refunded"
                                stackId="a"
                                fill="#ef4444"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend with percentages */}
                <div className="mt-3 space-y-1.5">
                    {data.map((item, i) => (
                        <div
                            key={item.name}
                            className="flex items-center justify-between text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                        backgroundColor:
                                            CHART_COLORS[
                                                i % CHART_COLORS.length
                                            ],
                                    }}
                                />
                                <span className="text-gray-600">
                                    {item.name}
                                </span>
                                <span className="text-gray-400 text-xs">
                                    ({item.percentage.toFixed(1)}%)
                                </span>
                            </div>
                            <span className="font-medium text-primary">
                                {formatCurrency(item.total)}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// --- Expense by Category Chart ---

function ExpenseByCategoryChart({
    categories,
}: {
    categories?: FinancialDashboardTopExpenseCategory[] | null;
}) {
    const data = useMemo(
        () =>
            (categories ?? []).map((c) => ({
                name: c.categoryDisplay ?? c.category,
                value: c.amount,
                percentage: c.percentage,
                paid: c.paidAmount ?? 0,
                pending: c.pendingAmount ?? 0,
                overdue: c.overdueAmount ?? 0,
            })),
        [categories],
    );

    if (data.length === 0) {
        return (
            <Card className="h-full border-primary-5/40">
                <CardHeader>
                    <CardTitle className="text-base">
                        Expense Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    No expense category data available.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-primary-5/40">
            <CardHeader>
                <CardTitle className="text-base">Expense Breakdown</CardTitle>
                <CardDescription>
                    By category with payment status
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartPieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                dataKey="value"
                                nameKey="name"
                                labelLine={false}
                            >
                                {data.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={
                                            CHART_COLORS[
                                                i % CHART_COLORS.length
                                            ]
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) =>
                                    formatCurrency(value)
                                }
                            />
                        </RechartPieChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-2">
                    {data.map((item, i) => (
                        <div key={item.name} className="space-y-0.5">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{
                                            backgroundColor:
                                                CHART_COLORS[
                                                    i % CHART_COLORS.length
                                                ],
                                        }}
                                    />
                                    <span className="text-gray-600 truncate">
                                        {item.name}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        ({item.percentage.toFixed(1)}%)
                                    </span>
                                </div>
                                <span className="font-medium text-primary">
                                    {formatCurrency(item.value)}
                                </span>
                            </div>
                            {(item.paid > 0 ||
                                item.pending > 0 ||
                                item.overdue > 0) && (
                                <div className="flex gap-3 pl-5 text-xs text-gray-400">
                                    {item.paid > 0 && (
                                        <span className="text-green-600">
                                            Paid: {formatCurrency(item.paid)}
                                        </span>
                                    )}
                                    {item.pending > 0 && (
                                        <span className="text-amber-500">
                                            Pending:{" "}
                                            {formatCurrency(item.pending)}
                                        </span>
                                    )}
                                    {item.overdue > 0 && (
                                        <span className="text-red-500">
                                            Overdue:{" "}
                                            {formatCurrency(item.overdue)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// --- Revenue vs Expenses Trend Chart ---

function RevenueExpensesTrendChart({
    graphData,
}: {
    graphData: FinancialDashboardGraphData[];
}) {
    if (graphData.length === 0) {
        return (
            <Card className="h-full border-primary-5/40">
                <CardHeader>
                    <CardTitle className="text-base">
                        Revenue vs Expenses
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    No trend data available.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-primary-5/40">
            <CardHeader>
                <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
                <CardDescription>Performance over time</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={graphData}
                            margin={{
                                top: 10,
                                right: 0,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e5e5"
                            />
                            <XAxis
                                dataKey="periodLabel"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fontSize: 11,
                                    fill: "#9ca3af",
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fontSize: 11,
                                    fill: "#9ca3af",
                                }}
                                tickFormatter={(v) =>
                                    formatCurrency(v, "short")
                                }
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={false}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: "10px" }}
                                formatter={(v) => (
                                    <span className="text-xs text-muted-foreground">
                                        {v}
                                    </span>
                                )}
                            />
                            <Bar
                                dataKey="revenue"
                                name="Revenue"
                                fill="#297045"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={35}
                            />
                            <Bar
                                dataKey="expenses"
                                name="Expenses"
                                fill="#ef4444"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={35}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Transaction Volume Chart ---

function TransactionVolumeChart({
    graphData,
}: {
    graphData: FinancialDashboardGraphData[];
}) {
    const data = useMemo(
        () =>
            graphData
                .filter((d) => d.transactionCount != null)
                .map((d) => ({
                    period: d.periodLabel ?? "",
                    count: d.transactionCount ?? 0,
                })),
        [graphData],
    );

    if (data.length === 0) return null;

    return (
        <Card className="h-full border-primary-5/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Transaction Volume</CardTitle>
                <CardDescription>
                    Number of transactions per period
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 0,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e5e5"
                            />
                            <XAxis
                                dataKey="period"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fontSize: 11,
                                    fill: "#9ca3af",
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fontSize: 11,
                                    fill: "#9ca3af",
                                }}
                            />
                            <Tooltip
                                formatter={(value: number) => [
                                    value.toLocaleString(),
                                    "Transactions",
                                ]}
                                cursor={false}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderRadius: "8px",
                                    border: "1px solid hsl(var(--border))",
                                }}
                            />
                            <Bar
                                dataKey="count"
                                name="Transactions"
                                fill="#6366f1"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={30}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Quick Access Links ---

function QuickAccessLinks() {
    const links = [
        {
            label: "Expenditures",
            href: "/financials/expenditures",
            icon: CreditCardIcon,
        },
        {
            label: "Other Income",
            href: "/financials/other-income",
            icon: DollarSignIcon,
        },
        {
            label: "Reports",
            href: "/financials/reports",
            icon: FileTextIcon,
        },
        {
            label: "Overdue Bills",
            href: "/financials/expenditures/overdue",
            icon: AlertTriangleIcon,
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {links.map((link) => (
                <Button
                    key={link.href}
                    variant="outline"
                    asChild
                    className="h-auto py-3 px-4 rounded-xl md:rounded-2xl border-primary-5/40 hover:bg-primary-5/10 justify-start gap-2"
                >
                    <Link href={link.href}>
                        <link.icon className="size-4 text-primary" />
                        <span className="text-sm font-medium">
                            {link.label}
                        </span>
                        <ArrowRightIcon className="size-3 ml-auto text-gray-400" />
                    </Link>
                </Button>
            ))}
        </div>
    );
}

// --- Main Dashboard Component ---

export function FinancialsDashboard({
    metrics,
    graphData = [],
    revenueBreakdown,
    overdueExpenditures = [],
}: FinancialsDashboardProps) {
    if (!metrics) return null;

    return (
        <div className="space-y-4">
            {/* Alerts */}
            <FinancialAlertsBanner
                alerts={metrics.financialAlerts}
                overdueExpenditures={overdueExpenditures}
            />

            {/* KPI Grid (3 rows of 4 cards) */}
            <KPIMetricsGrid metrics={metrics} />

            {/* Quick Access Links */}
            <QuickAccessLinks />

            {/* Profit Trend + Receivables */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                    <ProfitTrendSection
                        graphData={graphData}
                        netProfit={metrics.netProfit}
                        profitGrowth={metrics.profitGrowth}
                    />
                </div>
                <div className="lg:col-span-4">
                    <ReceivablesPayablesCard metrics={metrics} />
                </div>
            </div>

            {/* Revenue by Source + Expense Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RevenueBySourceChart streams={metrics.topRevenueStreams} />
                <ExpenseByCategoryChart
                    categories={metrics.topExpenseCategories}
                />
            </div>

            {/* Revenue vs Expenses Trend + Transaction Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                    <RevenueExpensesTrendChart graphData={graphData} />
                </div>
                <div className="lg:col-span-4">
                    <TransactionVolumeChart graphData={graphData} />
                </div>
            </div>
        </div>
    );
}
