"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { useSetAtom } from "jotai";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	DollarSignIcon,
	TrendingDownIcon,
	TrendingUpIcon,
} from "lucide-react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { DonutChart } from "@/components/shared/donut-chart";
import type { APIOutput } from "@/lib/action-utils";

type FinancialDashboard =
	APIOutput<"@get/api/managers/:hotelId/financials/dashboard">["data"];
type RevenueData =
	APIOutput<"@get/api/managers/:hotelId/financials/revenue">["data"];
type ProfitLossData =
	APIOutput<"@get/api/managers/:hotelId/financials/profit-and-loss">["data"];
type ExpensesData =
	APIOutput<"@get/api/managers/:hotelId/financials/expenses">["data"];

const COLORS = [
	"#6366f1",
	"#f59e0b",
	"#06b6d4",
	"#8b5cf6",
	"#ec4899",
	"#10b981",
	"#ef4444",
	"#3b82f6",
];

// ==================== Overview Tab ====================
function OverviewTab({ data }: { data: FinancialDashboard }) {
	const revenueDistData = useMemo(
		() =>
			(data.topRevenueStreams ?? []).map((item, i) => ({
				name: item.source,
				value: item.amount,
				color: COLORS[i % COLORS.length],
			})),
		[data.topRevenueStreams],
	);

	const expenseDistData = useMemo(
		() =>
			(data.topExpenseCategories ?? []).map((item, i) => ({
				name: item.categoryDisplay ?? item.category,
				value: item.amount,
				color: COLORS[(i + 3) % COLORS.length],
			})),
		[data.topExpenseCategories],
	);

	const trendData = data.trendData ?? [];

	return (
		<div className="space-y-4">
			{/* KPI Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<StatCard
					title="Total Revenue"
					value={data.totalRevenue ?? 0}
					icon={DollarSignIcon}
					isCurrency
					trend={
						data.revenueGrowth != null
							? {
									value: Math.abs(data.revenueGrowth),
									isPositive: data.revenueGrowth >= 0,
								}
							: undefined
					}
				/>
				<StatCard
					title="Total Expenses"
					value={data.totalExpenses ?? 0}
					icon={TrendingDownIcon}
					isCurrency
					iconBgClass="bg-red-50"
					iconColorClass="text-red-500"
					trend={
						data.expenseGrowth != null
							? {
									value: Math.abs(data.expenseGrowth),
									isPositive: data.expenseGrowth <= 0,
								}
							: undefined
					}

				/>
				<StatCard
					title="Net Profit"
					value={data.netProfit ?? 0}
					icon={TrendingUpIcon}
					isCurrency
					iconBgClass={
						(data.netProfit ?? 0) >= 0 ? "bg-green-50" : "bg-red-50"
					}
					iconColorClass={
						(data.netProfit ?? 0) >= 0 ? "text-green-600" : "text-red-500"
					}
					trend={
						data.profitGrowth != null
							? {
									value: Math.abs(data.profitGrowth),
									isPositive: data.profitGrowth >= 0,
								}
							: undefined
					}
				/>
				<StatCard
					title="Profit Margin"
					value={`${(data.netProfitMargin ?? 0).toFixed(1)}%`}
					icon={DollarSignIcon}
					iconBgClass="bg-indigo-50"
					iconColorClass="text-indigo-600"
				/>
			</div>

			{/* Revenue vs Expenses Trend */}
			{trendData.length > 0 && (
				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-4">
						Revenue vs Expenses Trend
					</h3>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={trendData}
								margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
							>
								<defs>
									<linearGradient
										id="revGrad"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="#22c55e"
											stopOpacity={0.2}
										/>
										<stop
											offset="95%"
											stopColor="#22c55e"
											stopOpacity={0}
										/>
									</linearGradient>
									<linearGradient
										id="expGrad"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="#ef4444"
											stopOpacity={0.2}
										/>
										<stop
											offset="95%"
											stopColor="#ef4444"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<XAxis
									dataKey="periodLabel"
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
									contentStyle={{
										backgroundColor: "#fff",
										borderRadius: "8px",
										border: "none",
										boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
										fontSize: "12px",
									}}
									formatter={(value: number, name: string) => [
										formatCurrency(value),
										name.charAt(0).toUpperCase() + name.slice(1),
									]}
								/>
								<Area
									type="monotone"
									dataKey="revenue"
									stroke="#22c55e"
									strokeWidth={2}
									fill="url(#revGrad)"
								/>
								<Area
									type="monotone"
									dataKey="expenses"
									stroke="#ef4444"
									strokeWidth={2}
									fill="url(#expGrad)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
			)}

			{/* Distribution Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				{revenueDistData.length > 0 && (
					<DonutChart
						data={revenueDistData}
						title="Revenue Distribution"
						centerValue={formatCurrency(data.totalRevenue ?? 0, "short")}
						centerLabel="Total"
					/>
				)}
				{expenseDistData.length > 0 && (
					<DonutChart
						data={expenseDistData}
						title="Expense Distribution"
						centerValue={formatCurrency(data.totalExpenses ?? 0, "short")}
						centerLabel="Total"
					/>
				)}
			</div>
		</div>
	);
}

// ==================== Revenue Tab ====================
function RevenueTab({ data }: { data: RevenueData }) {
	const sources = useMemo(
		() => [
			{ name: "Room Bookings", value: data.roomBookingsRevenue ?? 0, color: "#6366f1" },
			{ name: "Restaurant", value: data.restaurantRevenue ?? 0, color: "#f59e0b" },
			{ name: "Laundry", value: data.laundryRevenue ?? 0, color: "#06b6d4" },
			{ name: "Rentals", value: data.rentalsRevenue ?? 0, color: "#8b5cf6" },
			{ name: "Other Income", value: data.otherIncomeRevenue ?? 0, color: "#ec4899" },
		],
		[data],
	);

	const breakdowns = data.revenueBySource ?? [];

	return (
		<div className="space-y-4">
			{/* Revenue Summary */}
			<div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
				<div className="bg-white p-4 rounded-2xl col-span-2 lg:col-span-1">
					<p className="text-sm text-gray-500">Total Revenue</p>
					<p className="text-2xl font-bold text-primary mt-1">
						{formatCurrency(data.totalRevenue ?? 0)}
					</p>
					{data.revenueGrowthPercentage != null && (
						<p
							className={`text-xs mt-1 flex items-center gap-1 ${
								data.revenueGrowthPercentage >= 0
									? "text-green-500"
									: "text-red-500"
							}`}
						>
							{data.revenueGrowthPercentage >= 0 ? (
								<ArrowUpIcon className="size-3" />
							) : (
								<ArrowDownIcon className="size-3" />
							)}
							{Math.abs(data.revenueGrowthPercentage).toFixed(1)}% vs last period
						</p>
					)}
				</div>
				{data.averageDailyRevenue != null && (
					<div className="bg-white p-4 rounded-2xl">
						<p className="text-sm text-gray-500">Avg. Daily Revenue</p>
						<p className="text-xl font-bold text-primary mt-1">
							{formatCurrency(data.averageDailyRevenue)}
						</p>
					</div>
				)}
				{data.totalPendingRevenue != null && (
					<div className="bg-white p-4 rounded-2xl">
						<p className="text-sm text-gray-500">Pending Revenue</p>
						<p className="text-xl font-bold text-amber-600 mt-1">
							{formatCurrency(data.totalPendingRevenue)}
						</p>
					</div>
				)}
			</div>

			{/* Revenue by Source Chart */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				<DonutChart
					data={sources.filter((s) => s.value > 0)}
					title="Revenue by Source"
					centerValue={formatCurrency(data.totalRevenue ?? 0, "short")}
					centerLabel="Total"
				/>
				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Revenue Sources
					</h3>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={sources}
								layout="vertical"
								margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
							>
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
									tick={{ fontSize: 11, fill: "#6b7280" }}
									width={100}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "#fff",
										borderRadius: "8px",
										border: "none",
										boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
										fontSize: "12px",
									}}
									formatter={(value: number) => [
										formatCurrency(value),
										"Revenue",
									]}
								/>
								<Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
									{sources.map((entry) => (
										<Bar
											key={entry.name}
											dataKey="value"
											fill={entry.color}
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			{/* Detailed Breakdowns */}
			{breakdowns.length > 0 && (
				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Detailed Breakdown
					</h3>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left text-gray-500">
									<th className="pb-2 font-medium">Source</th>
									<th className="pb-2 font-medium text-right">Amount</th>
									<th className="pb-2 font-medium text-right">Received</th>
									<th className="pb-2 font-medium text-right">Pending</th>
									<th className="pb-2 font-medium text-right">Txns</th>
									<th className="pb-2 font-medium text-right">%</th>
								</tr>
							</thead>
							<tbody>
								{breakdowns.map((item) => (
									<tr key={item.source} className="border-b last:border-0">
										<td className="py-2 text-gray-700">{item.source}</td>
										<td className="py-2 text-right font-medium text-primary">
											{formatCurrency(item.amount, "short")}
										</td>
										<td className="py-2 text-right text-green-600">
											{formatCurrency(item.paidAmount ?? 0, "short")}
										</td>
										<td className="py-2 text-right text-amber-600">
											{formatCurrency(item.pendingAmount ?? 0, "short")}
										</td>
										<td className="py-2 text-right text-gray-500">
											{item.transactionCount}
										</td>
										<td className="py-2 text-right text-gray-500">
											{(item.percentage ?? 0).toFixed(1)}%
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

// ==================== Expenses Tab ====================
function ExpensesTab({ data }: { data: ExpensesData }) {
	const categories = useMemo(
		() =>
			(data.expensesByCategory ?? []).map((item, i) => ({
				name: item.categoryDisplay ?? item.category,
				value: item.amount,
				color: COLORS[(i + 2) % COLORS.length],
				percentage: item.percentage,
				count: item.transactionCount,
			})),
		[data.expensesByCategory],
	);

	return (
		<div className="space-y-4">
			{/* Expense Summary */}
			<div className="grid grid-cols-2 gap-3">
				<div className="bg-white p-4 rounded-2xl">
					<p className="text-sm text-gray-500">Total Expenses</p>
					<p className="text-2xl font-bold text-primary mt-1">
						{formatCurrency(data.totalExpenses ?? 0)}
					</p>
					{data.expenseGrowthPercentage != null && (
						<p
							className={`text-xs mt-1 flex items-center gap-1 ${
								data.expenseGrowthPercentage <= 0
									? "text-green-500"
									: "text-red-500"
							}`}
						>
							{data.expenseGrowthPercentage <= 0 ? (
								<ArrowDownIcon className="size-3" />
							) : (
								<ArrowUpIcon className="size-3" />
							)}
							{Math.abs(data.expenseGrowthPercentage).toFixed(1)}% vs last period
						</p>
					)}
				</div>
				<div className="bg-white p-4 rounded-2xl">
					<p className="text-sm text-gray-500">Categories</p>
					<p className="text-2xl font-bold text-primary mt-1">
						{categories.length}
					</p>
					<p className="text-xs text-gray-400 mt-1">expense categories</p>
				</div>
			</div>

			{/* Category Distribution + List */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				{categories.length > 0 && (
					<DonutChart
						data={categories}
						title="Expense by Category"
						centerValue={formatCurrency(data.totalExpenses ?? 0, "short")}
						centerLabel="Total"
					/>
				)}
				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Category Breakdown
					</h3>
					<div className="space-y-3">
						{categories.map((cat) => (
							<div key={cat.name} className="flex items-center gap-3">
								<div
									className="size-3 rounded-full flex-shrink-0"
									style={{ backgroundColor: cat.color }}
								/>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-700 truncate">
											{cat.name}
										</span>
										<span className="text-sm font-medium text-primary ml-2">
											{formatCurrency(cat.value, "short")}
										</span>
									</div>
									<div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
										<div
											className="h-1.5 rounded-full"
											style={{
												width: `${cat.percentage}%`,
												backgroundColor: cat.color,
											}}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

// ==================== Profit & Loss Tab ====================
function ProfitLossTab({ data }: { data: ProfitLossData }) {
	const revenueItems = useMemo(() => {
		const items: { name: string; amount: number }[] = [];
		if (data.roomRevenue) items.push({ name: "Room Revenue", amount: data.roomRevenue });
		if (data.foodAndBeverageRevenue) items.push({ name: "Food & Beverage", amount: data.foodAndBeverageRevenue });
		if (data.laundryRevenue) items.push({ name: "Laundry", amount: data.laundryRevenue });
		if (data.rentalRevenue) items.push({ name: "Rentals", amount: data.rentalRevenue });
		if (data.otherRevenue) items.push({ name: "Other Revenue", amount: data.otherRevenue });
		return items;
	}, [data]);

	const expenseItems = useMemo(() => {
		const items: { name: string; amount: number }[] = [];
		if (data.staffExpenses) items.push({ name: "Staff Expenses", amount: data.staffExpenses });
		if (data.utilitiesExpenses) items.push({ name: "Utilities", amount: data.utilitiesExpenses });
		if (data.maintenanceExpenses) items.push({ name: "Maintenance", amount: data.maintenanceExpenses });
		if (data.marketingExpenses) items.push({ name: "Marketing", amount: data.marketingExpenses });
		if (data.administrativeExpenses) items.push({ name: "Administrative", amount: data.administrativeExpenses });
		if (data.otherOperatingExpenses) items.push({ name: "Other Operating", amount: data.otherOperatingExpenses });
		return items;
	}, [data]);

	return (
		<div className="space-y-4">
			{/* Summary Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<div className="bg-white p-4 rounded-2xl">
					<p className="text-sm text-gray-500">Gross Revenue</p>
					<p className="text-xl font-bold text-green-600 mt-1">
						{formatCurrency(data.grossRevenue ?? 0)}
					</p>
				</div>
				<div className="bg-white p-4 rounded-2xl">
					<p className="text-sm text-gray-500">Operating Expenses</p>
					<p className="text-xl font-bold text-red-500 mt-1">
						{formatCurrency(data.totalOperatingExpenses ?? 0)}
					</p>
				</div>
				<div className="bg-white p-4 rounded-2xl">
					<p className="text-sm text-gray-500">Net Profit</p>
					<p
						className={`text-xl font-bold mt-1 ${
							(data.netProfit ?? 0) >= 0 ? "text-green-600" : "text-red-500"
						}`}
					>
						{formatCurrency(data.netProfit ?? 0)}
					</p>
				</div>
				<div className="bg-white p-4 rounded-2xl">
					<p className="text-sm text-gray-500">Profit Margin</p>
					<p
						className={`text-xl font-bold mt-1 ${
							(data.netProfitMargin ?? 0) >= 0
								? "text-green-600"
								: "text-red-500"
						}`}
					>
						{(data.netProfitMargin ?? 0).toFixed(1)}%
					</p>
				</div>
			</div>

			{/* P&L Statement */}
			<div className="bg-white p-4 md:p-6 rounded-2xl">
				<h3 className="text-sm font-medium text-gray-600 mb-4">
					Profit & Loss Statement
				</h3>

				{/* Revenue Section */}
				<div className="mb-6">
					<div className="flex items-center justify-between border-b-2 border-green-200 pb-2 mb-2">
						<span className="text-sm font-semibold text-green-700">
							Revenue
						</span>
						<span className="text-sm font-semibold text-green-700">
							Amount
						</span>
					</div>
					{revenueItems.map((item) => (
						<div
							key={item.name}
							className="flex items-center justify-between py-1.5 text-sm"
						>
							<span className="text-gray-600">{item.name}</span>
							<span className="text-gray-800 font-medium">
								{formatCurrency(item.amount)}
							</span>
						</div>
					))}
					<div className="flex items-center justify-between border-t border-green-100 pt-2 mt-2">
						<span className="text-sm font-semibold text-green-700">
							Total Revenue
						</span>
						<span className="text-sm font-bold text-green-700">
							{formatCurrency(data.grossRevenue ?? 0)}
						</span>
					</div>
				</div>

				{/* Expenses Section */}
				<div className="mb-6">
					<div className="flex items-center justify-between border-b-2 border-red-200 pb-2 mb-2">
						<span className="text-sm font-semibold text-red-700">
							Operating Expenses
						</span>
						<span className="text-sm font-semibold text-red-700">
							Amount
						</span>
					</div>
					{expenseItems.map((item) => (
						<div
							key={item.name}
							className="flex items-center justify-between py-1.5 text-sm"
						>
							<span className="text-gray-600">{item.name}</span>
							<span className="text-gray-800 font-medium">
								({formatCurrency(item.amount)})
							</span>
						</div>
					))}
					<div className="flex items-center justify-between border-t border-red-100 pt-2 mt-2">
						<span className="text-sm font-semibold text-red-700">
							Total Expenses
						</span>
						<span className="text-sm font-bold text-red-700">
							({formatCurrency(data.totalOperatingExpenses ?? 0)})
						</span>
					</div>
				</div>

				{/* Operating Profit */}
				{data.operatingProfit != null && (
					<div className="flex items-center justify-between border-t border-gray-200 pt-2 mb-4">
						<span className="text-sm font-semibold text-gray-700">
							Operating Profit
						</span>
						<span
							className={`text-sm font-bold ${
								data.operatingProfit >= 0 ? "text-green-700" : "text-red-600"
							}`}
						>
							{data.operatingProfit < 0 && "("}
							{formatCurrency(Math.abs(data.operatingProfit))}
							{data.operatingProfit < 0 && ")"}
						</span>
					</div>
				)}

				{/* Net Profit */}
				<div className="flex items-center justify-between border-t-2 border-gray-300 pt-3">
					<span className="text-base font-bold text-primary">
						Net Profit / (Loss)
					</span>
					<span
						className={`text-base font-bold ${
							(data.netProfit ?? 0) >= 0 ? "text-green-700" : "text-red-600"
						}`}
					>
						{(data.netProfit ?? 0) < 0 && "("}
						{formatCurrency(Math.abs(data.netProfit ?? 0))}
						{(data.netProfit ?? 0) < 0 && ")"}
					</span>
				</div>
			</div>
		</div>
	);
}

// ==================== Data Unavailable Fallback ====================
function DataUnavailable({ section }: { section: string }) {
	return (
		<div className="bg-white p-8 rounded-2xl text-center">
			<p className="text-gray-400 text-sm">
				{section} data is currently unavailable. Please try again later.
			</p>
		</div>
	);
}

// ==================== Main Financials ====================
export function Financials({
	breadcrumbs,
	dashboardData,
	revenueData,
	profitLossData,
	expensesData,
	hotelId,
}: {
	breadcrumbs: Breadcrumb[];
	dashboardData: FinancialDashboard | null;
	revenueData: RevenueData | null;
	profitLossData: ProfitLossData | null;
	expensesData: ExpensesData | null;
	hotelId: string;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Financials",
			breadcrumbs,
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	return (
		<div className="p-4 md:p-6 space-y-4">
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList className="bg-white border p-1 rounded-xl">
					<TabsTrigger value="overview" className="rounded-lg">
						Overview
					</TabsTrigger>
					<TabsTrigger value="revenue" className="rounded-lg">
						Revenue
					</TabsTrigger>
					<TabsTrigger value="expenses" className="rounded-lg">
						Expenses
					</TabsTrigger>
					<TabsTrigger value="profit-loss" className="rounded-lg">
						P&L Statement
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					{dashboardData ? <OverviewTab data={dashboardData} /> : <DataUnavailable section="Overview" />}
				</TabsContent>

				<TabsContent value="revenue">
					{revenueData ? <RevenueTab data={revenueData} /> : <DataUnavailable section="Revenue" />}
				</TabsContent>

				<TabsContent value="expenses">
					{expensesData ? <ExpensesTab data={expensesData} /> : <DataUnavailable section="Expenses" />}
				</TabsContent>

				<TabsContent value="profit-loss">
					{profitLossData ? <ProfitLossTab data={profitLossData} /> : <DataUnavailable section="Profit & Loss" />}
				</TabsContent>
			</Tabs>
		</div>
	);
}
