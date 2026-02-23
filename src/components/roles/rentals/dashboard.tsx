"use client";

import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	PackageIcon,
	ClipboardListIcon,
	AlertCircleIcon,
	DollarSignIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	ArrowRightIcon,
	UsersIcon,
	WrenchIcon,
	BarChart3Icon,
	CheckCircle2Icon,
	BoxIcon,
	PlusCircleIcon,
	CreditCardIcon,
	RotateCcwIcon,
	ClockIcon,
	MessageSquareIcon,
} from "lucide-react";
import Link from "next/link";
import { RentalOrderDialog } from "./rental-order-dialog";

type DashboardStats = {
	totalActiveItems: number;
	totalOrders: number;
	activeRentals: number;
	overdueRentals: number;
	completedRentals: number;
	totalRevenue: number;
	outstandingAmount: number;
	ordersToday: number;
	revenueToday: number;
	totalItemsRentedOut: number;
};

type DashboardProps = {
	stats: DashboardStats;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

export function RentalsDashboard({ stats, breadcrumbs }: DashboardProps) {
	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-4 p-4 md:p-6">
				{/* Header Section */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							Rentals Dashboard
						</h1>
						<p className="text-sm text-muted-foreground">
							Manage rental items, orders, and payments
						</p>
					</div>
					<div className="flex gap-2">
						<Link href="/dashboard/items">
							<Button variant="outline" size="sm">
								<PackageIcon className="w-4 h-4 mr-2" />
								Manage Items
							</Button>
						</Link>
						<RentalOrderDialog />
					</div>
				</div>

				{/* Alert Section - Overdue Rentals */}
				{stats.overdueRentals > 0 && (
					<div className="flex items-center justify-between border-l-4 border-l-red-500 bg-red-50/50 rounded-lg px-4 py-3">
						<div className="flex items-center gap-3">
							<div className="p-1.5 bg-red-100 rounded-md">
								<AlertCircleIcon className="w-4 h-4 text-red-600" />
							</div>
							<div>
								<p className="text-sm font-semibold text-red-900">
									{stats.overdueRentals} Overdue Rental
									{stats.overdueRentals > 1 ? "s" : ""}
								</p>
								<p className="text-xs text-red-700">
									Immediate attention required
								</p>
							</div>
						</div>
						<Link href="/dashboard/overdue">
							<Button
								variant="outline"
								size="sm"
								className="border-red-300 text-red-700 hover:bg-red-100"
							>
								View Details
								<ArrowRightIcon className="w-3.5 h-3.5 ml-1.5" />
							</Button>
						</Link>
					</div>
				)}

				{/* Key Metrics Grid */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
					<MetricCard
						title="Active Items"
						value={stats.totalActiveItems}
						subtitle={`${stats.totalItemsRentedOut} rented out`}
						icon={<PackageIcon className="w-4 h-4" />}
						color="blue"
					/>

					<MetricCard
						title="Active Rentals"
						value={stats.activeRentals}
						subtitle={`${stats.ordersToday} orders today`}
						icon={<ClipboardListIcon className="w-4 h-4" />}
						color="green"
						trend={{
							label: `${stats.completedRentals} completed`,
							isPositive: true,
						}}
					/>

					<MetricCard
						title="Total Revenue"
						value={formatCurrency(stats.totalRevenue)}
						subtitle={`${formatCurrency(stats.revenueToday)} today`}
						icon={<DollarSignIcon className="w-4 h-4" />}
						color="purple"
						trend={{
							label: `${formatCurrency(stats.outstandingAmount)} outstanding`,
							isPositive: false,
						}}
					/>

					<MetricCard
						title="Overdue Rentals"
						value={stats.overdueRentals}
						subtitle={`${stats.totalOrders} total orders`}
						icon={<AlertCircleIcon className="w-4 h-4" />}
						color={stats.overdueRentals > 0 ? "red" : "gray"}
						trend={{
							label:
								stats.overdueRentals > 0 ? "Needs attention" : "All on track",
							isPositive: stats.overdueRentals === 0,
						}}
					/>
				</div>

				{/* Secondary Metrics */}
				<div className="grid grid-cols-3 gap-3">
					<div className="bg-white rounded-xl p-3 flex items-center gap-3 border">
						<div className="p-2 bg-orange-50 rounded-lg">
							<DollarSignIcon className="w-4 h-4 text-orange-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Outstanding</p>
							<p className="text-lg font-bold">
								{formatCurrency(stats.outstandingAmount)}
							</p>
							<p className="text-[11px] text-muted-foreground">Pending payments</p>
						</div>
					</div>

					<div className="bg-white rounded-xl p-3 flex items-center gap-3 border">
						<div className="p-2 bg-green-50 rounded-lg">
							<CheckCircle2Icon className="w-4 h-4 text-green-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Completed</p>
							<p className="text-lg font-bold">
								{stats.completedRentals.toLocaleString()}
							</p>
							<p className="text-[11px] text-muted-foreground">All-time rentals</p>
						</div>
					</div>

					<div className="bg-white rounded-xl p-3 flex items-center gap-3 border">
						<div className="p-2 bg-blue-50 rounded-lg">
							<BoxIcon className="w-4 h-4 text-blue-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Rented Out</p>
							<p className="text-lg font-bold">
								{stats.totalItemsRentedOut}
							</p>
							<p className="text-[11px] text-muted-foreground">With customers</p>
						</div>
					</div>
				</div>

				{/* Primary Actions */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
					<RentalOrderDialog
						trigger={
							<button className="flex items-center gap-2.5 bg-primary text-primary-foreground rounded-xl px-4 py-3 hover:bg-primary/90 transition-colors cursor-pointer text-left">
								<PlusCircleIcon className="w-5 h-5 shrink-0" />
								<div>
									<p className="text-sm font-semibold">New Order</p>
									<p className="text-[11px] opacity-80">Create rental order</p>
								</div>
							</button>
						}
					/>
					<Link href="/dashboard/payments">
						<div className="flex items-center gap-2.5 bg-green-600 text-white rounded-xl px-4 py-3 hover:bg-green-700 transition-colors cursor-pointer">
							<CreditCardIcon className="w-5 h-5 shrink-0" />
							<div>
								<p className="text-sm font-semibold">Record Payment</p>
								<p className="text-[11px] opacity-80">Process a payment</p>
							</div>
						</div>
					</Link>
					<Link href="/dashboard/orders">
						<div className="flex items-center gap-2.5 bg-blue-600 text-white rounded-xl px-4 py-3 hover:bg-blue-700 transition-colors cursor-pointer">
							<RotateCcwIcon className="w-5 h-5 shrink-0" />
							<div>
								<p className="text-sm font-semibold">Process Return</p>
								<p className="text-[11px] opacity-80">Handle item returns</p>
							</div>
						</div>
					</Link>
					<Link href="/dashboard/overdue">
						<div className="flex items-center gap-2.5 bg-amber-600 text-white rounded-xl px-4 py-3 hover:bg-amber-700 transition-colors cursor-pointer">
							<ClockIcon className="w-5 h-5 shrink-0" />
							<div>
								<p className="text-sm font-semibold">Overdue Items</p>
								<p className="text-[11px] opacity-80">Check late returns</p>
							</div>
						</div>
					</Link>
				</div>

				{/* Quick Navigation */}
				<div>
					<h3 className="text-sm font-semibold text-muted-foreground mb-2">Quick Navigation</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
						<Link href="/dashboard/orders">
							<QuickAction
								icon={<ClipboardListIcon className="w-4 h-4" />}
								title="All Orders"
								subtitle="Manage orders & returns"
							/>
						</Link>

						<Link href="/dashboard/items">
							<QuickAction
								icon={<PackageIcon className="w-4 h-4" />}
								title="Inventory"
								subtitle="Add or update items"
							/>
						</Link>

						<Link href="/dashboard/payments">
							<QuickAction
								icon={<DollarSignIcon className="w-4 h-4" />}
								title="Payments"
								subtitle="Deposits & transactions"
							/>
						</Link>

						<Link href="/dashboard/customers">
							<QuickAction
								icon={<UsersIcon className="w-4 h-4" />}
								title="Customers"
								subtitle="Rental activity"
							/>
						</Link>

						<Link href="/dashboard/maintenance">
							<QuickAction
								icon={<WrenchIcon className="w-4 h-4" />}
								title="Maintenance"
								subtitle="Items in maintenance"
							/>
						</Link>

						<Link href="/dashboard/messages">
							<QuickAction
								icon={<MessageSquareIcon className="w-4 h-4" />}
								title="Messages"
								subtitle="Customer communication"
							/>
						</Link>

						<Link href="/dashboard/reports">
							<QuickAction
								icon={<BarChart3Icon className="w-4 h-4" />}
								title="Reports"
								subtitle="Analytics & insights"
							/>
						</Link>

						<Link href="/dashboard/overdue">
							<QuickAction
								icon={<AlertCircleIcon className="w-4 h-4" />}
								title="Overdue"
								subtitle="Late return tracking"
							/>
						</Link>
					</div>
				</div>
			</div>
		</BreadCrumbWrapper>
	);
}

function QuickAction({
	icon,
	title,
	subtitle,
}: {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
}) {
	return (
		<div className="group flex items-center gap-3 rounded-2xl border border-rose-200/90 bg-white px-3 py-2.5 transition-colors hover:bg-rose-50/40 cursor-pointer">
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
				{icon}
			</div>
			<div className="min-w-0">
				<p className="text-sm font-medium text-slate-900">{title}</p>
				<p className="truncate text-[11px] text-slate-500">{subtitle}</p>
			</div>
			<ArrowRightIcon className="ml-auto h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5" />
		</div>
	);
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
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
	const iconBg = {
		blue: "bg-blue-50 text-blue-600",
		green: "bg-green-50 text-green-600",
		purple: "bg-purple-50 text-purple-600",
		red: "bg-red-50 text-red-600",
		gray: "bg-gray-50 text-gray-500",
	};

	return (
		<div className="bg-white border rounded-xl p-3">
			<div className="flex items-center justify-between mb-2">
				<p className="text-xs font-medium text-muted-foreground">{title}</p>
				<div className={cn("p-1.5 rounded-md", iconBg[color])}>
					{icon}
				</div>
			</div>
			<p className="text-2xl font-bold">{value}</p>
			<p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
			{trend && (
				<div className="flex items-center gap-1 mt-1.5">
					{trend.isPositive ? (
						<TrendingUpIcon className="w-3 h-3 text-green-600" />
					) : (
						<TrendingDownIcon className="w-3 h-3 text-amber-600" />
					)}
					<span
						className={cn(
							"text-[11px] font-medium",
							trend.isPositive ? "text-green-600" : "text-amber-600",
						)}
					>
						{trend.label}
					</span>
				</div>
			)}
		</div>
	);
}
