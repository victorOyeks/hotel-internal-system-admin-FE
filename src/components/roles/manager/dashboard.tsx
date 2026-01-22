"use client";
import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	BedDoubleIcon,
	BedIcon,
	BedSingleIcon,
	CalendarIcon,
	DollarSign,
	TrendingUpIcon,
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
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";
import { useLayoutEffect, useMemo } from "react";
import { BookingsData } from "./dashboard-table";
import type { APIOutput } from "@/lib/action-utils";
import type { ManagerBookingViewResponse } from "@/lib/fetch";
import Link from "next/link";

function EarningsSideA({
	dashboardData,
}: {
	dashboardData: ManagerDashboardData;
}) {
	const earnings = [
		{
			title: "Earnings",
			icon: DollarSign,
			value: formatCurrency(dashboardData.totalEarnings, "short"),
		},
		{
			title: "Occupancy Rate",
			icon: BedIcon,
			value: `${dashboardData.occupancyRate.toFixed(0)}%`,
		},
		{
			title: "Check In",
			icon: ArrowRightToLineIcon,
			value: dashboardData.totalCheckIns,
		},
		{
			title: "Check Out",
			icon: ArrowLeftToLineIcon,
			value: dashboardData.totalCheckOuts,
		},
		{
			title: "Total Rooms",
			icon: BedSingleIcon,
			value: dashboardData.totalRooms,
		},
		{
			title: "Available Rooms",
			icon: BedDoubleIcon,
			value: dashboardData.totalAvailableRooms,
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

function CurvedLineChart({ graphData }: { graphData: EarningsGraphData }) {
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
					tick={{ fontSize: 12, fill: "#9ca3af" }}
					className="text-gray-400"
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
					dot={false}
					activeDot={CustomDot as ActiveShape<DotProps>}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}

export function EarningsSideB({ graphData }: { graphData: EarningsGraphData }) {
	const currentMonthEarnings = useMemo(
		() =>
			graphData.reduce(
				(acc, curr) =>
					acc +
					(curr.month === new Date().toLocaleString("en-US", { month: "long" })
						? curr.totalEarnings
						: 0),
				0,
			),
		[graphData],
	);

	const totalEarningsStr = useMemo(
		() => formatCurrency(currentMonthEarnings),
		[currentMonthEarnings],
	);
	return (
		<div className="bg-white py-4 px-2 md:py-6 md:px-5 rounded-3xl space-y-4">
			<Button
				variant={"outline"}
				size={"sm"}
				className="shadow-none text-gray-500"
			>
				<CalendarIcon />
				<span>This month</span>
			</Button>

			<div>
				<h1 className="text-3xl font-semibold text-primary">
					{totalEarningsStr}
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

function DashboardHero({
	dashboardData,
	graphData,
}: {
	graphData: EarningsGraphData;
	dashboardData: ManagerDashboardData;
}) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
			<EarningsSideA dashboardData={dashboardData} />
			<EarningsSideB graphData={graphData} />
		</div>
	);
}

function BranchPerformance({
	dashboardPerformanceData,
}: {
	dashboardPerformanceData: PerformanceData;
}) {
	return (
		<div className="bg-white p-4 md:p-6 rounded-3xl space-y-4">
			<h2 className="text-xl font-semibold text-primary">Branch Performance</h2>
			{/* Placeholder for branch performance chart */}
			<div className="h-64 md:h-48 w-full">
				<BranchPerformanceChart
					dashboardPerformanceData={dashboardPerformanceData}
				/>
			</div>
		</div>
	);
}

function BranchPerformanceChart({
	dashboardPerformanceData,
}: {
	dashboardPerformanceData: PerformanceData;
}) {
	const data = useMemo(
		() =>
			dashboardPerformanceData.map((item) => ({
				name: item.hotelName,
				value: item.performancePercentage,
				/// ${totalEarnings}K
				yLabel: item.performancePercentage,
			})),
		[dashboardPerformanceData],
	);
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
					tickFormatter={(_, i) => `${data[i].yLabel}%`}
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
					formatter={(value: number) => [`${value}%`, "Profit"]}
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

type ManagerDashboardData =
	APIOutput<"@get/api/managers/dashboard/:hotelId">["data"];
type EarningsGraphData =
	APIOutput<"@get/api/managers/dashboard/:hotelId/earnings-graph">["data"];
type PerformanceData =
	APIOutput<"@get/api/managers/dashboard-performance">["data"];

export function ManagerDashboard({
	breadcrumbs = [],
	dashboardData,
	graphData,
	dashboardPerformanceData,
	bookingData,
}: {
	breadcrumbs: Breadcrumb[];
	dashboardData: ManagerDashboardData;
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
		<div className="p-4 md:p-6 space-y-2 md:space-y-4">
			<DashboardHero graphData={graphData} dashboardData={dashboardData} />
			<BranchPerformance dashboardPerformanceData={dashboardPerformanceData} />
			{/* <HotelSuits /> */}
			<section className="bg-card p-2 rounded-2xl md:rounded-4xl">
				<div className="flex items-center justify-between">
					<h2 className="text-xl p-2">Bookings</h2>

					<Button variant={"link"} asChild>
						<Link href={"/dashboard/bookings"}>View all</Link>
					</Button>
				</div>
				<BookingsData bookings={bookingData} />
			</section>
		</div>
	);
}
