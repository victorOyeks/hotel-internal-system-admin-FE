"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    flexRender,
} from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import type { ProfitAndLossStatement as ProfitAndLossData } from "@/lib/api-routes/financials";
import { useMemo } from "react";
import {
    DollarSignIcon,
    TrendingDownIcon,
    TrendingUpIcon,
    WalletIcon,
} from "lucide-react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

type LineItem = {
    label: string;
    amount: number;
};

const columnHelper = createColumnHelper<LineItem>();

// ─── Sub-components ───────────────────────────────────────────────────────────

function PLTable({
    data,
    totalLabel,
    totalAmount,
    totalColorClass = "text-primary",
    amountColorClass,
}: {
    data: LineItem[];
    totalLabel?: string;
    totalAmount?: number;
    totalColorClass?: string;
    amountColorClass?: string;
}) {
    const columns = useMemo(
        () => [
            columnHelper.accessor("label", {
                header: "Description",
                cell: (info) => (
                    <span className="text-gray-600 text-sm">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor("amount", {
                header: () => <span className="text-right block">Amount</span>,
                cell: (info) => (
                    <div
                        className={`text-sm font-medium text-right tabular-nums ${amountColorClass ?? "text-gray-800"}`}
                    >
                        {formatCurrency(info.getValue())}
                    </div>
                ),
            }),
        ],
        [amountColorClass],
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <Table>
            <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="bg-gray-50 hover:bg-gray-50">
                        {hg.headers.map((h) => (
                            <TableHead key={h.id} className="text-xs text-gray-400 uppercase tracking-wide">
                                {h.isPlaceholder
                                    ? null
                                    : flexRender(h.column.columnDef.header, h.getContext())}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="border-gray-50">
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={2} className="h-16 text-center text-sm text-gray-400">
                            No items
                        </TableCell>
                    </TableRow>
                )}
                {totalLabel != null && totalAmount != null && (
                    <TableRow className="border-t-2 border-gray-200 bg-gray-50/80 font-semibold">
                        <TableCell className="text-sm font-semibold text-gray-700">
                            {totalLabel}
                        </TableCell>
                        <TableCell className={`text-right font-bold tabular-nums text-sm ${totalColorClass}`}>
                            {formatCurrency(totalAmount)}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

const DONUT_COLORS = ["#4c091e", "#297045", "#6366f1", "#f59e0b", "#ec4899"];

function RevenueDistributionChart({ data }: { data: ProfitAndLossData }) {
    const chartData = useMemo(() => {
        const sources = [
            { name: "Rooms", value: data.roomRevenue ?? 0 },
            { name: "F&B", value: data.foodAndBeverageRevenue ?? 0 },
            { name: "Laundry & Valet", value: data.laundryRevenue ?? 0 },
            { name: "Guest Services", value: data.rentalRevenue ?? 0 },
            { name: "Other", value: data.otherRevenue ?? 0 },
        ];
        return sources.filter((s) => s.value > 0);
    }, [data]);

    if (chartData.length === 0) return null;

    const total = chartData.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="space-y-3">
            <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={72}
                            dataKey="value"
                            nameKey="name"
                            labelLine={false}
                        >
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
                {chartData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                            />
                            <span className="text-gray-500">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums">
                            <span className="text-gray-400">{((item.value / total) * 100).toFixed(1)}%</span>
                            <span className="font-medium text-gray-700 w-[80px] text-right">
                                {formatCurrency(item.value)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Revenue vs Expenses bar chart ───────────────────────────────────────────

const PLTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; fill: string }>;
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-background/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 z-50 text-sm">
            <p className="font-medium mb-1">{label}</p>
            {payload.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.fill }} />
                    <span className="text-muted-foreground">{e.name}:</span>
                    <span className="font-semibold">{formatCurrency(e.value)}</span>
                </div>
            ))}
        </div>
    );
};

function RevenueVsExpensesChart({ data }: { data: ProfitAndLossData }) {
    const chartData = useMemo(() => {
        const netProfit = data.netProfit ?? 0;
        return [
            {
                name: "Gross Revenue",
                value: data.grossRevenue ?? 0,
                fill: "#22c55e",
            },
            {
                name: "Net Revenue",
                value: data.netRevenue ?? 0,
                fill: "#6366f1",
            },
            {
                name: "Total Expenses",
                value: data.totalOperatingExpenses ?? 0,
                fill: "#ef4444",
            },
            {
                name: "Net Profit",
                value: Math.abs(netProfit),
                fill: netProfit >= 0 ? "#4c091e" : "#f59e0b",
            },
        ];
    }, [data]);

    return (
        <div className="bg-card border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Revenue vs Expenses
                </p>
            </div>
            <div className="p-4">
                <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
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
                            <Tooltip content={<PLTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                            <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                {chartData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconBgClass,
    iconColorClass,
}: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    iconBgClass: string;
    iconColorClass: string;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${iconBgClass}`}>
                <Icon className={`size-5 ${iconColorClass}`} />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{title}</p>
                <p className="text-base font-bold text-primary tabular-nums leading-tight">
                    {value}
                </p>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ProfitLossStatement({ data }: { data: ProfitAndLossData | null }) {
    const revenueItems = useMemo(
        () =>
            !data
                ? []
                : [
                    { label: "Room Revenue", amount: data.roomRevenue ?? 0 },
                    { label: "Food & Beverage", amount: data.foodAndBeverageRevenue ?? 0 },
                    { label: "Laundry & Valet", amount: data.laundryRevenue ?? 0 },
                    { label: "Guest Services", amount: data.rentalRevenue ?? 0 },
                    { label: "Other Revenue", amount: data.otherRevenue ?? 0 },
                ].filter((r) => r.amount !== 0),
        [data],
    );

    const expenseItems = useMemo(
        () =>
            !data
                ? []
                : [
                    { label: "Cost of Goods Sold", amount: data.costOfGoodsSold ?? 0 },
                    { label: "Staff", amount: data.staffExpenses ?? 0 },
                    { label: "Utilities", amount: data.utilitiesExpenses ?? 0 },
                    { label: "Maintenance", amount: data.maintenanceExpenses ?? 0 },
                    { label: "Marketing", amount: data.marketingExpenses ?? 0 },
                    { label: "Administrative", amount: data.administrativeExpenses ?? 0 },
                    { label: "Depreciation", amount: data.depreciationExpenses ?? 0 },
                    { label: "Insurance", amount: data.insuranceExpenses ?? 0 },
                    { label: "Other Operating", amount: data.otherOperatingExpenses ?? 0 },
                ].filter((e) => e.amount !== 0),
        [data],
    );

    if (!data) {
        return (
            <div className="bg-card border border-gray-100 rounded-xl p-6">
                <p className="text-sm text-gray-400">No data available for the selected period.</p>
            </div>
        );
    }

    const netProfit = data.netProfit ?? 0;
    const isProfitable = netProfit >= 0;

    return (
        <div className="space-y-4">
            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                    title="Gross Revenue"
                    value={formatCurrency(data.grossRevenue ?? 0)}
                    icon={DollarSignIcon}
                    iconBgClass="bg-indigo-50"
                    iconColorClass="text-indigo-600"
                />
                <KPICard
                    title="Net Revenue"
                    value={formatCurrency(data.netRevenue ?? 0)}
                    icon={WalletIcon}
                    iconBgClass="bg-emerald-50"
                    iconColorClass="text-emerald-600"
                />
                <KPICard
                    title="Total Expenses"
                    value={formatCurrency(data.totalOperatingExpenses ?? 0)}
                    icon={TrendingDownIcon}
                    iconBgClass="bg-red-50"
                    iconColorClass="text-red-500"
                />
                <KPICard
                    title="Net Profit"
                    value={formatCurrency(netProfit)}
                    subtitle={data.netProfitMargin != null ? `${data.netProfitMargin.toFixed(1)}% margin` : undefined}
                    icon={TrendingUpIcon}
                    iconBgClass={isProfitable ? "bg-green-50" : "bg-red-50"}
                    iconColorClass={isProfitable ? "text-green-600" : "text-red-500"}
                />
            </div>

            {/* Revenue vs Expenses comparison */}
            <RevenueVsExpensesChart data={data} />

            {/* Revenue — table + donut side by side */}
            <div className="bg-card border border-gray-100 border-l-4 border-l-green-500 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Revenue</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px]">
                    <div className="overflow-hidden">
                        <PLTable
                            data={revenueItems}
                            totalLabel="Net Revenue"
                            totalAmount={data.netRevenue ?? 0}
                            totalColorClass="text-green-600"
                            amountColorClass="text-green-700"
                        />
                    </div>
                    <div className="p-4 border-t lg:border-t-0 lg:border-l border-gray-100">
                        <RevenueDistributionChart data={data} />
                    </div>
                </div>
            </div>

            {/* Operating Expenses */}
            <div className="bg-card border border-gray-100 border-l-4 border-l-red-400 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Operating Expenses</p>
                </div>
                <PLTable
                    data={expenseItems}
                    totalLabel="Total Operating Expenses"
                    totalAmount={data.totalOperatingExpenses ?? 0}
                    totalColorClass="text-red-500"
                    amountColorClass="text-red-600"
                />
            </div>

            {/* Profitability — bottom line */}
            <div className="bg-primary/[0.03] border border-primary/20 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-primary/20">
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Profitability</p>
                </div>
                <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-500">Gross Profit</span>
                        <span className="tabular-nums font-medium text-gray-800">
                            {formatCurrency(data.grossProfit ?? 0)}
                            {data.grossProfitMargin != null && (
                                <span className="text-xs text-gray-400 ml-2">
                                    {data.grossProfitMargin.toFixed(1)}%
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-500">Operating Profit</span>
                        <span className="tabular-nums font-medium text-gray-800">
                            {formatCurrency(data.operatingProfit ?? 0)}
                            {data.operatingProfitMargin != null && (
                                <span className="text-xs text-gray-400 ml-2">
                                    {data.operatingProfitMargin.toFixed(1)}%
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-500">Profit Before Tax</span>
                        <span className="tabular-nums font-medium text-gray-800">
                            {formatCurrency(data.profitBeforeTax ?? 0)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-primary/20 pt-3 mt-1">
                        <span className="font-bold text-base text-primary">Net Profit</span>
                        <div className="text-right">
                            <span className={`text-2xl font-bold tabular-nums ${isProfitable ? "text-green-600" : "text-red-500"}`}>
                                {formatCurrency(netProfit)}
                            </span>
                            {data.netProfitMargin != null && (
                                <p className={`text-xs font-medium mt-0.5 ${isProfitable ? "text-green-500" : "text-red-400"}`}>
                                    {isProfitable ? "▲" : "▼"} {Math.abs(data.netProfitMargin).toFixed(1)}% margin
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
