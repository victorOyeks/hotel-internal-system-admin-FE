"use client";

import { useMemo, useState } from "react";
import { useQueryStates, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    AreaChart,
    Area,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";
import {
    TrendingUpIcon,
    TrendingDownIcon,
    MinusIcon,
    ArrowLeftRightIcon,
    CalendarIcon,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import type { PeriodComparisonData } from "@/lib/financials-actions";
import type { FinancialDashboardResponse } from "@/lib/api-routes/financials";

// ─── Shared palette ───────────────────────────────────────────────────────────

const P1_COLOR = "#4c091e";
const P2_COLOR = "#6366f1";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const CompareTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 z-50 text-sm">
            <p className="font-medium mb-2">{label}</p>
            {payload.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: e.color }}
                    />
                    <span className="text-muted-foreground">{e.name}:</span>
                    <span className="font-medium">
                        {typeof e.value === "number"
                            ? formatCurrency(e.value)
                            : e.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Section 1: KPI comparison cards ─────────────────────────────────────────

interface KPICardProps {
    title: string;
    value1: number | null | undefined;
    value2: number | null | undefined;
    p1Label: string;
    p2Label: string;
    format?: "currency" | "percent" | "number";
    higherIsBetter?: boolean;
}

function fmt(
    value: number | null | undefined,
    format: "currency" | "percent" | "number",
): string {
    const v = value ?? 0;
    if (format === "percent") return `${v.toFixed(1)}%`;
    if (format === "number") return v.toLocaleString();
    return formatCurrency(v);
}

function ComparisonKPICard({
    title,
    value1,
    value2,
    p1Label,
    p2Label,
    format = "currency",
    higherIsBetter = true,
}: KPICardProps) {
    const v1 = value1 ?? 0;
    const v2 = value2 ?? 0;
    const delta = v1 - v2;
    const deltaAbs = Math.abs(v2) > 0 ? (delta / Math.abs(v2)) * 100 : 0;
    const positive = higherIsBetter ? delta > 0 : delta < 0;
    const neutral = delta === 0;

    return (
        <div className="bg-white border border-primary-5/40 p-3 md:p-4 rounded-2xl space-y-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide truncate">
                {title}
            </p>

            {/* Values row */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <p className="text-xs text-gray-400 truncate">{p1Label}</p>
                    <p className="text-base font-semibold text-primary truncate">
                        {fmt(value1, format)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 truncate">{p2Label}</p>
                    <p className="text-base font-semibold text-gray-500 truncate">
                        {fmt(value2, format)}
                    </p>
                </div>
            </div>

            {/* Delta badge */}
            <div
                className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                    neutral
                        ? "bg-gray-100 text-gray-500"
                        : positive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600",
                )}
            >
                {neutral ? (
                    <MinusIcon className="size-3" />
                ) : positive ? (
                    <TrendingUpIcon className="size-3" />
                ) : (
                    <TrendingDownIcon className="size-3" />
                )}
                <span>
                    {delta > 0 ? "+" : ""}
                    {fmt(delta, format)}{" "}
                    {Math.abs(deltaAbs) > 0 &&
                        `(${deltaAbs > 0 ? "+" : ""}${deltaAbs.toFixed(1)}%)`}
                </span>
            </div>
        </div>
    );
}

function KPIGrid({
    p1,
    p2,
    p1Label,
    p2Label,
}: {
    p1: FinancialDashboardResponse;
    p2: FinancialDashboardResponse;
    p1Label: string;
    p2Label: string;
}) {
    const metrics: KPICardProps[] = [
        {
            title: "Total Revenue",
            value1: p1.totalRevenue,
            value2: p2.totalRevenue,
            p1Label,
            p2Label,
            format: "currency",
            higherIsBetter: true,
        },
        {
            title: "Total Expenses",
            value1: p1.totalExpenses,
            value2: p2.totalExpenses,
            p1Label,
            p2Label,
            format: "currency",
            higherIsBetter: false,
        },
        {
            title: "Net Profit",
            value1: p1.netProfit,
            value2: p2.netProfit,
            p1Label,
            p2Label,
            format: "currency",
            higherIsBetter: true,
        },
        {
            title: "Profit Margin",
            value1: p1.netProfitMargin,
            value2: p2.netProfitMargin,
            p1Label,
            p2Label,
            format: "percent",
            higherIsBetter: true,
        },
        {
            title: "Cash Balance",
            value1: p1.cashBalance,
            value2: p2.cashBalance,
            p1Label,
            p2Label,
            format: "currency",
            higherIsBetter: true,
        },
        {
            title: "Occupancy Rate",
            value1: p1.occupancyRate,
            value2: p2.occupancyRate,
            p1Label,
            p2Label,
            format: "percent",
            higherIsBetter: true,
        },
        {
            title: "Avg Daily Rate",
            value1: p1.averageDailyRate,
            value2: p2.averageDailyRate,
            p1Label,
            p2Label,
            format: "currency",
            higherIsBetter: true,
        },
        {
            title: "RevPAR",
            value1: p1.revenuePerAvailableRoom,
            value2: p2.revenuePerAvailableRoom,
            p1Label,
            p2Label,
            format: "currency",
            higherIsBetter: true,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.map((m) => (
                <ComparisonKPICard key={m.title} {...m} />
            ))}
        </div>
    );
}

// ─── Section 2: Grouped bar chart ─────────────────────────────────────────────

function GroupedBarChart({
    p1,
    p2,
    p1Label,
    p2Label,
}: {
    p1: FinancialDashboardResponse;
    p2: FinancialDashboardResponse;
    p1Label: string;
    p2Label: string;
}) {
    const data = [
        { metric: "Revenue", p1: p1.totalRevenue, p2: p2.totalRevenue },
        { metric: "Expenses", p1: p1.totalExpenses, p2: p2.totalExpenses },
        { metric: "Net Profit", p1: p1.netProfit, p2: p2.netProfit },
        {
            metric: "Cash Balance",
            p1: p1.cashBalance ?? 0,
            p2: p2.cashBalance ?? 0,
        },
    ];

    return (
        <Card className="border-primary-5/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Key Metrics Comparison</CardTitle>
                <CardDescription>
                    Side-by-side view of core financials
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e5e5"
                            />
                            <XAxis
                                dataKey="metric"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                tickFormatter={(v) => formatCurrency(v, "short")}
                            />
                            <Tooltip
                                content={<CompareTooltip />}
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
                                dataKey="p1"
                                name={p1Label}
                                fill={P1_COLOR}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={32}
                            />
                            <Bar
                                dataKey="p2"
                                name={p2Label}
                                fill={P2_COLOR}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Section 3: Radar chart — revenue by source ───────────────────────────────

function RevenueRadarChart({
    p1,
    p2,
    p1Label,
    p2Label,
}: {
    p1: FinancialDashboardResponse;
    p2: FinancialDashboardResponse;
    p1Label: string;
    p2Label: string;
}) {
    const radarData = useMemo(() => {
        const p1Map = new Map(
            (p1.topRevenueStreams ?? []).map((s) => [s.source, s.amount]),
        );
        const p2Map = new Map(
            (p2.topRevenueStreams ?? []).map((s) => [s.source, s.amount]),
        );
        const sources = Array.from(
            new Set([...p1Map.keys(), ...p2Map.keys()]),
        );
        return sources.map((src) => ({
            source: src,
            [p1Label]: p1Map.get(src) ?? 0,
            [p2Label]: p2Map.get(src) ?? 0,
        }));
    }, [p1, p2, p1Label, p2Label]);

    if (radarData.length === 0) return null;

    return (
        <Card className="border-primary-5/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">
                    Revenue Source Comparison
                </CardTitle>
                <CardDescription>
                    Revenue stream distribution across both periods
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                            data={radarData}
                            margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                        >
                            <PolarGrid stroke="#e5e5e5" />
                            <PolarAngleAxis
                                dataKey="source"
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                            />
                            <PolarRadiusAxis
                                tick={{ fontSize: 10, fill: "#9ca3af" }}
                                tickFormatter={(v) => formatCurrency(v, "short")}
                            />
                            <Radar
                                name={p1Label}
                                dataKey={p1Label}
                                stroke={P1_COLOR}
                                fill={P1_COLOR}
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                            <Radar
                                name={p2Label}
                                dataKey={p2Label}
                                stroke={P2_COLOR}
                                fill={P2_COLOR}
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: "8px" }}
                                formatter={(v) => (
                                    <span className="text-xs text-muted-foreground">
                                        {v}
                                    </span>
                                )}
                            />
                            <Tooltip
                                formatter={(v: number) => formatCurrency(v)}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Section 4: Trend overlay area chart ──────────────────────────────────────

function TrendOverlayChart({
    p1,
    p2,
    p1Label,
    p2Label,
}: {
    p1: FinancialDashboardResponse;
    p2: FinancialDashboardResponse;
    p1Label: string;
    p2Label: string;
}) {
    const trendData = useMemo(() => {
        const t1 = p1.trendData ?? [];
        const t2 = p2.trendData ?? [];
        const len = Math.max(t1.length, t2.length);
        if (len === 0) return [];
        return Array.from({ length: len }, (_, i) => ({
            index: i + 1,
            [`${p1Label} Rev`]: t1[i]?.revenue ?? null,
            [`${p1Label} Profit`]: t1[i]?.profit ?? null,
            [`${p2Label} Rev`]: t2[i]?.revenue ?? null,
            [`${p2Label} Profit`]: t2[i]?.profit ?? null,
        }));
    }, [p1, p2, p1Label, p2Label]);

    if (trendData.length === 0) return null;

    const p1RevKey = `${p1Label} Rev`;
    const p1ProfitKey = `${p1Label} Profit`;
    const p2RevKey = `${p2Label} Rev`;
    const p2ProfitKey = `${p2Label} Profit`;

    return (
        <Card className="border-primary-5/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Trend Overlay</CardTitle>
                <CardDescription>
                    Revenue &amp; profit trajectories — both periods overlaid
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={trendData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id="p1RevGrad"
                                    x1="0" y1="0" x2="0" y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor={P1_COLOR}
                                        stopOpacity={0.25}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={P1_COLOR}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="p2RevGrad"
                                    x1="0" y1="0" x2="0" y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor={P2_COLOR}
                                        stopOpacity={0.25}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={P2_COLOR}
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
                                dataKey="index"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                tickFormatter={(v) => `P${v}`}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                tickFormatter={(v) => formatCurrency(v, "short")}
                            />
                            <Tooltip
                                content={<CompareTooltip />}
                                cursor={false}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: "8px" }}
                                formatter={(v) => (
                                    <span className="text-xs text-muted-foreground">
                                        {v}
                                    </span>
                                )}
                            />
                            <Area
                                type="monotone"
                                dataKey={p1RevKey}
                                stroke={P1_COLOR}
                                strokeWidth={2}
                                fill="url(#p1RevGrad)"
                                fillOpacity={1}
                                connectNulls
                            />
                            <Area
                                type="monotone"
                                dataKey={p2RevKey}
                                stroke={P2_COLOR}
                                strokeWidth={2}
                                strokeDasharray="5 3"
                                fill="url(#p2RevGrad)"
                                fillOpacity={1}
                                connectNulls
                            />
                            <Area
                                type="monotone"
                                dataKey={p1ProfitKey}
                                stroke="#22c55e"
                                strokeWidth={2}
                                fill="none"
                                connectNulls
                            />
                            <Area
                                type="monotone"
                                dataKey={p2ProfitKey}
                                stroke="#f59e0b"
                                strokeWidth={2}
                                strokeDasharray="5 3"
                                fill="none"
                                connectNulls
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Section 5: Horizontal expense category comparison ────────────────────────

function ExpenseCategoryChart({
    p1,
    p2,
    p1Label,
    p2Label,
}: {
    p1: FinancialDashboardResponse;
    p2: FinancialDashboardResponse;
    p1Label: string;
    p2Label: string;
}) {
    const data = useMemo(() => {
        const p1Map = new Map(
            (p1.topExpenseCategories ?? []).map((c) => [
                c.categoryDisplay ?? c.category,
                c.amount,
            ]),
        );
        const p2Map = new Map(
            (p2.topExpenseCategories ?? []).map((c) => [
                c.categoryDisplay ?? c.category,
                c.amount,
            ]),
        );
        const categories = Array.from(
            new Set([...p1Map.keys(), ...p2Map.keys()]),
        )
            .map((cat) => ({
                category: cat,
                p1: p1Map.get(cat) ?? 0,
                p2: p2Map.get(cat) ?? 0,
            }))
            .sort((a, b) => b.p1 + b.p2 - (a.p1 + a.p2))
            .slice(0, 8);
        return categories;
    }, [p1, p2]);

    if (data.length === 0) return null;

    return (
        <Card className="border-primary-5/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">
                    Expense Category Comparison
                </CardTitle>
                <CardDescription>
                    Top expense categories across both periods
                </CardDescription>
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
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                tickFormatter={(v) => formatCurrency(v, "short")}
                            />
                            <YAxis
                                type="category"
                                dataKey="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#9ca3af" }}
                                width={110}
                            />
                            <Tooltip
                                content={<CompareTooltip />}
                                cursor={false}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: "8px" }}
                                formatter={(v) => (
                                    <span className="text-xs text-muted-foreground">
                                        {v}
                                    </span>
                                )}
                            />
                            <Bar
                                dataKey="p1"
                                name={p1Label}
                                fill={P1_COLOR}
                                radius={[0, 4, 4, 0]}
                                maxBarSize={20}
                            />
                            <Bar
                                dataKey="p2"
                                name={p2Label}
                                fill={P2_COLOR}
                                radius={[0, 4, 4, 0]}
                                maxBarSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
            <div className="size-12 rounded-full bg-primary-5/10 flex items-center justify-center">
                <ArrowLeftRightIcon className="size-6 text-primary/40" />
            </div>
            <h3 className="text-base font-semibold text-primary">
                No comparison data
            </h3>
            <p className="text-sm text-gray-400 max-w-xs">
                Select two date ranges above to compare financial performance
                across periods.
            </p>
        </div>
    );
}

// ─── Date picker button ───────────────────────────────────────────────────────

function DatePickerButton({
    value,
    onChange,
    placeholder = "Pick a date",
}: {
    value: string | null;
    onChange: (date: string | null) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const date = value ? new Date(`${value}T00:00:00`) : undefined;
    const formatted = date
        ? date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-7 text-xs gap-1.5 font-normal",
                        !value && "text-muted-foreground",
                    )}
                >
                    <CalendarIcon className="size-3" />
                    {formatted}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        onChange(d ? d.toISOString().split("T")[0] : null);
                        setOpen(false);
                    }}
                    captionLayout="dropdown"
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface PeriodComparisonProps {
    data: PeriodComparisonData | null;
    period1Label: string;
    period2Label: string;
}

export function PeriodComparison({
    data,
    period1Label,
    period2Label,
}: PeriodComparisonProps) {
    const [queryState, setQueryState] = useQueryStates({
        period1Start: parseAsString,
        period1End: parseAsString,
        period2Start: parseAsString,
        period2End: parseAsString,
    });

    const hasData = !!(data?.period1 && data.period2);
    const { period1: p1, period2: p2 } = hasData
        ? (data as { period1: FinancialDashboardResponse; period2: FinancialDashboardResponse })
        : { period1: null, period2: null };

    const p1Label = data?.period1Label ?? period1Label;
    const p2Label = data?.period2Label ?? period2Label;

    const hasRadar =
        (p1?.topRevenueStreams?.length ?? 0) > 0 ||
        (p2?.topRevenueStreams?.length ?? 0) > 0;
    const hasTrend =
        (p1?.trendData?.length ?? 0) > 0 || (p2?.trendData?.length ?? 0) > 0;
    const hasExpenses =
        (p1?.topExpenseCategories?.length ?? 0) > 0 ||
        (p2?.topExpenseCategories?.length ?? 0) > 0;

    return (
        <div className="space-y-4">
            {/* Period legend strip with date pickers */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: P1_COLOR }}
                    />
                    <DatePickerButton
                        value={queryState.period1Start}
                        onChange={(d) => setQueryState({ period1Start: d })}
                        placeholder="Start date"
                    />
                    <span className="text-gray-300">→</span>
                    <DatePickerButton
                        value={queryState.period1End}
                        onChange={(d) => setQueryState({ period1End: d })}
                        placeholder="End date"
                    />
                </div>

                <ArrowLeftRightIcon className="size-4 text-gray-300" />

                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: P2_COLOR }}
                    />
                    <DatePickerButton
                        value={queryState.period2Start}
                        onChange={(d) => setQueryState({ period2Start: d })}
                        placeholder="Start date"
                    />
                    <span className="text-gray-300">→</span>
                    <DatePickerButton
                        value={queryState.period2End}
                        onChange={(d) => setQueryState({ period2End: d })}
                        placeholder="End date"
                    />
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                    onClick={() =>
                        setQueryState({
                            period1Start: null,
                            period1End: null,
                            period2Start: null,
                            period2End: null,
                        })
                    }
                >
                    Reset
                </Button>
            </div>

            {/* Results */}
            {!hasData ? (
                <EmptyState />
            ) : (
                <>
                    {/* Section 1: KPI delta grid */}
                    <KPIGrid
                        p1={p1!}
                        p2={p2!}
                        p1Label={p1Label}
                        p2Label={p2Label}
                    />

                    {/* Section 2: Grouped bar chart */}
                    <GroupedBarChart
                        p1={p1!}
                        p2={p2!}
                        p1Label={p1Label}
                        p2Label={p2Label}
                    />

                    {/* Section 3: Radar (conditional) */}
                    {hasRadar && (
                        <RevenueRadarChart
                            p1={p1!}
                            p2={p2!}
                            p1Label={p1Label}
                            p2Label={p2Label}
                        />
                    )}

                    {/* Section 4: Trend overlay (conditional) */}
                    {hasTrend && (
                        <TrendOverlayChart
                            p1={p1!}
                            p2={p2!}
                            p1Label={p1Label}
                            p2Label={p2Label}
                        />
                    )}

                    {/* Section 5: Expense categories (conditional) */}
                    {hasExpenses && (
                        <ExpenseCategoryChart
                            p1={p1!}
                            p2={p2!}
                            p1Label={p1Label}
                            p2Label={p2Label}
                        />
                    )}
                </>
            )}
        </div>
    );
}
