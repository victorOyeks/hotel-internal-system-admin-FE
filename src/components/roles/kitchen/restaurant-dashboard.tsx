"use client";

import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { APIOutput } from "@/lib/action-utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
	UtensilsIcon,
	ClipboardListIcon,
	DollarSignIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	ArrowRightIcon,
	PlusCircleIcon,
	ClockIcon,
	CheckCircle2Icon,
	XCircleIcon,
	TimerIcon,
} from "lucide-react";
import Link from "next/link";

type DashboardStats = {
	totalOrders: number;
	pendingOrders: number;
	completedOrders: number;
	inStockItems: number;
	outOfStockItems: number;
	totalRevenue: number;
	outstandingAmount: number;
	ordersToday: number;
	revenueToday: number;
};

type RecentOrder =
	APIOutput<"@get/api/restaurants/restaurant-orders">["data"]["content"][number];

type DashboardProps = {
	stats: DashboardStats;
	recentOrders: RecentOrder[];
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

export function RestaurantDashboard({
	stats,
	recentOrders,
	breadcrumbs,
}: DashboardProps) {
	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-4 p-4 md:p-6">
				{/* Header Section */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							Restaurant Dashboard
						</h1>
						<p className="text-sm text-muted-foreground">
							Manage restaurant orders, menu items, and payments
						</p>
					</div>
					<div className="flex gap-2">
						<Link href="/dashboard/item-management">
							<Button variant="outline" size="sm">
								<UtensilsIcon className="w-4 h-4 mr-2" />
								Manage Items
							</Button>
						</Link>
						<Link href="/dashboard/create-order">
							<Button size="sm">
								<PlusCircleIcon className="w-4 h-4 mr-2" />
								New Order
							</Button>
						</Link>
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
						title="Menu Items"
						value={stats.inStockItems}
						subtitle={`${stats.ordersToday} orders today`}
						icon={<UtensilsIcon className="w-4 h-4" />}
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
								Completed orders
							</p>
						</div>
					</div>

					<div className="bg-white rounded-xl p-3 flex items-center gap-3 border">
						<div className="p-2 bg-red-50 rounded-lg">
							<XCircleIcon className="w-4 h-4 text-red-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Out of Stock</p>
							<p className="text-lg font-bold">{stats.outOfStockItems}</p>
							<p className="text-[11px] text-muted-foreground">
								Unavailable items
							</p>
						</div>
					</div>
				</div>

				{/* Recent Orders */}
				<div className="bg-white border rounded-xl">
					<div className="flex items-center justify-between px-4 py-3 border-b">
						<h3 className="text-sm font-semibold">Recent Orders</h3>
						<Link href="/dashboard/orders">
							<Button variant="ghost" size="sm" className="text-xs">
								View All
								<ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
							</Button>
						</Link>
					</div>
					{recentOrders.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Order ID</TableHead>
									<TableHead>Destination</TableHead>
									<TableHead>Items</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Date</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{recentOrders.map((order) => (
									<TableRow key={order.id}>
										<TableCell className="font-medium">
											{order.customId}
										</TableCell>
										<TableCell>{order.destination}</TableCell>
										<TableCell className="text-muted-foreground">
											{order.orderItems.length} item
											{order.orderItems.length !== 1 ? "s" : ""}
										</TableCell>
										<TableCell>
											{formatCurrency(order.totalAmount)}
										</TableCell>
										<TableCell>
											<OrderStatusBadge status={order.status} />
										</TableCell>
										<TableCell className="text-muted-foreground">
											{format(new Date(order.createdAt), "MMM d, h:mm a")}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
							<ClipboardListIcon className="w-8 h-8 mb-2 opacity-40" />
							<p className="text-sm">No orders yet</p>
							<Link href="/dashboard/create-order" className="mt-2">
								<Button size="sm" variant="outline">
									<PlusCircleIcon className="w-3.5 h-3.5 mr-1.5" />
									Create First Order
								</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</BreadCrumbWrapper>
	);
}

function OrderStatusBadge({ status }: { status: string }) {
	const variant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
		PENDING: "secondary",
		COMPLETED: "default",
		CANCELLED: "destructive",
	};
	return (
		<Badge variant={variant[status] ?? "outline"} className="text-[11px]">
			{status.charAt(0) + status.slice(1).toLowerCase()}
		</Badge>
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
