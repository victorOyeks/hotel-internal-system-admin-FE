"use client";
import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	BedDoubleIcon,
	BedIcon,
	BedSingleIcon,
	DollarSign,
	TrendingUpIcon,
	UtensilsIcon,
	ShirtIcon,
	PackageIcon,
	WarehouseIcon,
	ShieldCheckIcon,
	UsersIcon,
} from "lucide-react";
import {
	Bar,
	BarChart,
	type DotProps,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { ActiveShape } from "recharts/types/util/types";
import { formatCurrency } from "@/lib/utils";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";
import { useLayoutEffect, useMemo } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import type { APIOutput } from "@/lib/action-utils";
import { QuickStatCard } from "@/components/shared/stat-card";
import { DonutChart } from "@/components/shared/donut-chart";

function EarningsSideA({ overviewData }: { overviewData: OverviewData }) {
	const earnings = [
		{
			title: "Earnings",
			icon: DollarSign,
			value: formatCurrency(overviewData.totalEarnings, "short"),
		},
		{
			title: "Occupancy Rate",
			icon: BedIcon,
			value: `${overviewData.overallOccupancyRate.toFixed(1)}%`,
		},
		{
			title: "Check In",
			icon: ArrowRightToLineIcon,
			value: overviewData.totalCheckIns,
		},
		{
			title: "Check Out",
			icon: ArrowLeftToLineIcon,
			value: overviewData.totalCheckOuts,
		},
		{
			title: "Total Rooms",
			icon: BedSingleIcon,
			value: overviewData.totalRooms,
		},
		{
			title: "Available Rooms",
			icon: BedDoubleIcon,
			value: overviewData.totalAvailableRooms,
		},
	];
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
			{earnings.map((earning) => (
				<div
					key={earning.title}
					className="bg-white p-2 md:pl-4 rounded-2xl flex items-center space-x-2"
				>
					<div className="size-10 md:size-12 aspect-square bg-primary-5/40 rounded-full flex items-center justify-center">
						<earning.icon className="text-primary-1 size-5" />
					</div>
					<div className="flex-1">
						<p className="text-xs md:text-sm text-gray-400">{earning.title}</p>
						<p className="text-xl md:text-2xl text-primary font-semibold font-inter tracking-[0.01em] ">
							{earning.value}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

const CustomDot = (
	props: DotProps & { payload: { month: string; totalEarnings: number } },
) => {
	const { cx, cy, payload } = props;
	// Guard against undefined coordinates
	if (cx === undefined || cy === undefined) {
		return null;
	}
	// Only show dot for NOV (the
	return (
		<g>
			{/* White circle background */}
			<circle
				cx={cx}
				cy={cy}
				r={6}
				fill="white"
				stroke="#22c55e"
				strokeWidth={3}
			/>
			{/* Green label above the dot */}
			<foreignObject
				x={cx - 25}
				y={cy - 40}
				width={payload.totalEarnings.toString().length * 24}
				height={28}
			>
				<div className="flex justify-center">
					<span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
						{payload.totalEarnings.toLocaleString("en-NG", {
							style: "currency",
							currency: "NGN",
						})}
					</span>
				</div>
			</foreignObject>
		</g>
	);
};

function CurvedLineChart({
	graphData,
	selectedMonthName,
	selectedMonthYear,
}: {
	graphData: { month: string; year: number; totalEarnings: number }[];
	selectedMonthName: string;
	selectedMonthYear: number;
}) {
	const SelectedDot = useMemo(
		() =>
			function Dot(
				props: DotProps & {
					index?: number;
					payload: { month: string; year: number; totalEarnings: number };
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
		<ResponsiveContainer width="100%" height="100%">
			<LineChart
				data={graphData}
				margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
			>
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
								fontSize={12}
								fontWeight={isSelected ? 700 : 400}
								fill={isSelected ? "#16a34a" : "#9ca3af"}
							>
								{payload.value.slice(0, 3)}
							</text>
						);
					}}
				/>
				<YAxis hide />
				<Tooltip<number, string>
					cursor={false}
					formatter={(value) => {
						return [formatCurrency(value), "Total Earnings"];
					}}
				/>
				<Line
					type="monotone"
					dataKey="totalEarnings"
					stroke="#22c55e"
					strokeWidth={3}
					dot={SelectedDot as ActiveShape<DotProps>}
					activeDot={CustomDot as ActiveShape<DotProps>}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}

function getCurrentYearMonth() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function EarningsSideB({
	graphData,
	totalEarning,
}: {
	graphData: { month: string; year: number; totalEarnings: number }[];
	totalEarning: number;
}) {
	const [selectedMonth] = useQueryState(
		"selectedMonth",
		parseAsString.withDefault(getCurrentYearMonth()),
	);

	const { selectedMonthName, selectedMonthYear, selectedMonthLabel } =
		useMemo(() => {
			const [y, m] = selectedMonth.split("-").map(Number);
			const monthDate = new Date(y, m - 1);
			const name = monthDate
				.toLocaleString("en-US", { month: "long" })
				.toUpperCase();
			const label = monthDate.toLocaleString("en-US", {
				month: "long",
				year: "numeric",
			});
			return {
				selectedMonthName: name,
				selectedMonthYear: y,
				selectedMonthLabel: label,
			};
		}, [selectedMonth]);

	return (
		<div className="bg-white py-4 px-2 md:py-6 md:px-5 rounded-3xl space-y-4">
			<MonthYearPicker />

			<div>
				<h1 className="text-3xl font-semibold text-primary">
					{formatCurrency(totalEarning)}
				</h1>
				<p className="text-gray-500 text-sm flex items-center space-x-1">
					<span>Total profit</span>
					<span className="text-green-500 font-semibold flex items-center space-x-1">
						<TrendingUpIcon className="inline size-4" />
						<span>{selectedMonthLabel}</span>
					</span>
				</p>
			</div>

			<div className="h-64 md:h-38 w-full">
				<CurvedLineChart
					graphData={graphData}
					selectedMonthName={selectedMonthName}
					selectedMonthYear={selectedMonthYear}
				/>
			</div>
		</div>
	);
}

function DashboardHero({
	graphData,
	overviewData,
}: {
	graphData: { month: string; totalEarnings: number }[];
	overviewData: OverviewData;
}) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
			<EarningsSideA overviewData={overviewData} />
			<EarningsSideB
				totalEarning={overviewData.totalEarnings}
				graphData={graphData}
			/>
		</div>
	);
}

function BranchPerformance({
	performanceData,
}: {
	performanceData: PerformanceData;
}) {
	return (
		<div className="bg-white p-4 md:p-6 rounded-3xl space-y-4">
			<h2 className="text-xl font-semibold text-primary">Branch Performance</h2>
			{/* Placeholder for branch performance chart */}
			<div className="h-64 md:h-48 w-full">
				<BranchPerformanceChart performanceData={performanceData} />
			</div>
		</div>
	);
}

function BranchPerformanceChart({
	performanceData,
}: {
	performanceData: PerformanceData;
}) {
	const data = performanceData.map((item) => ({
		name: item.hotelName,
		value: item.performancePercentage,
		yLabel: `${item.performancePercentage * 100}%`,
	}));

	return (
		<ResponsiveContainer width="100%" height={240}>
			<BarChart
				data={data}
				margin={{ top: 20, right: 10, left: -30, bottom: 5 }}
				barCategoryGap="20%"
			>
				<YAxis
					dataKey="value"
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 11, fill: "var(--color-primary-1)" }}
					tickFormatter={(_, i) => data[i].yLabel}
				/>
				<XAxis
					dataKey="name"
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 11, fill: "var(--color-primary-1)" }}
				/>
				<Bar
					dataKey="value"
					fill="var(--primary-5)"
					radius={[6, 6, 6, 6]}
					maxBarSize={20}
				/>
				<Tooltip
					contentStyle={{
						backgroundColor: "#fff",
						borderRadius: "8px",
						border: "none",
						boxShadow:
							"0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
					}}
					itemStyle={{ color: "#000" }}
					cursor={false}
					formatter={(value: number) => [
						value.toLocaleString("en-NG", {
							style: "currency",
							currency: "NGN",
						}),
						"Profit",
					]}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}

function _HotelSuits() {
	const suits = [
		{
			name: "Executive Suite",
			pricePerNight: 150000,
		},
		{
			name: "Deluxe Suite",
			pricePerNight: 120000,
		},
		{
			name: "Standard Suite",
			pricePerNight: 80000,
		},
		{
			name: "Budget Suite",
			pricePerNight: 50000,
		},
	];

	return (
		<div
			className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-3 md:gap-4"
			style={{
				scrollbarWidth: "none",
				scrollbarColor: "var(--primary-5) transparent",
			}}
		>
			{suits.map((suit) => (
				<div
					key={suit.name}
					className="bg-white p-2 rounded-3xl flex-shrink-0 border border-primary-5/50 flex flex-col md:flex-row md:items-center gap-y-2 md:space-x-2"
				>
					<div className="md:size-12 w-full aspect-square rounded-xl bg-primary-5/10" />

					<div className="pl-1 md:pl-0">
						<p className="text-xs md:text-sm text-gray-500">{suit.name}</p>
						<p>
							<span className="md:text-lg font-semibold text-primary">
								{formatCurrency(suit.pricePerNight)}
							</span>
							<span className="text-xs text-gray-500">/night</span>
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

type OverviewData =
	APIOutput<"@get/api/hotel-owners/dashboard/overview">["data"];
type PerformanceData =
	APIOutput<"@get/api/hotel-owners/dashboard-performance">["data"];
type HotelOverviewData =
	APIOutput<"@get/api/hotel-owners/:hotelId/overview">["data"] | null;

function HotelQuickStats({
	data,
	hotelName,
}: {
	data: NonNullable<HotelOverviewData>;
	hotelName?: string;
}) {
	return (
		<div className="space-y-3">
			<h2 className="text-lg font-semibold text-primary">
				{hotelName ? `${hotelName} — Today's Snapshot` : "Hotel Snapshot"}
			</h2>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
				<QuickStatCard
					title="Today's Revenue"
					primaryValue={formatCurrency(data.todayRevenue, "short")}
					primaryLabel="earned today"
					icon={DollarSign}
					accentColor="bg-green-50 text-green-600"
				/>
				<QuickStatCard
					title="Pending Approvals"
					primaryValue={data.pendingApprovals}
					primaryLabel="awaiting review"
					icon={ShieldCheckIcon}
					href="/dashboard/approvals"
					accentColor="bg-yellow-50 text-yellow-600"
				/>
				<QuickStatCard
					title="Staff"
					primaryValue={data.staffCount}
					primaryLabel="active staff"
					icon={UsersIcon}
					href="/dashboard/staff-management"
					accentColor="bg-indigo-50 text-indigo-600"
				/>
				<QuickStatCard
					title="Occupancy"
					primaryValue={`${data.occupancyRate.toFixed(1)}%`}
					primaryLabel={`${data.availableRooms} of ${data.totalRooms} available`}
					icon={BedDoubleIcon}
					href="/dashboard/rooms"
					accentColor="bg-blue-50 text-blue-600"
				/>
			</div>
		</div>
	);
}

function DepartmentStats({
	data,
}: {
	data: NonNullable<HotelOverviewData>;
}) {
	return (
		<div className="space-y-3">
			<h2 className="text-lg font-semibold text-primary">Department Overview</h2>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
				<QuickStatCard
					title="Restaurant"
					primaryValue={formatCurrency(data.restaurantTodaySales, "short")}
					primaryLabel="today's sales"
					secondaryValue={data.restaurantActiveOrders}
					secondaryLabel="active orders"
					icon={UtensilsIcon}
					href="/dashboard/operations"
					accentColor="bg-orange-50 text-orange-600"
				/>
				<QuickStatCard
					title="Laundry"
					primaryValue={formatCurrency(data.laundryTodayRevenue, "short")}
					primaryLabel="today's revenue"
					secondaryValue={data.laundryPendingOrders}
					secondaryLabel="pending"
					icon={ShirtIcon}
					href="/dashboard/operations"
					accentColor="bg-purple-50 text-purple-600"
				/>
				<QuickStatCard
					title="Rentals"
					primaryValue={data.activeRentals}
					primaryLabel="active rentals"
					secondaryValue={data.overdueRentals}
					secondaryLabel="overdue"
					icon={PackageIcon}
					href="/dashboard/operations"
					accentColor="bg-teal-50 text-teal-600"
				/>
				<QuickStatCard
					title="Inventory"
					primaryValue={data.lowStockCount}
					primaryLabel="low stock items"
					secondaryValue={data.pendingRestockRequests}
					secondaryLabel="restock requests"
					icon={WarehouseIcon}
					href="/dashboard/inventory"
					accentColor="bg-rose-50 text-rose-600"
				/>
			</div>
		</div>
	);
}

function RevenueBreakdown({
	data,
}: {
	data: NonNullable<HotelOverviewData>;
}) {
	const revenueData = [
		{ name: "Accommodation", value: data.accommodationRevenue, color: "#3b82f6" },
		{ name: "Restaurant", value: data.restaurantRevenue, color: "#f97316" },
		{ name: "Laundry", value: data.laundryRevenue, color: "#8b5cf6" },
		{ name: "Rentals", value: data.rentalRevenue, color: "#14b8a6" },
		{ name: "Other Income", value: data.otherIncomeRevenue, color: "#6b7280" },
	].filter((d) => d.value > 0);

	const totalRevenue =
		data.accommodationRevenue +
		data.restaurantRevenue +
		data.laundryRevenue +
		data.rentalRevenue +
		data.otherIncomeRevenue;

	if (revenueData.length === 0) return null;

	return (
		<DonutChart
			data={revenueData}
			title={`Revenue Breakdown — ${data.selectedMonth}`}
			centerLabel="Total Revenue"
			centerValue={formatCurrency(totalRevenue, "short")}
		/>
	);
}

export function HotelOwnerDashboard({
	breadcrumbs = [],
	graphData,
	overviewData,
	performanceData,
	hotelOverviewData,
	selectedHotelName,
}: {
	breadcrumbs: Breadcrumb[];
	overviewData: OverviewData;
	graphData: {
		month: string;
		totalEarnings: number;
	}[];
	performanceData: PerformanceData;
	hotelOverviewData?: HotelOverviewData;
	selectedHotelName?: string;
}) {
	const setBreadCrumb = useSetAtom(breadcrumbAtom);

	useLayoutEffect(() => {
		setBreadCrumb({
			title: "Dashboard",
			breadcrumbs,
		});
	}, [breadcrumbs, setBreadCrumb]);

	return (
		<div className="p-4 md:p-6 space-y-2 md:space-y-4">
			<DashboardHero overviewData={overviewData} graphData={graphData} />

			{hotelOverviewData && (
				<>
					<HotelQuickStats
						data={hotelOverviewData}
						hotelName={selectedHotelName}
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
						<DepartmentStats data={hotelOverviewData} />
						<RevenueBreakdown data={hotelOverviewData} />
					</div>
				</>
			)}

			<BranchPerformance performanceData={performanceData} />
		</div>
	);
}
