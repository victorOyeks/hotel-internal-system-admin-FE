"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { FinancialDashboardGraphData } from "@/lib/api-routes/financials";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ChartProps {
    data: FinancialDashboardGraphData[];
}

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
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function RevenueExpenseChart({ data }: ChartProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>
                    Financial performance overview over time
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="hsl(var(--border))"
                            />
                            <XAxis
                                dataKey="period"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(value) => formatCurrency(value, "short")}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
                            <Legend
                                wrapperStyle={{ paddingTop: "20px" }}
                                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                            />
                            <Bar
                                dataKey="revenue"
                                name="Revenue"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                            <Bar
                                dataKey="expenses"
                                name="Expenses"
                                fill="hsl(var(--destructive))"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProfitTrendChart({ data }: ChartProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Net Profit Trend</CardTitle>
                <CardDescription>
                    Profitability analysis over the selected period
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="hsl(var(--chart-2))"
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="hsl(var(--chart-2))"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="hsl(var(--border))"
                            />
                            <XAxis
                                dataKey="period"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(value) => formatCurrency(value, "short")}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ paddingTop: "20px" }}
                                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                            />
                            <Area
                                type="monotone"
                                dataKey="profit"
                                name="Net Profit"
                                stroke="hsl(var(--chart-2))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorProfit)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
