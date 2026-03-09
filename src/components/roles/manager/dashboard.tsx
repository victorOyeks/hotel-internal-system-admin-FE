"use client";

import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	BedDoubleIcon,
	BedIcon,
	ClipboardCheckIcon,
	DollarSignIcon,
	PackageIcon,
	ShirtIcon,
	TrendingUpIcon,
	UsersIcon,
	UtensilsIcon,
	WrenchIcon,
} from "lucide-react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	type DotProps,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { ActiveShape } from "recharts/types/util/types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";
import { useLayoutEffect, useMemo } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { BookingsData } from "./dashboard-table";
import { StatCard, QuickStatCard } from "@/components/shared/stat-card";
import { DonutChart } from "@/components/shared/donut-chart";
import type { APIOutput } from "@/lib/action-utils";
import type { ManagerBookingViewResponse } from "@/lib/fetch";
import Link from "next/link";

type OverviewData = APIOutput<"@get/api/managers/:hotelId/overview">["data"];
type EarningsGraphData =
	APIOutput<"@get/api/managers/dashboard/:hotelId/earnings-graph">["data"];
type PerformanceData =
	APIOutput<"@get/api/managers/dashboard-performance">["data"];

// ==================== KPI Row ====================
function KPIRow({ data }: { data: OverviewData }) {
	const monthLabel = data.selectedMonth
		? new Date(
				Number(data.selectedMonth.split("-")[0]),
				Number(data.selectedMonth.split("-")[1]) - 1,
			).toLocaleString("en-US", { month: "short", year: "numeric" })
		: "this month";

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
			<StatCard
				title="Total Revenue"
				value={data.totalRevenue}
				icon={DollarSignIcon}
				isCurrency
				subtitle={monthLabel}
			/>
			<StatCard
				title="Occupancy Rate"
				value={`${data.occupancyRate.toFixed(0)}%`}
				icon={BedIcon}
				subtitle={`${data.availableRooms} of ${data.totalRooms} available`}
			/>
			<StatCard
				title="Check-ins"
				value={data.totalCheckIns}
				icon={ArrowRightToLineIcon}
				subtitle={monthLabel}
			/>
			<StatCard
				title="Check-outs"
				value={data.totalCheckOuts}
				icon={ArrowLeftToLineIcon}
				subtitle={monthLabel}
			/>
			<StatCard
				title="Pending Approvals"
				value={data.pendingApprovals}
				icon={ClipboardCheckIcon}
				href="/dashboard/approvals"
				iconBgClass="bg-amber-50"
				iconColorClass="text-amber-600"
			/>
			<StatCard
				title="Active Staff"
				value={data.staffCount}
				icon={UsersIcon}
				href="/dashboard/staff-management"
			/>
		</div>
	);
}

// ==================== Revenue Trend Chart ====================
const CustomDot = (
	props: DotProps & { payload: { month: string; totalEarnings: number } },
) => {
	const { cx, cy, payload } = props;
	if (cx === undefined || cy === undefined) return null;
	return (
		<g>
			<circle
				cx={cx}
				cy={cy}
				r={6}
				fill="white"
				stroke="#22c55e"
				strokeWidth={3}
			/>
			<foreignObject
				x={cx - 25}
				y={cy - 40}
				width={payload.totalEarnings.toString().length * 24}
				height={28}
			>
				<div className="flex justify-center">
					<span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
						{formatCurrency(payload.totalEarnings, "short")}
					</span>
				</div>
			</foreignObject>
		</g>
	);
};

function getCurrentYearMonth() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function RevenueTrendChart({ graphData }: { graphData: EarningsGraphData }) {
	const [selectedMonth] = useQueryState(
		"selectedMonth",
		parseAsString.withDefault(getCurrentYearMonth()),
	);

	const {
		selectedMonthEarnings,
		selectedMonthName,
		selectedMonthYear,
		selectedMonthLabel,
	} = useMemo(() => {
		const [y, m] = selectedMonth.split("-").map(Number);
		const monthDate = new Date(y, m - 1);
		const name = monthDate
			.toLocaleString("en-US", { month: "long" })
			.toUpperCase();
		const label = monthDate.toLocaleString("en-US", {
			month: "long",
			year: "numeric",
		});
		const earnings =
			graphData.find(
				(d) => d.month.toUpperCase() === name && d.year === y,
			)?.totalEarnings ?? 0;
		return {
			selectedMonthEarnings: earnings,
			selectedMonthName: name,
			selectedMonthYear: y,
			selectedMonthLabel: label,
		};
	}, [graphData, selectedMonth]);

	const SelectedDot = useMemo(
		() =>
			function Dot(
				props: DotProps & {
					payload: { month: string; year: number; totalEarnings: number };
					index: number;
				},
			) {
				const { cx, cy, payload, index } = props;
				if (cx === undefined || cy === undefined) return null;
				if (
					payload.month.toUpperCase() !== selectedMonthName ||
					payload.year !== selectedMonthYear
				)
					return null;
				return (
					<g key={`dot-${index}`}>
						<circle
							cx={cx}
							cy={cy}
							r={5}
							fill="#22c55e"
							stroke="white"
							strokeWidth={2}
						/>
					</g>
				);
			},
		[selectedMonthName, selectedMonthYear],
	);

	return (
		<div className="bg-white py-4 px-2 md:py-6 md:px-5 rounded-2xl">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-sm font-medium text-gray-600">Revenue Trend</h3>
					<p className="text-2xl font-semibold text-primary">
						{formatCurrency(selectedMonthEarnings)}
					</p>
					<p className="text-xs text-gray-400">{selectedMonthLabel}</p>
				</div>
				<MonthYearPicker />
			</div>
			<div className="h-56 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={graphData}
						margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
					>
						<defs>
							<linearGradient
								id="revenueGradient"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
								<stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
							</linearGradient>
						</defs>
						<XAxis
							dataKey="month"
							axisLine={false}
							tickLine={false}
							tick={(props: { x: number; y: number; payload: { value: string } }) => {
								const { x, y, payload } = props;
								const isSelected =
									payload.value.toUpperCase() === selectedMonthName;
								return (
									<text
										x={x}
										y={y + 12}
										textAnchor="middle"
										fontSize={11}
										fontWeight={isSelected ? 700 : 400}
										fill={isSelected ? "#16a34a" : "#9ca3af"}
									>
										{payload.value.slice(0, 3)}
									</text>
								);
							}}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: 11, fill: "#9ca3af" }}
							tickFormatter={(v) => formatCurrency(v, "short")}
						/>
						<Tooltip
							cursor={false}
							formatter={(value: number) => [
								formatCurrency(value),
								"Revenue",
							]}
							contentStyle={{
								backgroundColor: "#fff",
								borderRadius: "8px",
								border: "none",
								boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
								fontSize: "12px",
							}}
						/>
						<Area
							type="monotone"
							dataKey="totalEarnings"
							stroke="#22c55e"
							strokeWidth={2.5}
							fill="url(#revenueGradient)"
							dot={SelectedDot as ActiveShape<DotProps>}
							activeDot={CustomDot as ActiveShape<DotProps>}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

// ==================== Revenue By Department Donut ====================
function RevenueDepartmentChart({ data }: { data: OverviewData }) {
	const chartData = useMemo(
		() =>
			[
				{
					name: "Accommodation",
					value: data.accommodationRevenue,
					color: "#6366f1",
				},
				{
					name: "F&B",
					value: data.restaurantRevenue,
					color: "#f59e0b",
				},
				{ name: "Laundry & Valet", value: data.laundryRevenue, color: "#06b6d4" },
				{ name: "Guest Services", value: data.rentalRevenue, color: "#8b5cf6" },
				{
					name: "Other Income",
					value: data.otherIncomeRevenue,
					color: "#ec4899",
				},
			].filter((item) => item.value > 0),
		[data],
	);

	return (
		<DonutChart
			data={chartData}
			title="Revenue by Department"
			centerValue={formatCurrency(data.totalRevenue, "short")}
			centerLabel="Total Revenue"
		/>
	);
}

// ==================== Operations Quick Stats ====================
function OperationsQuickStats({ data }: { data: OverviewData }) {
	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
			<QuickStatCard
				title="F&B"
				primaryValue={formatCurrency(data.restaurantTodaySales, "short")}
				primaryLabel="today's sales"
				secondaryValue={data.restaurantActiveOrders}
				secondaryLabel="active orders"
				icon={UtensilsIcon}
				accentColor="bg-orange-50 text-orange-600"
				href="/dashboard/operations"
			/>
			<QuickStatCard
				title="Laundry & Valet"
				primaryValue={data.laundryPendingOrders}
				primaryLabel="pending orders"
				secondaryValue={formatCurrency(data.laundryTodayRevenue, "short")}
				secondaryLabel="today's revenue"
				icon={ShirtIcon}
				accentColor="bg-cyan-50 text-cyan-600"
				href="/dashboard/operations"
			/>
			<QuickStatCard
				title="Guest Services"
				primaryValue={data.activeRentals}
				primaryLabel="active rentals"
				secondaryValue={data.overdueRentals}
				secondaryLabel="overdue"
				icon={PackageIcon}
				accentColor="bg-violet-50 text-violet-600"
				href="/dashboard/operations"
			/>
			<QuickStatCard
				title="Inventory"
				primaryValue={data.lowStockCount}
				primaryLabel="low stock alerts"
				secondaryValue={data.pendingRestockRequests}
				secondaryLabel="pending restocks"
				icon={WrenchIcon}
				accentColor="bg-rose-50 text-rose-600"
				href="/dashboard/inventory"
			/>
		</div>
	);
}

// ==================== Branch Performance ====================
function BranchPerformance({
	dashboardPerformanceData,
}: {
	dashboardPerformanceData: PerformanceData;
}) {
	const data = useMemo(
		() =>
			dashboardPerformanceData
				.sort((a, b) => b.performancePercentage - a.performancePercentage)
				.slice(0, 5)
				.map((item) => ({
					name: item.hotelName,
					shortName:
						item.hotelName.length > 12
							? `${item.hotelName.slice(0, 12)}…`
							: item.hotelName,
					value: item.performancePercentage,
				})),
		[dashboardPerformanceData],
	);

	return (
		<div className="bg-white p-4 md:p-6 rounded-2xl">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-medium text-gray-600">
					Branch Performance
				</h3>
				{dashboardPerformanceData.length > 5 && (
					<span className="text-xs text-gray-400">Top 5</span>
				)}
			</div>
			<div className="w-full" style={{ height: Math.max(140, data.length * 32 + 30) }}>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={data}
						layout="vertical"
						margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
						barCategoryGap="25%"
					>
						<XAxis type="number" hide domain={[0, 100]} />
						<YAxis
							type="category"
							dataKey="shortName"
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: 11, fill: "#6b7280" }}
							width={100}
						/>
						<Bar
							dataKey="value"
							fill="var(--primary-5)"
							radius={[0, 6, 6, 0]}
							maxBarSize={16}
							label={{
								position: "right",
								fontSize: 11,
								fill: "#374151",
								formatter: (v: number) => `${v}%`,
							}}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "#fff",
								borderRadius: "8px",
								border: "none",
								boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
								fontSize: "12px",
							}}
							cursor={{ fill: "rgba(0,0,0,0.04)" }}
							formatter={(value: number, _name: string, props: { payload: { name: string } }) => [
								`${value}%`,
								props.payload.name,
							]}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

// ==================== Today's Snapshot ====================
function TodaySnapshot({ data }: { data: OverviewData }) {
	return (
		<div className="bg-white p-4 rounded-2xl">
			<h3 className="text-sm font-medium text-gray-600 mb-3">
				Today&apos;s Snapshot
			</h3>
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-500">Revenue</span>
					<span className="text-sm font-semibold text-primary">
						{formatCurrency(data.todayRevenue, "short")}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-500">Available Rooms</span>
					<span className="text-sm font-semibold text-primary">
						{data.availableRooms}/{data.totalRooms}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-500">Pending Approvals</span>
					<span className="text-sm font-semibold text-amber-600">
						{data.pendingApprovals}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-500">Laundry Pending</span>
					<span className="text-sm font-semibold text-cyan-600">
						{data.laundryPendingOrders}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-500">Overdue Rentals</span>
					<span className="text-sm font-semibold text-red-500">
						{data.overdueRentals}
					</span>
				</div>
			</div>
		</div>
	);
}

// ==================== Main Dashboard ====================
export function ManagerDashboard({
	breadcrumbs = [],
	overviewData,
	graphData,
	dashboardPerformanceData,
	bookingData,
}: {
	breadcrumbs: Breadcrumb[];
	overviewData: OverviewData;
	graphData: EarningsGraphData;
	dashboardPerformanceData: PerformanceData;
	bookingData: ManagerBookingViewResponse[];
}) {
	const setBreadCrumb = useSetAtom(breadcrumbAtom);

	useLayoutEffect(() => {
		setBreadCrumb({
			title: "Dashboard",
			breadcrumbs,
		});
	}, [breadcrumbs, setBreadCrumb]);

	return (
		<div className="p-4 md:p-6 space-y-3 md:space-y-4 pb-4">
			{/* KPI Row */}
			<KPIRow data={overviewData} />

			{/* Charts Row: Revenue Trend + Revenue by Department */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
				<div className="lg:col-span-3">
					<RevenueTrendChart graphData={graphData} />
				</div>
				<div className="lg:col-span-2">
					<RevenueDepartmentChart data={overviewData} />
				</div>
			</div>

			{/* Operations Quick Stats */}
			<OperationsQuickStats data={overviewData} />

			{/* Two-Column: Bookings + Today's Snapshot & Branch Performance */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
				<section className="lg:col-span-2 bg-white p-3 rounded-2xl">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-sm font-medium text-gray-600">
							Recent Bookings
						</h3>
						<Button variant="link" size="sm" asChild>
							<Link href="/dashboard/bookings">View all</Link>
						</Button>
					</div>
					<BookingsData bookings={bookingData} />
				</section>

				<div className="flex flex-col gap-3">
					<TodaySnapshot data={overviewData} />
					{dashboardPerformanceData.length > 0 && (
						<BranchPerformance
							dashboardPerformanceData={dashboardPerformanceData}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
