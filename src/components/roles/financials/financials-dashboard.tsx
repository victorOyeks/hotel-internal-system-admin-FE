"use client";

import type { FinancialDashboardResponse, FinancialDashboardGraphData } from "@/lib/api-routes/financials";
import { DollarSignIcon, CalendarIcon, TrendingUpIcon } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
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
    LineChart,
    Line,
    type DotProps,
} from "recharts";
import type { ActiveShape } from "recharts/types/util/types";

// --- Earnings Component ---

function Earnings({ metrics }: { metrics: FinancialDashboardResponse }) {
    const earnings = [
        {
            title: "Total Balance",
            icon: DollarSignIcon,
            value: metrics.totalRevenue,
        },
        {
            title: "Total Profit",
            icon: DollarSignIcon,
            value: metrics.netProfit,
        },
        {
            title: "Expenses",
            icon: DollarSignIcon,
            value: metrics.totalExpenses,
        },
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {earnings.map((earning) => (
                <div
                    key={earning.title}
                    className="col-span-1 bg-white border border-primary-5/40 p-2 rounded-2xl md:rounded-3xl flex items-center space-x-2"
                >
                    <div className="size-8 md:size-10 aspect-square bg-green-500/20 rounded-full flex items-center justify-center">
                        <earning.icon className="text-secondary size-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs md:text-sm text-gray-400">{earning.title}</p>
                        <p className="text-lg text-primary font-semibold font-inter tracking-[0.01em] ">
                            {formatCurrency(earning.value)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Curved Line Chart (EarningsSideB) ---

const CustomDot = (
    props: DotProps & { payload: { period: string; profit: number } },
) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined) return null;
    return (
        <g>
            <circle cx={cx} cy={cy} r={6} fill="white" stroke="#22c55e" strokeWidth={3} />
            <foreignObject x={cx - 50} y={cy - 40} width={100} height={28}>
                <div className="flex justify-center">
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                        {formatCurrency(payload.profit)}
                    </span>
                </div>
            </foreignObject>
        </g>
    );
};

function CurvedLineChart({
    graphData,
}: {
    graphData: FinancialDashboardGraphData[];
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={graphData}
                margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
            >
                <XAxis
                    dataKey="periodLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    className="text-gray-400"
                />
                <YAxis hide />
                <Tooltip<number, string>
                    cursor={false}
                    formatter={(value) => [formatCurrency(value), "Profit"]}
                />
                <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={false}
                    activeDot={CustomDot as ActiveShape<DotProps>}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

function EarningsSideB({
    graphData,
    totalEarning,
}: {
    graphData: FinancialDashboardGraphData[];
    totalEarning: number;
}) {
    return (
        <div className="bg-white py-4 px-2 md:py-6 md:px-5 rounded-3xl space-y-4">
            <Button variant={"outline"} size={"sm"} className="shadow-none text-gray-500">
                <CalendarIcon />
                <span>This month</span>
            </Button>

            <div>
                <h1 className="text-3xl font-semibold text-primary">
                    {formatCurrency(totalEarning)}
                </h1>
                <p className="text-gray-500 text-sm flex items-center space-x-1">
                    <span>Total profit</span>
                    <span className="text-green-500 font-semibold flex items-center space-x-1">
                        <TrendingUpIcon className="inline size-4" />
                        <span>+20%</span>
                    </span>
                </p>
            </div>

            <div className="h-64 md:h-38 w-full">
                <CurvedLineChart graphData={graphData} />
            </div>
        </div>
    );
}

// --- Pie Chart ---

const budgetItems = [
    { name: "Salaries & Wages", percentage: 50, amount: 5000, color: "bg-teal-400" },
    { name: "Inventory", percentage: 50, amount: 1000, color: "bg-pink-400" },
    { name: "Maintenance", percentage: 50, amount: 1000, color: "bg-yellow-400" },
];

interface BudgetItemProps {
    name: string;
    percentage: number;
    amount: number;
    color: string;
}

function BudgetItem({ name, percentage, amount, color }: BudgetItemProps) {
    return (
        <li className="flex justify-between items-center w-full">
            <div className="flex items-center gap-x-1 text-sm">
                <span className={cn(`size-2 rounded-full ${color}`)}></span>
                <span className="text-dark-2 text-nowrap">{name}</span>
                <span className="text-slate-400">({percentage}%)</span>
            </div>
            <div className="font-semibold text-primary">{amount}</div>
        </li>
    );
}

function PieChart({ items = budgetItems }) {
    return (
        <Card className="border border-primary-5/40 py-2 md:rounded-3xl overflow-clip h-full">
            <CardHeader>
                <CardTitle>
                    <h2 className="text-primary text-lg">Expense Breakdown</h2>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-grow w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                        <Pie
                            data={items}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey={(data) => data.amount}
                        >
                            {items.map((entry, i) => (
                                <Cell key={entry.name} fill={`var(--chart-${i + 1})`} />
                            ))}
                        </Pie>
                    </RechartPieChart>
                </ResponsiveContainer>
            </CardContent>

            <CardFooter className="rounded-xl shadow-2xl p-2 mx-2">
                <ul className="space-y-1 w-full">
                    {items.map((item) => (
                        <BudgetItem
                            key={item.name}
                            name={item.name}
                            percentage={item.percentage}
                            amount={item.amount}
                            color={item.color}
                        />
                    ))}
                </ul>
            </CardFooter>
        </Card>
    );
}

function Hero({
    metrics,
    graphData,
}: {
    metrics: FinancialDashboardResponse;
    graphData: FinancialDashboardGraphData[];
}) {
    return (
        <div className="space-y-2 md:grid md:grid-cols-12 md:gap-2">
            <div className="md:col-span-8 space-y-2">
                <Earnings metrics={metrics} />
                <EarningsSideB totalEarning={metrics.netProfit} graphData={graphData} />
            </div>
            <div className="md:col-span-4">
                <PieChart />
            </div>
        </div>
    );
}

// --- Branch Performance Chart ---

function BranchPerformanceChart({ color = "#7bfcae", dataKey = "profit" }) {
    const data = [
        { name: "Lekki", profit: 400000, yLabel: "400K" },
        { name: "Ikoyi", profit: 300000, yLabel: "300K" },
        { name: "Victoria Island", profit: 200000, yLabel: "200K" },
        { name: "Surulere", profit: 278000, yLabel: "278K" },
        { name: "Ikeja", profit: 189000, yLabel: "189K" },
        { name: "Yaba", profit: 150000, yLabel: "150K" },
    ];
    return (
        <ResponsiveContainer width="100%" height={240}>
            <BarChart
                data={data}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                barCategoryGap="20%"
            >
                <YAxis
                    dataKey={dataKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-primary-1)" }}
                    tickFormatter={(_, i) => data[i]?.yLabel || ""}
                />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-primary-1)" }}
                />
                <Bar dataKey={dataKey} fill={color} radius={[6, 6, 6, 6]} maxBarSize={20} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{ color: "#000" }}
                    cursor={false}
                    formatter={(value: number) => [formatCurrency(value), dataKey]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

function IncomePerfByBranch() {
    return (
        <Card className="border border-primary-5/40 py-2 md:rounded-3xl overflow-clip h-full gap-x-0 px-0">
            <CardHeader>
                <CardTitle>
                    <h2 className="text-primary text-xl">Income performance by branch</h2>
                </CardTitle>
                <CardContent className="w-full">
                    <BranchPerformanceChart color="#7bfcae" dataKey="profit" />
                </CardContent>
            </CardHeader>
        </Card>
    );
}

function ExpensePerfByBranch() {
    return (
        <Card className="border border-primary-5/40 py-2 md:rounded-3xl overflow-clip h-full gap-x-0 px-0">
            <CardHeader>
                <CardTitle>
                    <h2 className="text-primary text-xl">Expense performance by branch</h2>
                </CardTitle>
                <CardContent className="w-full">
                    <BranchPerformanceChart color="#ff6f6f" dataKey="profit" />
                </CardContent>
            </CardHeader>
        </Card>
    );
}

// --- Main Dashboard Component ---

interface FinancialsDashboardProps {
    metrics?: FinancialDashboardResponse;
    graphData?: FinancialDashboardGraphData[];
}

export function FinancialsDashboard({
    metrics,
    graphData = [],
}: FinancialsDashboardProps) {
    if (!metrics) return null;

    return (
        <div className="px-2 space-y-2 md:space-y-4 pb-4 md:pb-6">
            <Hero metrics={metrics} graphData={graphData} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-4">
                <IncomePerfByBranch />
                <ExpensePerfByBranch />
            </div>
        </div>
    );
}
