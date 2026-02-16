"use client";

import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	ShirtIcon,
	ClipboardListIcon,
	DollarSignIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	ArrowRightIcon,
	PlusCircleIcon,
	CreditCardIcon,
	ClockIcon,
	PackageCheckIcon,
	CheckCircle2Icon,
	AlertCircleIcon,
	TimerIcon,
} from "lucide-react";
import Link from "next/link";
import { LaundryOrderDialog } from "./laundry-order-dialog";

type DashboardStats = {
	totalActiveItems: number;
	totalOrders: number;
	pendingOrders: number;
	completedOrders: number;
	totalRevenue: number;
	outstandingAmount: number;
	ordersToday: number;
	revenueToday: number;
};

type DashboardProps = {
	stats: DashboardStats;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

export function LaundryDashboard({ stats, breadcrumbs }: DashboardProps) {
	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-4 p-4 md:p-6">
				{/* Header Section */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							Laundry Dashboard
						</h1>
						<p className="text-sm text-muted-foreground">
							Manage laundry services, orders, and payments
						</p>
					</div>
					<div className="flex gap-2">
						<Link href="/dashboard/items">
							<Button variant="outline" size="sm">
								<ShirtIcon className="w-4 h-4 mr-2" />
								Manage Items
							</Button>
						</Link>
						<LaundryOrderDialog />
					</div>
				</div>

				{/* Alert Section - Pending Orders */}
				{stats.pendingOrders > 0 && (
					<div className="flex items-center justify-between border-l-4 border-l-amber-500 bg-amber-50/50 rounded-lg px-4 py-3">
						<div className="flex items-center gap-3">
							<div className="p-1.5 bg-amber-100 rounded-md">
								<ClockIcon className="w-4 h-4 text-amber-600" />
							</div>
							<div>
								<p className="text-sm font-semibold text-amber-900">
									{stats.pendingOrders} Pending Order
									{stats.pendingOrders > 1 ? "s" : ""}
								</p>
								<p className="text-xs text-amber-700">
									Orders awaiting processing
								</p>
							</div>
						</div>
						<Link href="/dashboard/orders">
							<Button
								variant="outline"
								size="sm"
								className="border-amber-300 text-amber-700 hover:bg-amber-100"
							>
								View Orders
								<ArrowRightIcon className="w-3.5 h-3.5 ml-1.5" />
							</Button>
						</Link>
					</div>
				)}

				{/* Key Metrics Grid */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
					<MetricCard
						title="Active Services"
						value={stats.totalActiveItems}
						subtitle={`${stats.ordersToday} orders today`}
						icon={<ShirtIcon className="w-4 h-4" />}
						color="blue"
					/>

					<MetricCard
						title="Pending Orders"
						value={stats.pendingOrders}
						subtitle={`${stats.totalOrders} total orders`}
						icon={<ClipboardListIcon className="w-4 h-4" />}
						color={stats.pendingOrders > 0 ? "amber" : "green"}
						trend={{
							label: `${stats.completedOrders} completed`,
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
						title="Orders Today"
						value={stats.ordersToday}
						subtitle={`${formatCurrency(stats.revenueToday)} revenue`}
						icon={<TimerIcon className="w-4 h-4" />}
						color="green"
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
							<p className="text-[11px] text-muted-foreground">
								Pending payments
							</p>
						</div>
					</div>

					<div className="bg-white rounded-xl p-3 flex items-center gap-3 border">
						<div className="p-2 bg-green-50 rounded-lg">
							<CheckCircle2Icon className="w-4 h-4 text-green-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Completed</p>
							<p className="text-lg font-bold">
								{stats.completedOrders.toLocaleString()}
							</p>
							<p className="text-[11px] text-muted-foreground">
								Delivered orders
							</p>
						</div>
					</div>

					<div className="bg-white rounded-xl p-3 flex items-center gap-3 border">
						<div className="p-2 bg-blue-50 rounded-lg">
							<ShirtIcon className="w-4 h-4 text-blue-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Services</p>
							<p className="text-lg font-bold">{stats.totalActiveItems}</p>
							<p className="text-[11px] text-muted-foreground">
								Active laundry items
							</p>
						</div>
					</div>
				</div>

				{/* Primary Actions */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
					<LaundryOrderDialog
						trigger={
							<button className="flex items-center gap-2.5 bg-primary text-primary-foreground rounded-xl px-4 py-3 hover:bg-primary/90 transition-colors cursor-pointer text-left">
								<PlusCircleIcon className="w-5 h-5 shrink-0" />
								<div>
									<p className="text-sm font-semibold">New Order</p>
									<p className="text-[11px] opacity-80">
										Create laundry order
									</p>
								</div>
							</button>
						}
					/>
					<Link href="/dashboard/payments">
						<div className="flex items-center gap-2.5 bg-green-600 text-white rounded-xl px-4 py-3 hover:bg-green-700 transition-colors cursor-pointer">
							<CreditCardIcon className="w-5 h-5 shrink-0" />
							<div>
								<p className="text-sm font-semibold">Payments</p>
								<p className="text-[11px] opacity-80">Manage payments</p>
							</div>
						</div>
					</Link>
					<Link href="/dashboard/orders">
						<div className="flex items-center gap-2.5 bg-blue-600 text-white rounded-xl px-4 py-3 hover:bg-blue-700 transition-colors cursor-pointer">
							<PackageCheckIcon className="w-5 h-5 shrink-0" />
							<div>
								<p className="text-sm font-semibold">Track Orders</p>
								<p className="text-[11px] opacity-80">View all orders</p>
							</div>
						</div>
					</Link>
					<Link href="/dashboard/items">
						<div className="flex items-center gap-2.5 bg-purple-600 text-white rounded-xl px-4 py-3 hover:bg-purple-700 transition-colors cursor-pointer">
							<ShirtIcon className="w-5 h-5 shrink-0" />
							<div>
								<p className="text-sm font-semibold">Service Items</p>
								<p className="text-[11px] opacity-80">
									Manage pricing
								</p>
							</div>
						</div>
					</Link>
				</div>

				{/* Quick Navigation */}
				<div>
					<h3 className="text-sm font-semibold text-muted-foreground mb-2">
						Quick Navigation
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
						<Link href="/dashboard/orders">
							<QuickAction
								icon={<ClipboardListIcon className="w-4 h-4" />}
								title="All Orders"
								subtitle="Track & manage orders"
							/>
						</Link>

						<Link href="/dashboard/items">
							<QuickAction
								icon={<ShirtIcon className="w-4 h-4" />}
								title="Service Items"
								subtitle="Pricing & categories"
							/>
						</Link>

						<Link href="/dashboard/payments">
							<QuickAction
								icon={<DollarSignIcon className="w-4 h-4" />}
								title="Payments"
								subtitle="Payment history"
							/>
						</Link>

						<Link href="/dashboard/messages">
							<QuickAction
								icon={<AlertCircleIcon className="w-4 h-4" />}
								title="Messages"
								subtitle="Notifications"
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
		<div className="flex items-center gap-3 bg-white border rounded-xl px-3 py-2.5 hover:bg-muted/50 hover:shadow-sm transition-all cursor-pointer">
			<div className="text-muted-foreground">{icon}</div>
			<div>
				<p className="text-sm font-medium">{title}</p>
				<p className="text-[11px] text-muted-foreground">{subtitle}</p>
			</div>
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
	color: "blue" | "green" | "purple" | "red" | "gray" | "amber";
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
		amber: "bg-amber-50 text-amber-600",
	};

	return (
		<div className="bg-white border rounded-xl p-3">
			<div className="flex items-center justify-between mb-2">
				<p className="text-xs font-medium text-muted-foreground">{title}</p>
				<div className={cn("p-1.5 rounded-md", iconBg[color])}>{icon}</div>
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
