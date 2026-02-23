"use client";

import { useLayoutEffect } from "react";
import { useSetAtom } from "jotai";
import {
	AlertCircleIcon,
	BedDoubleIcon,
	CheckCircleIcon,
	ClockIcon,
	DollarSignIcon,
	GlassWaterIcon,
	PackageIcon,
	ShirtIcon,
	UtensilsIcon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react";
import {
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
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import type { APIOutput } from "@/lib/action-utils";

type RestaurantData =
	APIOutput<"@get/api/managers/:hotelId/restaurant/summary">["data"];
type LaundryData =
	APIOutput<"@get/api/managers/:hotelId/laundry/summary">["data"];
type RentalsData =
	APIOutput<"@get/api/managers/:hotelId/rentals/summary">["data"];
type BarData =
	APIOutput<"@get/api/managers/:hotelId/bar/summary">["data"];
type AccommodationData =
	APIOutput<"@get/api/managers/:hotelId/accommodation/summary">["data"];
type InventoryData =
	APIOutput<"@get/api/managers/:hotelId/inventories/summary">["data"];

const statusVariants: Record<string, BadgeVariant> = {
	PENDING: "yellow",
	PICKED_UP: "blue",
	IN_PROGRESS: "blue",
	WASHING: "blue",
	DRYING: "blue",
	IRONING: "blue",
	READY: "green",
	DELIVERED: "green",
	COMPLETED: "green",
	RETURNED: "green",
	CANCELLED: "destructive",
	ACTIVE: "green",
	OVERDUE: "destructive",
	CHECKED_IN: "green",
	CHECKED_OUT: "blue",
	RESERVED: "yellow",
};

// ==================== Accommodation Tab ====================
function AccommodationTab({ data }: { data: AccommodationData }) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<StatCard
					title="Total Revenue"
					value={data.totalRevenue}
					icon={DollarSignIcon}
					isCurrency
				/>
				<StatCard
					title="Occupancy Rate"
					value={`${data.occupancyRate.toFixed(0)}%`}
					icon={BedDoubleIcon}
					subtitle={`${data.occupiedRooms} of ${data.totalRooms} occupied`}
					iconBgClass="bg-blue-50"
					iconColorClass="text-blue-600"
				/>
				<StatCard
					title="Check-ins"
					value={data.totalCheckIns}
					icon={CheckCircleIcon}
					iconBgClass="bg-green-50"
					iconColorClass="text-green-600"
				/>
				<StatCard
					title="Check-outs"
					value={data.totalCheckOuts}
					icon={XCircleIcon}
					iconBgClass="bg-amber-50"
					iconColorClass="text-amber-600"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Room Overview
					</h3>
					<div className="space-y-3">
						{[
							{ label: "Total Rooms", value: data.totalRooms, color: "#6366f1" },
							{ label: "Available", value: data.availableRooms, color: "#22c55e" },
							{ label: "Occupied", value: data.occupiedRooms, color: "#f59e0b" },
						].map((item) => (
							<div key={item.label} className="flex items-center gap-3">
								<div
									className="size-3 rounded-full flex-shrink-0"
									style={{ backgroundColor: item.color }}
								/>
								<div className="flex-1 flex items-center justify-between">
									<span className="text-sm text-gray-600">{item.label}</span>
									<span className="text-sm font-semibold text-primary">
										{item.value}
									</span>
								</div>
							</div>
						))}
					</div>
					<div className="mt-3 pt-3 border-t space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-500">Total Bookings</span>
							<span className="font-semibold text-primary">{data.totalBookings}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-500">Avg. Room Rate</span>
							<span className="font-semibold text-primary">
								{formatCurrency(data.averageRoomRate)}
							</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Recent Bookings
					</h3>
					<div className="space-y-2">
						{data.recentBookings.slice(0, 6).map((booking) => (
							<div
								key={booking.bookingId}
								className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
							>
								<div>
									<p className="font-medium text-gray-700">
										{booking.guestName || "Guest"}
									</p>
									<p className="text-xs text-gray-400">
										{booking.roomIdentifier && `Room ${booking.roomIdentifier}`}
										{booking.roomType && ` · ${booking.roomType}`}
									</p>
								</div>
								<div className="text-right">
									<p className="font-medium text-primary">
										{formatCurrency(booking.amountPaid ?? 0, "short")}
									</p>
									<Badge
										variant={statusVariants[booking.status] ?? "outline"}
										className="capitalize text-[10px]"
									>
										{booking.status.replace(/_/g, " ").toLowerCase()}
									</Badge>
								</div>
							</div>
						))}
						{data.recentBookings.length === 0 && (
							<p className="text-gray-400 text-sm text-center py-4">
								No recent bookings
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// ==================== Restaurant Tab (Food + Bar combined) ====================
function RestaurantTab({ data, barData }: { data: RestaurantData; barData: BarData }) {
	const totals = data.periodTotals;
	const dailySummaries = data.dailySummaries ?? [];

	return (
		<div className="space-y-4">
			{/* Food Sales KPIs */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<StatCard
					title="Food Revenue"
					value={totals?.totalRevenue ?? 0}
					icon={DollarSignIcon}
					isCurrency
				/>
				<StatCard
					title="Bar Revenue"
					value={barData.totalRevenue}
					icon={GlassWaterIcon}
					isCurrency
					iconBgClass="bg-purple-50"
					iconColorClass="text-purple-600"
				/>
				<StatCard
					title="Total Orders"
					value={totals?.totalOrders ?? 0}
					icon={UtensilsIcon}
					iconBgClass="bg-blue-50"
					iconColorClass="text-blue-600"
				/>
				<StatCard
					title="Items Sold"
					value={totals?.totalItemsSold ?? 0}
					icon={PackageIcon}
					iconBgClass="bg-violet-50"
					iconColorClass="text-violet-600"
				/>
			</div>

			{dailySummaries.length > 0 && (
				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-4">
						Daily Revenue
					</h3>
					<div className="h-56">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={dailySummaries}
								margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
							>
								<XAxis
									dataKey="date"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: "#9ca3af" }}
									tickFormatter={(v) => {
										const d = new Date(v);
										return `${d.getMonth() + 1}/${d.getDate()}`;
									}}
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
									formatter={(value: number) => [
										formatCurrency(value),
										"Revenue",
									]}
								/>
								<Bar
									dataKey="dayTotal"
									fill="#f59e0b"
									radius={[4, 4, 0, 0]}
									maxBarSize={24}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			)}

			{/* Bar Inventory + Statistics */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Bar Inventory
					</h3>
					<div className="space-y-3">
						{[
							{ label: "Available", value: barData.availableItems, color: "#22c55e" },
							{ label: "Low Stock", value: barData.lowStockItems, color: "#f59e0b" },
							{ label: "Out of Stock", value: barData.outOfStockItems, color: "#ef4444" },
						].map((item) => (
							<div key={item.label} className="flex items-center gap-3">
								<div
									className="size-3 rounded-full flex-shrink-0"
									style={{ backgroundColor: item.color }}
								/>
								<div className="flex-1 flex items-center justify-between">
									<span className="text-sm text-gray-600">{item.label}</span>
									<span className="text-sm font-semibold text-primary">
										{item.value}
									</span>
								</div>
							</div>
						))}
					</div>
					<div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
						<span className="text-gray-500">Total Bar Items</span>
						<span className="font-semibold text-primary">{barData.totalItems}</span>
					</div>
				</div>

				{data.statistics && (
					<div className="bg-white p-4 rounded-2xl">
						<h3 className="text-sm font-medium text-gray-600 mb-3">
							Statistics
						</h3>
						<div className="space-y-3 text-sm">
							{data.statistics.peakRevenueDate && (
								<div className="flex items-center justify-between">
									<span className="text-gray-500">Peak Revenue Date</span>
									<span className="font-medium text-primary">
										{new Date(
											data.statistics.peakRevenueDate,
										).toLocaleDateString("en-US", {
											month: "short",
											day: "2-digit",
										})}
									</span>
								</div>
							)}
							{totals?.highestDayRevenue != null && (
								<div className="flex items-center justify-between">
									<span className="text-gray-500">Highest Day Revenue</span>
									<span className="font-medium text-green-600">
										{formatCurrency(totals.highestDayRevenue, "short")}
									</span>
								</div>
							)}
							{totals?.lowestDayRevenue != null && (
								<div className="flex items-center justify-between">
									<span className="text-gray-500">Lowest Day Revenue</span>
									<span className="font-medium text-red-500">
										{formatCurrency(totals.lowestDayRevenue, "short")}
									</span>
								</div>
							)}
							<div className="flex items-center justify-between">
								<span className="text-gray-500">Avg. Daily Revenue</span>
								<span className="font-medium text-primary">
									{formatCurrency(totals?.averageDailyRevenue ?? 0, "short")}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// ==================== Laundry Tab ====================
function LaundryTab({ data }: { data: LaundryData }) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<StatCard
					title="Total Revenue"
					value={data.totalRevenue}
					icon={DollarSignIcon}
					isCurrency
				/>
				<StatCard
					title="Total Orders"
					value={data.totalOrders}
					icon={ShirtIcon}
					iconBgClass="bg-cyan-50"
					iconColorClass="text-cyan-600"
				/>
				<StatCard
					title="Pending"
					value={data.pendingOrders}
					icon={ClockIcon}
					iconBgClass="bg-amber-50"
					iconColorClass="text-amber-600"
				/>
				<StatCard
					title="Outstanding"
					value={data.outstandingAmount}
					icon={AlertCircleIcon}
					isCurrency
					iconBgClass="bg-red-50"
					iconColorClass="text-red-500"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Order Status
					</h3>
					<div className="space-y-3">
						{[
							{ label: "Pending", value: data.pendingOrders, color: "#f59e0b" },
							{ label: "In Progress", value: data.inProgressOrders, color: "#3b82f6" },
							{ label: "Completed", value: data.completedOrders, color: "#22c55e" },
							{ label: "Cancelled", value: data.cancelledOrders, color: "#ef4444" },
						].map((item) => (
							<div key={item.label} className="flex items-center gap-3">
								<div
									className="size-3 rounded-full flex-shrink-0"
									style={{ backgroundColor: item.color }}
								/>
								<div className="flex-1 flex items-center justify-between">
									<span className="text-sm text-gray-600">{item.label}</span>
									<span className="text-sm font-semibold text-primary">
										{item.value}
									</span>
								</div>
							</div>
						))}
					</div>
					<div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
						<span className="text-gray-500">Avg. Order Value</span>
						<span className="font-semibold text-primary">
							{formatCurrency(data.averageOrderValue)}
						</span>
					</div>
				</div>

				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Recent Orders
					</h3>
					<div className="space-y-2">
						{data.recentOrders.slice(0, 6).map((order) => (
							<div
								key={order.orderId}
								className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
							>
								<div>
									<p className="font-medium text-gray-700">
										{order.guestName || "Guest"}
									</p>
									<p className="text-xs text-gray-400">
										{order.customId || order.orderId.slice(0, 8)}
										{order.roomIdentifier &&
											` - Room ${order.roomIdentifier}`}
									</p>
								</div>
								<div className="text-right">
									<p className="font-medium text-primary">
										{formatCurrency(order.totalAmount, "short")}
									</p>
									<Badge
										variant={statusVariants[order.status] ?? "outline"}
										className="capitalize text-[10px]"
									>
										{order.status.replace(/_/g, " ").toLowerCase()}
									</Badge>
								</div>
							</div>
						))}
						{data.recentOrders.length === 0 && (
							<p className="text-gray-400 text-sm text-center py-4">
								No recent orders
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// ==================== Rentals Tab ====================
function RentalsTab({ data }: { data: RentalsData }) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<StatCard
					title="Total Revenue"
					value={data.totalRevenue}
					icon={DollarSignIcon}
					isCurrency
				/>
				<StatCard
					title="Active Rentals"
					value={data.activeRentals}
					icon={PackageIcon}
					iconBgClass="bg-green-50"
					iconColorClass="text-green-600"
				/>
				<StatCard
					title="Overdue"
					value={data.overdueRentals}
					icon={AlertCircleIcon}
					iconBgClass="bg-red-50"
					iconColorClass="text-red-500"
				/>
				<StatCard
					title="Outstanding"
					value={data.outstandingAmount}
					icon={DollarSignIcon}
					isCurrency
					iconBgClass="bg-amber-50"
					iconColorClass="text-amber-600"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Rental Status
					</h3>
					<div className="space-y-3">
						{[
							{ label: "Active", value: data.activeRentals, color: "#22c55e" },
							{ label: "Overdue", value: data.overdueRentals, color: "#ef4444" },
							{ label: "Completed", value: data.completedRentals, color: "#3b82f6" },
							{ label: "Cancelled", value: data.cancelledRentals, color: "#9ca3af" },
						].map((item) => (
							<div key={item.label} className="flex items-center gap-3">
								<div
									className="size-3 rounded-full flex-shrink-0"
									style={{ backgroundColor: item.color }}
								/>
								<div className="flex-1 flex items-center justify-between">
									<span className="text-sm text-gray-600">{item.label}</span>
									<span className="text-sm font-semibold text-primary">
										{item.value}
									</span>
								</div>
							</div>
						))}
					</div>
					<div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
						<span className="text-gray-500">Avg. Order Value</span>
						<span className="font-semibold text-primary">
							{formatCurrency(data.averageOrderValue)}
						</span>
					</div>
				</div>

				<div className="bg-white p-4 rounded-2xl">
					<h3 className="text-sm font-medium text-gray-600 mb-3">
						Recent Orders
					</h3>
					<div className="space-y-2">
						{data.recentOrders.slice(0, 6).map((order) => (
							<div
								key={order.orderId}
								className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
							>
								<div>
									<p className="font-medium text-gray-700">
										{order.customerName || "Customer"}
									</p>
									<p className="text-xs text-gray-400">
										{order.itemName || order.customId || order.orderId.slice(0, 8)}
									</p>
								</div>
								<div className="text-right">
									<p className="font-medium text-primary">
										{formatCurrency(order.totalAmount, "short")}
									</p>
									<Badge
										variant={statusVariants[order.status] ?? "outline"}
										className="capitalize text-[10px]"
									>
										{order.status.replace(/_/g, " ").toLowerCase()}
									</Badge>
								</div>
							</div>
						))}
						{data.recentOrders.length === 0 && (
							<p className="text-gray-400 text-sm text-center py-4">
								No recent orders
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// ==================== Inventory Tab ====================
function InventoryTab({ data }: { data: InventoryData }) {
	const total = data.totalItems || 1;
	const items = [
		{ label: "Available", value: data.available, color: "#22c55e" },
		{ label: "Low in Stock", value: data.lowInStock, color: "#f59e0b" },
		{ label: "Out of Stock", value: data.outOfStock, color: "#ef4444" },
	];

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				<StatCard
					title="Total Items"
					value={data.totalItems}
					icon={PackageIcon}
				/>
				<StatCard
					title="Available"
					value={data.available}
					icon={CheckCircleIcon}
					iconBgClass="bg-green-50"
					iconColorClass="text-green-600"
				/>
				<StatCard
					title="Low in Stock"
					value={data.lowInStock}
					icon={AlertCircleIcon}
					iconBgClass="bg-amber-50"
					iconColorClass="text-amber-600"
				/>
				<StatCard
					title="Out of Stock"
					value={data.outOfStock}
					icon={XCircleIcon}
					iconBgClass="bg-red-50"
					iconColorClass="text-red-500"
				/>
			</div>

			<div className="bg-white p-4 rounded-2xl">
				<h3 className="text-sm font-medium text-gray-600 mb-4">
					Stock Distribution
				</h3>
				<div className="space-y-4">
					{items.map((item) => (
						<div key={item.label}>
							<div className="flex items-center justify-between text-sm mb-1">
								<span className="text-gray-600">{item.label}</span>
								<span className="font-semibold text-primary">
									{item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
								</span>
							</div>
							<div className="h-2 bg-gray-100 rounded-full overflow-hidden">
								<div
									className="h-full rounded-full transition-all"
									style={{
										width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
										backgroundColor: item.color,
									}}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ==================== Main Operations ====================
export function Operations({
	breadcrumbs,
	restaurantData,
	barData,
	laundryData,
	rentalsData,
	accommodationData,
	inventoryData,
}: {
	breadcrumbs: Breadcrumb[];
	restaurantData: RestaurantData;
	barData: BarData;
	laundryData: LaundryData;
	rentalsData: RentalsData;
	accommodationData: AccommodationData;
	inventoryData: InventoryData;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Operations",
			breadcrumbs,
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	return (
		<div className="p-4 md:p-6 space-y-4">
			<Tabs defaultValue="accommodation" className="space-y-4">
				<TabsList className="bg-white border p-1 rounded-xl">
					<TabsTrigger value="accommodation" className="rounded-lg">
						<BedDoubleIcon className="size-4 mr-1.5" />
						Accommodation
					</TabsTrigger>
					<TabsTrigger value="restaurant" className="rounded-lg">
						<UtensilsIcon className="size-4 mr-1.5" />
						Restaurant
					</TabsTrigger>
					<TabsTrigger value="laundry" className="rounded-lg">
						<ShirtIcon className="size-4 mr-1.5" />
						Laundry
					</TabsTrigger>
					<TabsTrigger value="rentals" className="rounded-lg">
						<PackageIcon className="size-4 mr-1.5" />
						Rentals
					</TabsTrigger>
					<TabsTrigger value="inventory" className="rounded-lg">
						<WrenchIcon className="size-4 mr-1.5" />
						Inventory
					</TabsTrigger>
				</TabsList>

				<TabsContent value="accommodation">
					<AccommodationTab data={accommodationData} />
				</TabsContent>

				<TabsContent value="restaurant">
					<RestaurantTab data={restaurantData} barData={barData} />
				</TabsContent>

				<TabsContent value="laundry">
					<LaundryTab data={laundryData} />
				</TabsContent>

				<TabsContent value="rentals">
					<RentalsTab data={rentalsData} />
				</TabsContent>

				<TabsContent value="inventory">
					<InventoryTab data={inventoryData} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
