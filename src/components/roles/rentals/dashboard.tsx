"use client";

import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	PackageIcon,
	ClipboardListIcon,
	AlertCircleIcon,
	DollarSignIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	PlusCircleIcon,
	ArrowRightIcon,
} from "lucide-react";
import Link from "next/link";
import { RentalOrderDialog } from "./rental-order-dialog";

type DashboardStats = {
	// Inventory Metrics
	totalActiveItems: number;
	totalQuantity: number;
	currentlyRented: number;
	availableItems: number;

	// Operational Metrics
	totalOrders: number;
	activeRentals: number;
	overdueRentals: number;
	completedRentals: number;
	ordersToday: number;
	completedToday: number;

	// Financial Metrics
	totalRevenue: number;
	outstandingAmount: number;
	revenueToday: number;
	depositsHeld: number;
	pendingRefunds: number;
};

type DashboardProps = {
	stats: DashboardStats;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

export function RentalsDashboard({ stats, breadcrumbs }: DashboardProps) {
	const utilizationRate =
		stats.totalQuantity > 0
			? ((stats.currentlyRented / stats.totalQuantity) * 100).toFixed(1)
			: "0";

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				{/* Header Section */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							Rentals Dashboard
						</h1>
						<p className="text-muted-foreground mt-1">
							Manage rental items, orders, and payments
						</p>
					</div>
					<div className="flex gap-2">
						<Link href="/dashboard/items">
							<Button variant="outline">
								<PackageIcon className="w-4 h-4 mr-2" />
								Manage Items
							</Button>
						</Link>
						<RentalOrderDialog />
					</div>
				</div>

				{/* Alert Section - Overdue Rentals */}
				{stats.overdueRentals > 0 && (
					<Card className="border-l-4 border-l-red-500 bg-red-50/50">
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-red-100 rounded-lg">
										<AlertCircleIcon className="w-6 h-6 text-red-600" />
									</div>
									<div>
										<h3 className="font-semibold text-red-900">
											{stats.overdueRentals} Overdue Rental
											{stats.overdueRentals > 1 ? "s" : ""}
										</h3>
										<p className="text-sm text-red-700">
											Immediate attention required for late returns
										</p>
									</div>
								</div>
								<Link href="/dashboard/overdue">
									<Button
										variant="outline"
										className="border-red-300 text-red-700 hover:bg-red-100"
									>
										View Details
										<ArrowRightIcon className="w-4 h-4 ml-2" />
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Key Metrics Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Inventory Metric */}
					<MetricCard
						title="Inventory Status"
						value={stats.availableItems}
						subtitle={`${stats.currentlyRented} currently rented`}
						icon={<PackageIcon className="w-5 h-5" />}
						color="blue"
						trend={{
							label: `${utilizationRate}% utilization`,
							isPositive: Number(utilizationRate) > 50,
						}}
					/>

					{/* Active Rentals */}
					<MetricCard
						title="Active Rentals"
						value={stats.activeRentals}
						subtitle={`${stats.ordersToday} orders today`}
						icon={<ClipboardListIcon className="w-5 h-5" />}
						color="green"
						trend={{
							label: `${stats.completedToday} completed today`,
							isPositive: true,
						}}
					/>

					{/* Revenue */}
					<MetricCard
						title="Total Revenue"
						value={`$${stats.totalRevenue.toLocaleString()}`}
						subtitle={`$${stats.revenueToday.toLocaleString()} today`}
						icon={<DollarSignIcon className="w-5 h-5" />}
						color="purple"
						trend={{
							label: `$${stats.outstandingAmount.toLocaleString()} outstanding`,
							isPositive: false,
						}}
					/>

					{/* Overdue */}
					<MetricCard
						title="Overdue Rentals"
						value={stats.overdueRentals}
						subtitle={`${stats.totalOrders} total orders`}
						icon={<AlertCircleIcon className="w-5 h-5" />}
						color={stats.overdueRentals > 0 ? "red" : "gray"}
						trend={{
							label:
								stats.overdueRentals > 0 ? "Needs attention" : "All on track",
							isPositive: stats.overdueRentals === 0,
						}}
					/>
				</div>

				{/* Secondary Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Deposits Held
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								${stats.depositsHeld.toLocaleString()}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								{stats.pendingRefunds > 0 && (
									<span className="text-amber-600">
										${stats.pendingRefunds.toLocaleString()} pending refund
									</span>
								)}
							</p>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Completed Rentals
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats.completedRentals.toLocaleString()}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								All-time rentals completed
							</p>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Total Items
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.totalActiveItems}</div>
							<p className="text-xs text-muted-foreground mt-1">
								{stats.totalQuantity} total units
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions Section */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Common rental management tasks</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<Link href="/dashboard/orders">
								<Button
									variant="outline"
									className="w-full justify-start h-auto py-4"
								>
									<div className="flex flex-col items-start gap-1">
										<div className="flex items-center gap-2">
											<ClipboardListIcon className="w-4 h-4" />
											<span className="font-semibold">View All Orders</span>
										</div>
										<span className="text-xs text-muted-foreground">
											Manage rental orders and returns
										</span>
									</div>
								</Button>
							</Link>

							<Link href="/dashboard/items">
								<Button
									variant="outline"
									className="w-full justify-start h-auto py-4"
								>
									<div className="flex flex-col items-start gap-1">
										<div className="flex items-center gap-2">
											<PackageIcon className="w-4 h-4" />
											<span className="font-semibold">Manage Inventory</span>
										</div>
										<span className="text-xs text-muted-foreground">
											Add or update rental items
										</span>
									</div>
								</Button>
							</Link>

							<Link href="/dashboard/payments">
								<Button
									variant="outline"
									className="w-full justify-start h-auto py-4"
								>
									<div className="flex flex-col items-start gap-1">
										<div className="flex items-center gap-2">
											<DollarSignIcon className="w-4 h-4" />
											<span className="font-semibold">Payment History</span>
										</div>
										<span className="text-xs text-muted-foreground">
											View deposits and transactions
										</span>
									</div>
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</BreadCrumbWrapper>
	);
}

type MetricCardProps = {
	title: string;
	value: number | string;
	subtitle: string;
	icon: React.ReactNode;
	color: "blue" | "green" | "purple" | "red" | "gray";
	trend?: {
		label: string;
		isPositive: boolean;
	};
};

function MetricCard({
	title,
	value,
	subtitle,
	icon,
	color,
	trend,
}: MetricCardProps) {
	const colorClasses = {
		blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
		green: "bg-green-500/10 text-green-600 border-green-500/20",
		purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
		red: "bg-red-500/10 text-red-600 border-red-500/20",
		gray: "bg-gray-500/10 text-gray-600 border-gray-500/20",
	};

	return (
		<Card className="hover:shadow-lg transition-all duration-300 border-l-4">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium text-muted-foreground">
						{title}
					</CardTitle>
					<div className={cn("p-2 rounded-lg", colorClasses[color])}>
						{icon}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="text-3xl font-bold">{value}</div>
				<p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
				{trend && (
					<div className="flex items-center gap-1 mt-2">
						{trend.isPositive ? (
							<TrendingUpIcon className="w-3 h-3 text-green-600" />
						) : (
							<TrendingDownIcon className="w-3 h-3 text-amber-600" />
						)}
						<span
							className={cn(
								"text-xs font-medium",
								trend.isPositive ? "text-green-600" : "text-amber-600",
							)}
						>
							{trend.label}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
