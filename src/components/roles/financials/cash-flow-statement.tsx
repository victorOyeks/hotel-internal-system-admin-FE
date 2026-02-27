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
import type { CashFlowStatement as CashFlowStatementType } from "@/lib/api-routes/financials";
import { useMemo } from "react";
import {
    ArrowDownCircleIcon,
    ArrowUpCircleIcon,
    DollarSignIcon,
    WalletIcon,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
    PieChart,
    Pie,
} from "recharts";

// ─── Shared ───────────────────────────────────────────────────────────────────

type CashFlowLineItem = { label: string; amount: number };
const columnHelper = createColumnHelper<CashFlowLineItem>();

function KPICard({
    title,
    value,
    icon: Icon,
    iconBgClass,
    iconColorClass,
    valueColorClass = "text-primary",
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    iconBgClass: string;
    iconColorClass: string;
    valueColorClass?: string;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${iconBgClass}`}>
                <Icon className={`size-5 ${iconColorClass}`} />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{title}</p>
                <p className={`text-base font-bold tabular-nums leading-tight ${valueColorClass}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function CashFlowTable({
    data,
    totalLabel,
    totalAmount,
    totalColorClass = "text-primary",
    amountColorClass,
}: {
    data: CashFlowLineItem[];
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
                    <div className={`text-sm font-medium text-right tabular-nums ${amountColorClass ?? "text-gray-800"}`}>
                        {formatCurrency(info.getValue())}
                    </div>
                ),
            }),
        ],
        [amountColorClass],
    );

    const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

    return (
        <Table>
            <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="bg-gray-50 hover:bg-gray-50">
                        {hg.headers.map((h) => (
                            <TableHead key={h.id} className="text-xs text-gray-400 uppercase tracking-wide">
                                {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
                    <TableRow className="border-t-2 border-gray-200 bg-gray-50/80">
                        <TableCell className="text-sm font-semibold text-gray-700">{totalLabel}</TableCell>
                        <TableCell className={`text-right font-bold tabular-nums text-sm ${totalColorClass}`}>
                            {formatCurrency(totalAmount)}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

// ─── Waterfall bar chart ──────────────────────────────────────────────────────

const WaterfallTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ payload: { value: number; fill: string } }>;
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload;
    return (
        <div className="bg-background/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 z-50 text-sm">
            <p className="font-medium mb-1">{label}</p>
            <p className="font-semibold">{formatCurrency(item?.value ?? 0)}</p>
        </div>
    );
};

function CashFlowWaterfallChart({ data }: { data: CashFlowStatementType }) {
    const chartData = useMemo(() => {
        const netFlow = data.netCashFlow ?? 0;
        return [
            { name: "Opening", value: data.openingCashBalance ?? 0, fill: "#6366f1" },
            { name: "Inflow", value: data.totalCashInflow ?? 0, fill: "#22c55e" },
            { name: "Outflow", value: data.totalCashOutflow ?? 0, fill: "#ef4444" },
            { name: "Net", value: netFlow, fill: netFlow >= 0 ? "#22c55e" : "#ef4444" },
            { name: "Closing", value: data.closingCashBalance ?? 0, fill: "#4c091e" },
        ];
    }, [data]);

    return (
        <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => formatCurrency(v, "short")} />
                    <Tooltip content={<WaterfallTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Cash breakdown donut ─────────────────────────────────────────────────────

function CashBreakdownDonut({ data }: { data: CashFlowStatementType }) {
    const slices = useMemo(() => {
        const items = [
            { name: "Cash in Hand", value: data.cashInHand ?? 0, color: "#4c091e" },
            { name: "Bank Balance", value: data.bankBalance ?? 0, color: "#6366f1" },
            { name: "Card Payments", value: data.cardPayments ?? 0, color: "#22c55e" },
            { name: "Mobile Money", value: data.mobileMoneyBalance ?? 0, color: "#f59e0b" },
        ].filter((s) => s.value > 0);
        return items;
    }, [data]);

    if (slices.length === 0) return null;

    const total = slices.reduce((s, d) => s + d.value, 0);

    return (
        <div className="bg-card border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Cash Balance Breakdown
                </p>
            </div>
            <div className="p-4 grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-6 items-center">
                <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={slices} cx="50%" cy="50%" innerRadius={44} outerRadius={68} dataKey="value" nameKey="name" labelLine={false}>
                                {slices.map((s, i) => (
                                    <Cell key={i} fill={s.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                    {slices.map((s) => (
                        <div key={s.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                <span className="text-gray-500">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2 tabular-nums">
                                <span className="text-gray-400 text-xs">{((s.value / total) * 100).toFixed(1)}%</span>
                                <span className="font-medium text-gray-800 w-[88px] text-right">{formatCurrency(s.value)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CashFlowStatement({ data }: { data: CashFlowStatementType | null }) {
    const cashInflows = useMemo(
        () =>
            !data
                ? []
                : [
                    { label: "Room Bookings", amount: data.cashFromRoomBookings ?? 0 },
                    { label: "Restaurants", amount: data.cashFromRestaurants ?? 0 },
                    { label: "Laundry", amount: data.cashFromLaundry ?? 0 },
                    { label: "Rentals", amount: data.cashFromRentals ?? 0 },
                    { label: "Other Income", amount: data.cashFromOtherIncome ?? 0 },
                ].filter((i) => i.amount !== 0),
        [data],
    );

    const cashOutflows = useMemo(
        () =>
            !data
                ? []
                : [
                    { label: "Paid to Suppliers", amount: data.cashPaidToSuppliers ?? 0 },
                    { label: "Paid to Employees", amount: data.cashPaidToEmployees ?? 0 },
                    { label: "Staff Costs", amount: data.cashForStaffCosts ?? 0 },
                    { label: "Utilities", amount: data.cashForUtilities ?? 0 },
                    { label: "Supplies", amount: data.cashForSupplies ?? 0 },
                    { label: "Maintenance", amount: data.cashForMaintenance ?? 0 },
                    { label: "Marketing", amount: data.cashForMarketing ?? 0 },
                    { label: "Other Expenses", amount: data.cashForOtherExpenses ?? 0 },
                    { label: "Operating Expenses", amount: data.cashPaidForOperatingExpenses ?? 0 },
                ].filter((i) => i.amount !== 0),
        [data],
    );

    if (!data) {
        return (
            <div className="bg-card border border-gray-100 rounded-xl p-6">
                <p className="text-sm text-gray-400">No data available for the selected period.</p>
            </div>
        );
    }

    const netCashFlow = data.netCashFlow ?? 0;
    const isPositive = netCashFlow >= 0;

    return (
        <div className="space-y-4">
            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                    title="Total Inflow"
                    value={formatCurrency(data.totalCashInflow ?? 0)}
                    icon={ArrowDownCircleIcon}
                    iconBgClass="bg-green-50"
                    iconColorClass="text-green-600"
                    valueColorClass="text-green-700"
                />
                <KPICard
                    title="Total Outflow"
                    value={formatCurrency(data.totalCashOutflow ?? 0)}
                    icon={ArrowUpCircleIcon}
                    iconBgClass="bg-red-50"
                    iconColorClass="text-red-500"
                    valueColorClass="text-red-600"
                />
                <KPICard
                    title="Net Cash Flow"
                    value={formatCurrency(netCashFlow)}
                    icon={DollarSignIcon}
                    iconBgClass={isPositive ? "bg-emerald-50" : "bg-red-50"}
                    iconColorClass={isPositive ? "text-emerald-600" : "text-red-500"}
                    valueColorClass={isPositive ? "text-emerald-700" : "text-red-600"}
                />
                <KPICard
                    title="Closing Balance"
                    value={formatCurrency(data.closingCashBalance ?? 0)}
                    icon={WalletIcon}
                    iconBgClass="bg-indigo-50"
                    iconColorClass="text-indigo-600"
                    valueColorClass="text-primary"
                />
            </div>

            {/* Chart + Cash Summary side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                <div className="bg-card border border-gray-100 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Cash Flow Overview
                        </p>
                    </div>
                    <div className="p-4">
                        <CashFlowWaterfallChart data={data} />
                    </div>
                </div>

                {/* Cash summary — right column */}
                <div className="bg-primary/[0.03] border border-primary/20 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-primary/20">
                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Cash Summary
                        </p>
                    </div>
                    <div className="p-4 space-y-2.5 text-sm">
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500">Opening Balance</span>
                            <span className="tabular-nums font-medium text-gray-800">
                                {formatCurrency(data.openingCashBalance ?? 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500">Total Inflow</span>
                            <span className="tabular-nums font-medium text-green-700">
                                +{formatCurrency(data.totalCashInflow ?? 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500">Total Outflow</span>
                            <span className="tabular-nums font-medium text-red-600">
                                -{formatCurrency(data.totalCashOutflow ?? 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500">Net Operations</span>
                            <span className="tabular-nums font-medium text-gray-800">
                                {formatCurrency(data.netCashFromOperatingActivities ?? 0)}
                            </span>
                        </div>
                        {data.accountsReceivable != null && (
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-500">Receivables</span>
                                <span className="tabular-nums font-medium text-gray-800">
                                    {formatCurrency(data.accountsReceivable)}
                                </span>
                            </div>
                        )}
                        {data.accountsPayable != null && (
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-500">Payables</span>
                                <span className="tabular-nums font-medium text-gray-800">
                                    {formatCurrency(data.accountsPayable)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center border-t-2 border-primary/20 pt-3 mt-1">
                            <span className="font-bold text-sm text-primary">Closing Balance</span>
                            <span className="text-xl font-bold tabular-nums text-primary">
                                {formatCurrency(data.closingCashBalance ?? 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inflows + Outflows tables always shown */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-card border border-gray-100 border-l-4 border-l-green-500 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Cash Inflows
                        </p>
                        <span className="text-sm font-bold text-green-600 tabular-nums">
                            {formatCurrency(data.totalCashInflow ?? 0)}
                        </span>
                    </div>
                    <CashFlowTable
                        data={cashInflows}
                        totalLabel="Total Inflow"
                        totalAmount={data.totalCashInflow ?? undefined}
                        totalColorClass="text-green-600"
                        amountColorClass="text-green-700"
                    />
                </div>

                <div className="bg-card border border-gray-100 border-l-4 border-l-red-400 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Cash Outflows
                        </p>
                        <span className="text-sm font-bold text-red-500 tabular-nums">
                            {formatCurrency(data.totalCashOutflow ?? 0)}
                        </span>
                    </div>
                    <CashFlowTable
                        data={cashOutflows}
                        totalLabel="Total Outflow"
                        totalAmount={data.totalCashOutflow ?? undefined}
                        totalColorClass="text-red-500"
                        amountColorClass="text-red-600"
                    />
                </div>
            </div>

            {/* Cash breakdown donut */}
            <CashBreakdownDonut data={data} />
        </div>
    );
}
