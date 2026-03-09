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
import type { ComprehensiveSummaryData } from "@/lib/api-routes/financials";
import { useMemo } from "react";
import { CalendarIcon, DollarSignIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

type RevenueStreamRow = {
    label: string;
    amount: number;
    percentage: number | null | undefined;
};

const revenueColumnHelper = createColumnHelper<RevenueStreamRow>();

const revenueStreamColumns = [
    revenueColumnHelper.accessor("label", {
        header: "Source",
        cell: (info) => (
            <span className="text-gray-600">{info.getValue()}</span>
        ),
    }),
    revenueColumnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => (
            <div className="font-medium">
                {formatCurrency(info.getValue())}
            </div>
        ),
    }),
    revenueColumnHelper.accessor("percentage", {
        header: "Share",
        cell: (info) => {
            const val = info.getValue();
            return (
                <span className="text-gray-400">
                    {val != null ? `${val.toFixed(1)}%` : ""}
                </span>
            );
        },
    }),
];

function RevenueBySourceTable({ data }: { data: RevenueStreamRow[] }) {
    const table = useReactTable({
        data,
        columns: revenueStreamColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="border border-primary-5/20 rounded-xl overflow-clip bg-card">
            <Table>
                <TableHeader className="bg-gray-100">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className="text-gray-500"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className="text-gray-600"
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={revenueStreamColumns.length}
                                className="h-24 text-center"
                            >
                                No data.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

const DailyBreakdownTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 z-50">
                <p className="font-medium mb-2">{label}</p>
                {payload
                    .filter((entry: any) => entry.value > 0)
                    .map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-medium">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
            </div>
        );
    }
    return null;
};

function DailyBreakdownChart({ data }: { data: ComprehensiveSummaryData }) {
    const chartData = useMemo(() => {
        if (!data.dailyBreakdown || data.dailyBreakdown.length === 0) return [];
        return data.dailyBreakdown.map((day) => {
            const date = day.date ? new Date(day.date) : null;
            return {
                date: date
                    ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "",
                Rooms: day.roomRevenue ?? 0,
                Kitchen: day.kitchenRevenue ?? 0,
                Bar: day.barRevenue ?? 0,
                Laundry: day.laundryRevenue ?? 0,
                Rentals: day.rentalRevenue ?? 0,
                Other: (day.otherIncomeRevenue ?? 0) + (day.manualChargeRevenue ?? 0),
            };
        });
    }, [data.dailyBreakdown]);

    if (chartData.length === 0) return null;

    const areas = [
        { key: "Rooms", color: "#4c091e" },
        { key: "Kitchen", color: "#297045" },
        { key: "Bar", color: "#6366f1" },
        { key: "Laundry & Valet", color: "#f59e0b" },
        { key: "Guest Services", color: "#ec4899" },
        { key: "Other", color: "#6366f1" },
    ];

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">Daily Revenue Breakdown</p>
            <div className="border border-primary-5/20 rounded-xl p-4 bg-card">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                {areas.map((area) => (
                                    <linearGradient
                                        key={area.key}
                                        id={`gradient-${area.key}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="5%" stopColor={area.color} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={area.color} stopOpacity={0.05} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e5e5"
                            />
                            <XAxis
                                dataKey="date"
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
                            <Tooltip content={<DailyBreakdownTooltip />} />
                            <Legend
                                wrapperStyle={{ paddingTop: "10px" }}
                                formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}
                            />
                            {areas.map((area) => (
                                <Area
                                    key={area.key}
                                    type="monotone"
                                    dataKey={area.key}
                                    stackId="1"
                                    stroke={area.color}
                                    fill={`url(#gradient-${area.key})`}
                                    strokeWidth={1.5}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

interface ComprehensiveSummaryProps {
    data: ComprehensiveSummaryData | null;
}

export function ComprehensiveSummary({ data }: ComprehensiveSummaryProps) {
    const revenueStreams = useMemo(
        () =>
            !data
                ? []
                : [
                    {
                        label: "Booking Revenue",
                        amount: data.totalBookingRevenue ?? 0,
                        percentage: data.bookingRevenuePercentage,
                    },
                    {
                        label: "F&B Revenue",
                        amount: data.totalRestaurantRevenue ?? 0,
                        percentage: data.restaurantRevenuePercentage,
                    },
                    {
                        label: "Laundry & Valet Revenue",
                        amount: data.totalLaundryRevenue ?? 0,
                        percentage: data.laundryRevenuePercentage,
                    },
                    {
                        label: "Guest Services Revenue",
                        amount: data.totalRentalRevenue ?? 0,
                        percentage: data.rentalRevenuePercentage,
                    },
                    {
                        label: "Other Income",
                        amount: data.totalOtherIncome ?? 0,
                        percentage: data.otherIncomePercentage,
                    },
                ].filter((stream) => stream.amount > 0),
        [data],
    );

    if (!data) return null;

    const stats = [
        {
            title: "Grand Total Revenue",
            icon: DollarSignIcon,
            value: formatCurrency(data.grandTotalRevenue ?? 0),
        },
        {
            title: "Revenue Growth",
            icon: TrendingUpIcon,
            value: data.revenueGrowthPercentage != null
                ? `${data.revenueGrowthPercentage >= 0 ? "+" : ""}${data.revenueGrowthPercentage.toFixed(1)}%`
                : "N/A",
        },
        {
            title: "Total Bookings",
            icon: CalendarIcon,
            value: `${data.totalBookings ?? 0}`,
            subtitle: `${data.checkIns ?? 0} in · ${data.checkOuts ?? 0} out`,
        },
        {
            title: "Avg Booking Value",
            icon: UsersIcon,
            value: formatCurrency(data.averageBookingValue ?? 0),
        },
    ];

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className="col-span-1 bg-white border border-primary-5/40 p-2 rounded-2xl md:rounded-3xl flex items-center space-x-2"
                    >
                        <div className="size-8 md:size-12 aspect-square bg-green-500/20 rounded-full flex items-center justify-center">
                            <stat.icon className="text-secondary size-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs md:text-sm text-gray-400">{stat.title}</p>
                            <p className="text-lg text-primary font-semibold font-inter tracking-[0.01em]">
                                {stat.value}
                            </p>
                            {stat.subtitle && (
                                <p className="text-xs text-gray-400">{stat.subtitle}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue by Source - React Table */}
            {revenueStreams.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Revenue by Source</p>
                    <RevenueBySourceTable data={revenueStreams} />
                </div>
            )}

            {/* Daily Breakdown Chart */}
            {data.dailyBreakdown && data.dailyBreakdown.length > 0 && (
                <DailyBreakdownChart data={data} />
            )}

            {/* Narrative Summary */}
            <div className="space-y-2">
                <p className="text-sm font-medium">Executive Summary</p>
                <div className="border border-primary-5/20 rounded-xl p-4 bg-card">
                    <p className="text-sm text-gray-500 leading-relaxed">
                        {data.hotelName && <>{data.hotelName} generated </>}
                        <strong className="text-primary">
                            {formatCurrency(data.grandTotalRevenue ?? 0)}
                        </strong>{" "}
                        in total revenue. Room bookings contributed{" "}
                        <strong className="text-primary">
                            {formatCurrency(data.totalBookingRevenue ?? 0)}
                        </strong>{" "}
                        across{" "}
                        <strong className="text-primary">
                            {data.totalBookings ?? 0}
                        </strong>{" "}
                        bookings.
                        {data.revenueGrowthPercentage != null && (
                            <>
                                {" "}
                                Revenue{" "}
                                {data.revenueGrowthPercentage >= 0
                                    ? "grew"
                                    : "declined"}{" "}
                                by{" "}
                                <strong className="text-primary">
                                    {Math.abs(
                                        data.revenueGrowthPercentage,
                                    ).toFixed(1)}
                                    %
                                </strong>{" "}
                                compared to the previous period.
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
