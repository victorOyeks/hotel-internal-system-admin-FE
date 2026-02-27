"use client";

import { useMemo } from "react";
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
import {
    UtensilsIcon,
    WineIcon,
    ShoppingCartIcon,
    DollarSignIcon,
} from "lucide-react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, cn } from "@/lib/utils";
import type { RestaurantDailySummary } from "./restaurant-summary-card";

// --- Types ---

interface RoomFoodSaleRow {
    roomNumber?: string | null;
    guestName?: string | null;
    orderCount?: number | null;
    totalAmount?: number | null;
    date?: string | null;
}

interface ItemSaleDetailRow {
    itemName?: string | null;
    category?: string | null;
    quantitySold?: number | null;
    unitPrice?: number | null;
    totalRevenue?: number | null;
}

interface RestaurantReportsProps {
    dailySummary: RestaurantDailySummary | null;
    roomFoodSales: unknown;
    itemSalesDetail: unknown;
}

// --- Palette ---

const COLORS = ["#297045", "#6366f1", "#4c091e", "#f59e0b"];

// --- KPI Card ---

function KPICard({
    label,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    format = "currency",
}: {
    label: string;
    value: number | null | undefined;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    format?: "currency" | "number";
}) {
    const safeVal = value ?? 0;
    const formatted =
        format === "number" ? safeVal.toLocaleString() : formatCurrency(safeVal);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={cn("size-10 shrink-0 rounded-xl flex items-center justify-center", iconBg)}>
                <Icon className={cn("size-5", iconColor)} />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{label}</p>
                <p className="text-base font-bold text-primary tabular-nums leading-tight">
                    {formatted}
                </p>
            </div>
        </div>
    );
}

// --- Revenue split section ---

function RevenueSplitSection({ summary }: { summary: RestaurantDailySummary }) {
    const slices = useMemo(
        () =>
            [
                { name: "Kitchen", value: summary.kitchenRevenue ?? 0, fill: COLORS[0] },
                { name: "Bar", value: summary.barRevenue ?? 0, fill: COLORS[1] },
                { name: "Room Charges", value: summary.roomCharges ?? 0, fill: COLORS[2] },
                { name: "Direct Payments", value: summary.directPayments ?? 0, fill: COLORS[3] },
            ].filter((s) => s.value > 0),
        [summary],
    );

    const total = slices.reduce((sum, s) => sum + s.value, 0);

    return (
        <div className="bg-card border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Revenue Split
                </p>
            </div>
            {slices.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                    No revenue data available.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr]">
                    {/* Donut */}
                    <div className="relative flex items-center justify-center p-4 border-b lg:border-b-0 lg:border-r border-gray-100">
                        <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={slices}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={78}
                                        dataKey="value"
                                        nameKey="name"
                                        labelLine={false}
                                    >
                                        {slices.map((s, i) => (
                                            <Cell key={i} fill={s.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-sm font-bold text-primary">
                                {formatCurrency(total, "short")}
                            </span>
                            <span className="text-xs text-gray-400">Total</span>
                        </div>
                    </div>
                    {/* Channel breakdown */}
                    <div className="p-4 space-y-3">
                        {slices.map((s) => {
                            const pct = total
                                ? ((s.value / total) * 100).toFixed(1)
                                : "0.0";
                            return (
                                <div key={s.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: s.fill }}
                                            />
                                            <span className="text-gray-600">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3 tabular-nums">
                                            <span className="text-xs text-gray-400">{pct}%</span>
                                            <span className="font-semibold text-primary w-[88px] text-right">
                                                {formatCurrency(s.value)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: s.fill,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Room food sales ---

const roomFoodColHelper = createColumnHelper<RoomFoodSaleRow>();
const roomFoodColumns = [
    roomFoodColHelper.accessor("roomNumber", {
        header: "Room",
        cell: (i) => (
            <span className="font-medium text-gray-800">{i.getValue() ?? "—"}</span>
        ),
    }),
    roomFoodColHelper.accessor("guestName", {
        header: "Guest",
        cell: (i) => i.getValue() ?? "—",
    }),
    roomFoodColHelper.accessor("orderCount", {
        header: "Orders",
        cell: (i) => (i.getValue() ?? 0).toLocaleString(),
    }),
    roomFoodColHelper.accessor("totalAmount", {
        header: () => <span className="block text-right">Amount</span>,
        cell: (i) => (
            <div className="text-right tabular-nums font-medium text-amber-700">
                {formatCurrency(i.getValue() ?? 0)}
            </div>
        ),
    }),
    roomFoodColHelper.accessor("date", {
        header: "Date",
        cell: (i) => {
            const v = i.getValue();
            return v ? new Date(v).toLocaleDateString() : "—";
        },
    }),
];

function RoomFoodSalesSection({
    data,
    total,
}: {
    data: RoomFoodSaleRow[];
    total?: number;
}) {
    const table = useReactTable({
        data,
        columns: roomFoodColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    const chartData = useMemo(
        () =>
            [...data]
                .sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0))
                .slice(0, 8)
                .map((r) => ({
                    name: r.roomNumber ?? "N/A",
                    revenue: r.totalAmount ?? 0,
                })),
        [data],
    );

    return (
        <div className="bg-card border border-gray-100 border-l-4 border-l-amber-500 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Room Food Sales
                </p>
                {total != null && total > 0 && (
                    <span className="text-sm font-bold text-amber-600 tabular-nums">
                        {formatCurrency(total)}
                    </span>
                )}
            </div>
            {chartData.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#e5e5e5"
                                />
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
                                <Tooltip
                                    formatter={(v: number) => formatCurrency(v)}
                                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    name="Revenue"
                                    fill="#f59e0b"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            {data.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-8">
                    No room food sales data available.
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id} className="bg-gray-50 hover:bg-gray-50">
                                {hg.headers.map((h) => (
                                    <TableHead
                                        key={h.id}
                                        className="text-xs text-gray-400 uppercase tracking-wide"
                                    >
                                        {h.isPlaceholder
                                            ? null
                                            : flexRender(h.column.columnDef.header, h.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="text-gray-600">
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

// --- Item sales detail ---

const itemColHelper = createColumnHelper<ItemSaleDetailRow>();
const itemColumns = [
    itemColHelper.accessor("itemName", {
        header: "Item",
        cell: (i) => (
            <span className="font-medium text-gray-800">{i.getValue() ?? "—"}</span>
        ),
    }),
    itemColHelper.accessor("category", {
        header: "Category",
        cell: (i) => {
            const v = i.getValue();
            if (!v) return "—";
            const isDrink =
                v.toUpperCase() === "DRINK" || v.toUpperCase() === "BAR";
            return (
                <span
                    className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        isDrink
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-green-100 text-green-700",
                    )}
                >
                    {v}
                </span>
            );
        },
    }),
    itemColHelper.accessor("quantitySold", {
        header: "Qty",
        cell: (i) => (
            <span className="tabular-nums">{(i.getValue() ?? 0).toLocaleString()}</span>
        ),
    }),
    itemColHelper.accessor("unitPrice", {
        header: "Unit Price",
        cell: (i) => (
            <span className="tabular-nums">{formatCurrency(i.getValue() ?? 0)}</span>
        ),
    }),
    itemColHelper.accessor("totalRevenue", {
        header: () => <span className="block text-right">Revenue</span>,
        cell: (i) => (
            <div className="text-right tabular-nums font-semibold text-green-700">
                {formatCurrency(i.getValue() ?? 0)}
            </div>
        ),
    }),
];

function ItemSalesDetailSection({ data }: { data: ItemSaleDetailRow[] }) {
    const table = useReactTable({
        data,
        columns: itemColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    const chartData = useMemo(
        () =>
            [...data]
                .sort((a, b) => (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0))
                .slice(0, 8)
                .map((r) => ({
                    name: r.itemName ?? "N/A",
                    revenue: r.totalRevenue ?? 0,
                })),
        [data],
    );

    return (
        <div className="bg-card border border-gray-100 border-l-4 border-l-green-500 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Item Sales Detail
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
                {/* Horizontal bar chart */}
                {chartData.length > 0 ? (
                    <div className="p-4 border-b lg:border-b-0 lg:border-r border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                            Top Items by Revenue
                        </p>
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
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
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        width={90}
                                    />
                                    <Tooltip
                                        formatter={(v: number) => formatCurrency(v)}
                                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        name="Revenue"
                                        fill="#297045"
                                        radius={[0, 4, 4, 0]}
                                        maxBarSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border-b lg:border-b-0 lg:border-r border-gray-100 flex items-center justify-center text-sm text-gray-400">
                        No chart data
                    </div>
                )}
                {/* Table */}
                <div className="overflow-hidden">
                    {data.length === 0 ? (
                        <div className="text-sm text-gray-400 text-center py-8">
                            No item sales data available.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((hg) => (
                                    <TableRow key={hg.id} className="bg-gray-50 hover:bg-gray-50">
                                        {hg.headers.map((h) => (
                                            <TableHead
                                                key={h.id}
                                                className="text-xs text-gray-400 uppercase tracking-wide"
                                            >
                                                {h.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        h.column.columnDef.header,
                                                        h.getContext(),
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="text-gray-600">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Main export ---

export function RestaurantReports({
    dailySummary,
    roomFoodSales,
    itemSalesDetail,
}: RestaurantReportsProps) {
    const roomFoodRows = (
        (roomFoodSales as { content?: RoomFoodSaleRow[] })?.content ?? []
    ) as RoomFoodSaleRow[];
    const itemRows = (
        (itemSalesDetail as { content?: ItemSaleDetailRow[] })?.content ?? []
    ) as ItemSaleDetailRow[];

    const roomFoodTotal = useMemo(
        () => roomFoodRows.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0),
        [roomFoodRows],
    );

    return (
        <div className="space-y-4">
            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                    label="Total Revenue"
                    value={dailySummary?.totalRevenue}
                    icon={DollarSignIcon}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                />
                <KPICard
                    label="Kitchen Revenue"
                    value={dailySummary?.kitchenRevenue}
                    icon={UtensilsIcon}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-500"
                />
                <KPICard
                    label="Bar Revenue"
                    value={dailySummary?.barRevenue}
                    icon={WineIcon}
                    iconBg="bg-indigo-50"
                    iconColor="text-indigo-500"
                />
                <KPICard
                    label="Total Orders"
                    value={dailySummary?.totalOrders}
                    icon={ShoppingCartIcon}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                    format="number"
                />
            </div>

            {/* Revenue split */}
            {dailySummary ? (
                <RevenueSplitSection summary={dailySummary} />
            ) : (
                <div className="bg-card border border-gray-100 rounded-xl flex items-center justify-center h-40 text-sm text-gray-400">
                    No summary data available.
                </div>
            )}

            {/* Room food sales — chart + full-width table */}
            <RoomFoodSalesSection
                data={roomFoodRows}
                total={roomFoodRows.length > 0 ? roomFoodTotal : undefined}
            />

            {/* Item sales — horizontal chart beside full-width table */}
            <ItemSalesDetailSection data={itemRows} />
        </div>
    );
}
