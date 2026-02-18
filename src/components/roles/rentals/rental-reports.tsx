"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	getOrderDetails,
	getRentalOrders,
	getRentalReports,
} from "@/lib/rental-actions";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
	BarChart3Icon,
	DollarSignIcon,
	PackageIcon,
	TrendingUpIcon,
	ClipboardListIcon,
	AlertCircleIcon,
	Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

type RentalReportsPageProps = {
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const categoryLabels: Record<string, string> = {
	BICYCLES: "Bicycles",
	BEACH_EQUIPMENT: "Beach Equipment",
	SPORTS_EQUIPMENT: "Sports Equipment",
	BABY_EQUIPMENT: "Baby Equipment",
	CONFERENCE_EQUIPMENT: "Conference Equipment",
	ENTERTAINMENT: "Entertainment",
	MOBILITY_AIDS: "Mobility Aids",
	WATER_SPORTS: "Water Sports",
	WINTER_SPORTS: "Winter Sports",
	ELECTRONICS: "Electronics",
	VEHICLES: "Vehicles",
	PARTY_SUPPLIES: "Party Supplies",
	CAMPING_GEAR: "Camping Gear",
	KITCHEN_APPLIANCES: "Kitchen Appliances",
	OTHERS: "Others",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

function getDefaultDates() {
	const now = new Date();
	const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
	const endDate = now;
	return {
		startDate: startDate.toISOString().split("T")[0],
		endDate: endDate.toISOString().split("T")[0],
	};
}

function normalizeDateKey(value: unknown): string {
	if (!value) return "";
	const raw = String(value);
	const isoLike = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
	if (isoLike) return isoLike;
	const parsed = new Date(raw);
	if (!Number.isNaN(parsed.getTime())) {
		return parsed.toISOString().split("T")[0];
	}
	return "";
}

const completedStatuses = new Set(["COMPLETED", "RETURNED"]);
const activeStatuses = new Set(["PENDING", "CONFIRMED", "PICKED_UP", "ACTIVE"]);

const toNumber = (value: unknown) => {
	const num = Number(value);
	return Number.isFinite(num) ? num : 0;
};

function createEmptyReport() {
	return {
		totalOrders: 0,
		completedOrders: 0,
		activeOrders: 0,
		overdueOrders: 0,
		cancelledOrders: 0,
		totalRevenue: 0,
		totalCollected: 0,
		totalOutstanding: 0,
		totalDepositsCollected: 0,
		totalDepositsRefunded: 0,
		totalDamageFees: 0,
		totalLatePenalties: 0,
		totalItemsRented: 0,
		totalQuantityRented: 0,
		damagedItemsCount: 0,
		lostItemsCount: 0,
		topItemsByRevenue: [] as any[],
		topItemsByQuantity: [] as any[],
		categoryBreakdown: [] as any[],
		dailyStats: [] as any[],
		orders: [] as any[],
	};
}

function buildReportFromOrders(orderSummaries: any[], orderDetails: any[]) {
	const report = createEmptyReport();
	const itemAggregate = new Map<string, any>();
	const categoryAggregate = new Map<string, any>();
	const dailyAggregate = new Map<string, any>();
	const detailsByOrderId = new Map<string, any>();

	for (const detail of orderDetails) {
		if (!detail?.id) continue;
		detailsByOrderId.set(String(detail.id), detail);
	}

	for (const order of orderSummaries) {
		const status = String(order?.status || "");
		const startKey = normalizeDateKey(order?.rentalStartTime || order?.createdAt);
		const createdKey = normalizeDateKey(order?.createdAt || order?.rentalStartTime);
		const completedKey = normalizeDateKey(order?.rentalEndTime);
		const orderRevenue = toNumber(order?.totalAmount);
		const orderCollected = toNumber(order?.amountPaid);
		const orderOutstanding = toNumber(order?.balanceDue);

		report.totalOrders += 1;
		report.totalRevenue += orderRevenue;
		report.totalCollected += orderCollected;
		report.totalOutstanding += orderOutstanding;
		report.totalDepositsCollected += toNumber(order?.depositPaid);

		if (completedStatuses.has(status)) report.completedOrders += 1;
		if (activeStatuses.has(status)) report.activeOrders += 1;
		if (status === "CANCELLED") report.cancelledOrders += 1;
		if (status === "OVERDUE" || order?.isOverdue) report.overdueOrders += 1;

		if (createdKey) {
			const day = dailyAggregate.get(createdKey) || {
				date: createdKey,
				ordersCreated: 0,
				ordersCompleted: 0,
				revenue: 0,
				itemNames: new Set<string>(),
			};
			day.ordersCreated += 1;
			dailyAggregate.set(createdKey, day);
		}

		if (completedKey && completedStatuses.has(status)) {
			const day = dailyAggregate.get(completedKey) || {
				date: completedKey,
				ordersCreated: 0,
				ordersCompleted: 0,
				revenue: 0,
				itemNames: new Set<string>(),
			};
			day.ordersCompleted += 1;
			dailyAggregate.set(completedKey, day);
		}

		if (startKey) {
			const day = dailyAggregate.get(startKey) || {
				date: startKey,
				ordersCreated: 0,
				ordersCompleted: 0,
				revenue: 0,
				itemNames: new Set<string>(),
			};
			day.revenue += orderRevenue;
			dailyAggregate.set(startKey, day);
		}
	}

	for (const detail of orderDetails) {
		if (!detail) continue;
		const startKey = normalizeDateKey(detail?.rentalStartTime || detail?.createdAt);
		const items = Array.isArray(detail?.items) ? detail.items : [];
		report.totalItemsRented += items.length;

		for (const item of items) {
			const name = String(item?.rentalItemName || item?.itemName || "Unknown item");
			const category = String(item?.category || "OTHERS");
			const quantity = toNumber(item?.quantity);
			const itemRevenue = toNumber(item?.totalRentalPrice);

			report.totalQuantityRented += quantity;
			if (item?.damaged) report.damagedItemsCount += quantity || 1;
			if (item?.lost) report.lostItemsCount += quantity || 1;

			const itemKey = `${name}::${category}`;
			const itemRow = itemAggregate.get(itemKey) || {
				itemId: item?.rentalItemId || item?.itemId || itemKey,
				itemName: name,
				category,
				totalRevenue: 0,
				totalQuantityRented: 0,
				timesRented: 0,
			};
			itemRow.totalRevenue += itemRevenue;
			itemRow.totalQuantityRented += quantity;
			itemRow.timesRented += 1;
			itemAggregate.set(itemKey, itemRow);

			const catRow = categoryAggregate.get(category) || {
				category,
				orderIds: new Set<string>(),
				itemCount: 0,
				revenue: 0,
			};
			catRow.orderIds.add(String(detail?.id || ""));
			catRow.itemCount += quantity;
			catRow.revenue += itemRevenue;
			categoryAggregate.set(category, catRow);

			if (startKey) {
				const day = dailyAggregate.get(startKey) || {
					date: startKey,
					ordersCreated: 0,
					ordersCompleted: 0,
					revenue: 0,
					itemNames: new Set<string>(),
				};
				day.itemNames.add(name);
				dailyAggregate.set(startKey, day);
			}
		}

		const payments = Array.isArray(detail?.payments) ? detail.payments : [];
		for (const payment of payments) {
			const paymentType = String(payment?.type || "");
			const paymentAmount = toNumber(payment?.amount);
			if (paymentType.includes("REFUND")) report.totalDepositsRefunded += paymentAmount;
			if (paymentType.includes("DAMAGE")) report.totalDamageFees += paymentAmount;
			if (paymentType.includes("LATE")) report.totalLatePenalties += paymentAmount;
		}
	}

	const allItems = Array.from(itemAggregate.values());
	report.topItemsByRevenue = allItems
		.slice()
		.sort((a, b) => b.totalRevenue - a.totalRevenue)
		.slice(0, 10);
	report.topItemsByQuantity = allItems
		.slice()
		.sort((a, b) => b.totalQuantityRented - a.totalQuantityRented)
		.slice(0, 10)
		.map((item) => ({
			...item,
			utilizationRate: report.totalQuantityRented
				? (item.totalQuantityRented / report.totalQuantityRented) * 100
				: 0,
		}));

	const totalCategoryRevenue = Array.from(categoryAggregate.values()).reduce(
		(sum, cat) => sum + toNumber(cat.revenue),
		0,
	);
	report.categoryBreakdown = Array.from(categoryAggregate.values())
		.map((cat) => ({
			category: cat.category,
			orderCount: cat.orderIds.size,
			itemCount: cat.itemCount,
			revenue: cat.revenue,
			percentageOfTotal: totalCategoryRevenue
				? (cat.revenue / totalCategoryRevenue) * 100
				: 0,
		}))
		.sort((a, b) => b.revenue - a.revenue);

	report.dailyStats = Array.from(dailyAggregate.values())
		.map((day) => ({
			date: day.date,
			ordersCreated: day.ordersCreated,
			ordersCompleted: day.ordersCompleted,
			revenue: day.revenue,
			itemNames: Array.from(day.itemNames),
		}))
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	report.orders = orderSummaries
		.map((order) => {
			const detail = detailsByOrderId.get(String(order?.id || ""));
			const detailItems = Array.isArray(detail?.items) ? detail.items : [];
			const detailNames = detailItems
				.map((item: any) => String(item?.rentalItemName || item?.itemName || "").trim())
				.filter(Boolean);
			const summaryNames = Array.isArray(order?.items)
				? order.items
						.map((item: any) => String(item?.rentalItemName || item?.itemName || item?.name || "").trim())
						.filter(Boolean)
				: String(order?.itemNames || order?.itemsText || "")
						.split(",")
						.map((name: string) => name.trim())
						.filter(Boolean);
			const uniqueNames = Array.from(new Set([...detailNames, ...summaryNames]));
			return {
				id: String(order?.id || ""),
				orderNumber: String(order?.orderNumber || "-"),
				customerName: String(order?.customerName || "-"),
				status: String(order?.status || "-"),
				totalAmount: toNumber(order?.totalAmount),
				amountPaid: toNumber(order?.amountPaid),
				balanceDue: toNumber(order?.balanceDue),
				isOverdue: Boolean(order?.isOverdue) || String(order?.status || "") === "OVERDUE",
				createdAt: String(order?.createdAt || ""),
				rentalStartTime: String(order?.rentalStartTime || ""),
				rentalEndTime: String(order?.rentalEndTime || ""),
				itemsText: uniqueNames.join(", "),
				itemCount: Math.max(detailItems.length, uniqueNames.length),
			};
		})
		.sort(
			(a, b) =>
				new Date(b.rentalStartTime || 0).getTime() -
				new Date(a.rentalStartTime || 0).getTime(),
		);

	return report;
}

function normalizeOrderRow(order: any) {
	return {
		id: String(order?.id || ""),
		orderNumber: String(order?.orderNumber || order?.customId || "-"),
		customerName: String(order?.customerName || order?.customer || "-"),
		status: String(order?.status || "-"),
		totalAmount: toNumber(order?.totalAmount ?? order?.total),
		amountPaid: toNumber(order?.amountPaid ?? order?.paidAmount),
		balanceDue: toNumber(order?.balanceDue ?? order?.outstandingAmount),
		isOverdue: Boolean(order?.isOverdue) || String(order?.status || "") === "OVERDUE",
		createdAt: String(order?.createdAt || ""),
		rentalStartTime: String(order?.rentalStartTime || order?.startDate || ""),
		rentalEndTime: String(order?.rentalEndTime || order?.endDate || ""),
		itemsText: String(order?.itemsText || order?.itemNames || "").trim(),
		itemCount: toNumber(order?.itemCount ?? order?.itemsCount),
	};
}

function normalizeDailyRow(day: any) {
	const itemNamesSource =
		day?.itemNames ??
		day?.itemsRentedNames ??
		day?.rentedItemNames ??
		day?.rentedItems ??
		day?.items;
	const itemNames = Array.isArray(itemNamesSource)
		? itemNamesSource
				.map((item: any) =>
					typeof item === "string" ? item : item?.itemName || item?.name || "",
				)
				.filter(Boolean)
		: typeof itemNamesSource === "string"
			? itemNamesSource
					.split(",")
					.map((name: string) => name.trim())
					.filter(Boolean)
			: [];
	return {
		date: String(day?.date || ""),
		ordersCreated: toNumber(day?.ordersCreated ?? day?.createdOrders ?? day?.totalCreated),
		ordersCompleted: toNumber(
			day?.ordersCompleted ?? day?.completedOrders ?? day?.totalCompleted,
		),
		revenue: toNumber(day?.revenue ?? day?.totalRevenue),
		itemNames,
	};
}

function mergeWithApiReport(localReport: any, apiReport: any) {
	if (!apiReport || typeof apiReport !== "object") return localReport;
	const pickNum = (...values: unknown[]) => {
		for (const value of values) {
			const num = Number(value);
			if (Number.isFinite(num)) return num;
		}
		return 0;
	};
	const pickArr = (...values: unknown[]) => {
		for (const value of values) {
			if (Array.isArray(value)) return value;
		}
		return [];
	};

	const merged = {
		...localReport,
		totalOrders: pickNum(apiReport.totalOrders, localReport.totalOrders),
		completedOrders: pickNum(apiReport.completedOrders, localReport.completedOrders),
		activeOrders: pickNum(apiReport.activeOrders, localReport.activeOrders),
		overdueOrders: pickNum(apiReport.overdueOrders, localReport.overdueOrders),
		cancelledOrders: pickNum(apiReport.cancelledOrders, localReport.cancelledOrders),
		totalRevenue: pickNum(apiReport.totalRevenue, localReport.totalRevenue),
		totalCollected: pickNum(apiReport.totalCollected, localReport.totalCollected),
		totalOutstanding: pickNum(apiReport.totalOutstanding, localReport.totalOutstanding),
		totalDepositsCollected: pickNum(
			apiReport.totalDepositsCollected,
			localReport.totalDepositsCollected,
		),
		totalDepositsRefunded: pickNum(
			apiReport.totalDepositsRefunded,
			localReport.totalDepositsRefunded,
		),
		totalDamageFees: pickNum(apiReport.totalDamageFees, localReport.totalDamageFees),
		totalLatePenalties: pickNum(apiReport.totalLatePenalties, localReport.totalLatePenalties),
		totalItemsRented: pickNum(apiReport.totalItemsRented, localReport.totalItemsRented),
		totalQuantityRented: pickNum(
			apiReport.totalQuantityRented,
			localReport.totalQuantityRented,
		),
		damagedItemsCount: pickNum(apiReport.damagedItemsCount, localReport.damagedItemsCount),
		lostItemsCount: pickNum(apiReport.lostItemsCount, localReport.lostItemsCount),
	};

	const apiOrdersRaw = pickArr(apiReport.orders, apiReport.orderDetails, apiReport.orderRows);
	const apiOrders = apiOrdersRaw.map(normalizeOrderRow).filter((row: any) => row.orderNumber);
	if (apiOrders.length > 0) {
		merged.orders = apiOrders.sort(
			(a: any, b: any) =>
				new Date(b.rentalStartTime || 0).getTime() -
				new Date(a.rentalStartTime || 0).getTime(),
		);
	}

	const apiTopRevenue = pickArr(
		apiReport.topItemsByRevenue,
		apiReport.topRevenueItems,
	);
	if (apiTopRevenue.length > 0) merged.topItemsByRevenue = apiTopRevenue;

	const apiTopQty = pickArr(
		apiReport.topItemsByQuantity,
		apiReport.topQuantityItems,
	);
	if (apiTopQty.length > 0) merged.topItemsByQuantity = apiTopQty;

	const apiCategory = pickArr(apiReport.categoryBreakdown, apiReport.categories);
	if (apiCategory.length > 0) merged.categoryBreakdown = apiCategory;

	const apiDaily = pickArr(apiReport.dailyStats, apiReport.dailyActivity).map(
		normalizeDailyRow,
	);
	if (apiDaily.length > 0) {
		const localDailyByDate = new Map<string, any>(
			(localReport.dailyStats || []).map((row: any) => [String(row.date || ""), row]),
		);
		merged.dailyStats = apiDaily.map((row: any) => {
			const key = String(row?.date || "");
			const localRow = localDailyByDate.get(key);
			const mergedItemNames =
				Array.isArray(row?.itemNames) && row.itemNames.length > 0
					? row.itemNames
					: Array.isArray(localRow?.itemNames)
						? localRow.itemNames
						: [];
			return {
				...row,
				itemNames: mergedItemNames,
			};
		});
	}

	return merged;
}

export function RentalReportsPage({ breadcrumbs }: RentalReportsPageProps) {
	const defaults = getDefaultDates();
	const [startDate, setStartDate] = useState(defaults.startDate);
	const [endDate, setEndDate] = useState(defaults.endDate);
	const [queryDates, setQueryDates] = useState({
		startDate: defaults.startDate,
		endDate: defaults.endDate,
	});
	const [generateCount, setGenerateCount] = useState(0);
	const [ordersPage, setOrdersPage] = useState(1);

	const {
		data: report,
		isLoading,
		isFetching,
		isError,
		error,
	} = useQuery({
		queryKey: ["rentals", "reports", queryDates, generateCount],
		queryFn: async () => {
			const orderSummaries: any[] = [];
			let page = 0;
			let totalPages = 1;

			while (page < totalPages) {
				const ordersResult = await getRentalOrders(
					queryDates.startDate,
					queryDates.endDate,
					page,
					200,
				);
				if (!ordersResult.success) throw new Error(ordersResult.error);
				const responseData = ordersResult.data;
				const pageItems = Array.isArray(responseData?.content)
					? responseData.content
					: [];
				orderSummaries.push(...pageItems);
				const nextTotalPages = Number(responseData?.totalPages);
				totalPages =
					Number.isFinite(nextTotalPages) && nextTotalPages > 0
						? nextTotalPages
						: page + 1;
				page += 1;
			}

			const detailsList = await Promise.all(
				orderSummaries.map(async (order: any) => {
					const detailResult = await getOrderDetails(order.id);
					return detailResult.success ? detailResult.data : null;
				}),
			);

			const localReport = buildReportFromOrders(orderSummaries, detailsList);
			const reportsResult = await getRentalReports(
				queryDates.startDate,
				queryDates.endDate,
			);
			const apiReport = reportsResult.success ? reportsResult.data : null;
			return mergeWithApiReport(localReport, apiReport);
		},
	});

	const handleGenerate = () => {
		if (!startDate || !endDate) {
			toast.error("Please select both start and end dates");
			return;
		}
		if (new Date(startDate) > new Date(endDate)) {
			toast.error("Start date cannot be after end date");
			return;
		}
		setQueryDates({ startDate, endDate });
		setGenerateCount((prev) => prev + 1);
		setOrdersPage(1);
	};

	const ordersPageSize = 20;
	const totalOrderPages = Math.max(
		1,
		Math.ceil((report?.orders?.length || 0) / ordersPageSize),
	);
	const safeOrdersPage = Math.min(ordersPage, totalOrderPages);
	const pagedOrders = (report?.orders || []).slice(
		(safeOrdersPage - 1) * ordersPageSize,
		safeOrdersPage * ordersPageSize,
	);
	const orderInsights = useMemo(() => {
		const orders = report?.orders || [];
		const statusMap = new Map<
			string,
			{ status: string; count: number; total: number; paid: number; balance: number }
		>();
		let fullyPaid = 0;
		let partiallyPaid = 0;
		let unpaid = 0;
		const outstanding: any[] = [];
		const overdue: any[] = [];
		const cancelled: any[] = [];

		for (const order of orders) {
			const status = String(order?.status || "UNKNOWN");
			const total = toNumber(order?.totalAmount);
			const paid = toNumber(order?.amountPaid);
			const balance = toNumber(order?.balanceDue);
			const existing = statusMap.get(status) || {
				status,
				count: 0,
				total: 0,
				paid: 0,
				balance: 0,
			};
			existing.count += 1;
			existing.total += total;
			existing.paid += paid;
			existing.balance += balance;
			statusMap.set(status, existing);

			if (balance <= 0) fullyPaid += 1;
			else if (paid > 0) partiallyPaid += 1;
			else unpaid += 1;

			if (balance > 0) outstanding.push(order);
			if (order?.isOverdue || status === "OVERDUE") overdue.push(order);
			if (status === "CANCELLED") cancelled.push(order);
		}

		return {
			statusRows: Array.from(statusMap.values()).sort((a, b) => b.count - a.count),
			paymentSummary: { fullyPaid, partiallyPaid, unpaid },
			outstandingRows: outstanding.slice(0, 20),
			overdueRows: overdue.slice(0, 20),
			cancelledRows: cancelled.slice(0, 20),
		};
	}, [report?.orders]);
	const dailyItemsByDate = useMemo(() => {
		const byDate = new Map<string, Set<string>>();
		for (const order of report?.orders || []) {
			const dateKey = normalizeDateKey(
				order?.rentalStartTime || order?.createdAt || order?.rentalEndTime,
			);
			if (!dateKey) continue;
			const names = String(order?.itemsText || "")
				.split(",")
				.map((name) => name.trim())
				.filter(Boolean);
			if (names.length === 0) continue;
			const existing = byDate.get(dateKey) || new Set<string>();
			for (const name of names) existing.add(name);
			byDate.set(dateKey, existing);
		}
		return byDate;
	}, [report?.orders]);

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Reports
					</h1>
					<p className="text-muted-foreground mt-1">
						Rental performance analytics and insights
					</p>
				</div>

				{/* Date Range Selector */}
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-end gap-4">
							<div className="space-y-2">
								<Label>Start Date</Label>
								<Input
									type="date"
									value={startDate}
									onChange={(e) =>
										setStartDate(e.target.value)
									}
									className="w-44"
								/>
							</div>
							<div className="space-y-2">
								<Label>End Date</Label>
								<Input
									type="date"
									value={endDate}
									onChange={(e) =>
										setEndDate(e.target.value)
									}
									className="w-44"
								/>
							</div>
							<Button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									handleGenerate();
								}}
								disabled={isFetching}
							>
								{isFetching ? (
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<BarChart3Icon className="w-4 h-4 mr-2" />
								)}
								Generate Report
							</Button>
						</div>
					</CardContent>
				</Card>

				{isLoading && (
					<div className="flex justify-center py-16">
						<Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
					</div>
				)}

				{isError && (
					<Card>
						<CardContent className="pt-6 text-center text-muted-foreground py-12">
							{(error as Error)?.message ||
								"Failed to load report. Please try again."}
						</CardContent>
					</Card>
				)}

				{report && (
					<>
						{/* Order Stats */}
						<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
							<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
								<div className="p-2 bg-blue-50 rounded-lg">
									<ClipboardListIcon className="w-4 h-4 text-blue-600" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Total Orders</p>
									<p className="text-lg font-bold">{report.totalOrders}</p>
								</div>
							</div>
							<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
								<div className="p-2 bg-green-50 rounded-lg">
									<TrendingUpIcon className="w-4 h-4 text-green-600" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Completed</p>
									<p className="text-lg font-bold text-green-600">
										{report.completedOrders}
									</p>
								</div>
							</div>
							<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
								<div className="p-2 bg-cyan-50 rounded-lg">
									<PackageIcon className="w-4 h-4 text-cyan-600" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Active</p>
									<p className="text-lg font-bold text-blue-600">
										{report.activeOrders}
									</p>
								</div>
							</div>
							<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
								<div className="p-2 bg-red-50 rounded-lg">
									<AlertCircleIcon className="w-4 h-4 text-red-600" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Overdue</p>
									<p className="text-lg font-bold text-red-600">
										{report.overdueOrders}
									</p>
								</div>
							</div>
							<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
								<div className="p-2 bg-gray-100 rounded-lg">
									<ClipboardListIcon className="w-4 h-4 text-gray-500" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Cancelled</p>
									<p className="text-lg font-bold text-gray-500">
										{report.cancelledOrders}
									</p>
								</div>
							</div>
						</div>

						{/* Revenue Section */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card className="border-l-4 border-l-green-500">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm text-muted-foreground">
										Total Revenue
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-3xl font-bold text-green-600">
										{formatCurrency(
											report.totalRevenue || 0,
										)}
									</p>
								</CardContent>
							</Card>
							<Card className="border-l-4 border-l-blue-500">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm text-muted-foreground">
										Collected
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-3xl font-bold text-blue-600">
										{formatCurrency(
											report.totalCollected || 0,
										)}
									</p>
								</CardContent>
							</Card>
							<Card className="border-l-4 border-l-orange-500">
								<CardHeader className="pb-2">
									<CardTitle className="text-sm text-muted-foreground">
										Outstanding
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-3xl font-bold text-orange-600">
										{formatCurrency(
											report.totalOutstanding || 0,
										)}
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Financial Breakdown */}
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<DollarSignIcon className="w-5 h-5 text-green-600" />
									<CardTitle className="text-lg">
										Financial Breakdown
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
									<div>
										<p className="text-sm text-muted-foreground">
											Deposits Collected
										</p>
										<p className="text-lg font-semibold">
											{formatCurrency(
												report.totalDepositsCollected ||
													0,
											)}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Deposits Refunded
										</p>
										<p className="text-lg font-semibold">
											{formatCurrency(
												report.totalDepositsRefunded ||
													0,
											)}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Damage Fees
										</p>
										<p className="text-lg font-semibold text-red-600">
											{formatCurrency(
												report.totalDamageFees || 0,
											)}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Late Penalties
										</p>
										<p className="text-lg font-semibold text-orange-600">
											{formatCurrency(
												report.totalLatePenalties || 0,
											)}
										</p>
									</div>
								</div>

								<Separator className="my-4" />

								<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
									<div>
										<p className="text-sm text-muted-foreground">
											Items Rented
										</p>
										<p className="text-lg font-semibold">
											{report.totalItemsRented}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Total Qty Rented
										</p>
										<p className="text-lg font-semibold">
											{report.totalQuantityRented}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Damaged Items
										</p>
										<p className="text-lg font-semibold text-red-600">
											{report.damagedItemsCount}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Lost Items
										</p>
										<p className="text-lg font-semibold text-red-600">
											{report.lostItemsCount}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Top Items */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Top Items by Revenue */}
							{report.topItemsByRevenue &&
								report.topItemsByRevenue.length > 0 && (
									<Card>
										<CardHeader>
											<CardTitle className="text-base">
												Top Items by Revenue
											</CardTitle>
										</CardHeader>
										<CardContent>
											<Table>
										<TableHeader>
											<TableRow>
														<TableHead>
															Item
														</TableHead>
														<TableHead className="text-right">
															Revenue
														</TableHead>
														<TableHead className="text-center">
															Rented
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{report.topItemsByRevenue.map(
														(item: any) => (
															<TableRow
																key={
																	item.itemId
																}
															>
																<TableCell className="font-medium">
																	<div>
																		{
																			item.itemName
																		}
																		<p className="text-xs text-muted-foreground">
																			{categoryLabels[
																				item
																					.category
																			] ||
																				item.category}
																		</p>
																	</div>
																</TableCell>
																<TableCell className="text-right font-semibold text-green-600">
																	{formatCurrency(
																		item.totalRevenue ||
																			0,
																	)}
																</TableCell>
																<TableCell className="text-center">
																	{
																		item.timesRented
																	}
																	x
																</TableCell>
															</TableRow>
														),
													)}
												</TableBody>
											</Table>
										</CardContent>
									</Card>
								)}

							{/* Top Items by Quantity */}
							{report.topItemsByQuantity &&
								report.topItemsByQuantity.length > 0 && (
									<Card>
										<CardHeader>
											<CardTitle className="text-base">
												Top Items by Quantity
											</CardTitle>
										</CardHeader>
										<CardContent>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>
															Item
														</TableHead>
														<TableHead className="text-center">
															Qty Rented
														</TableHead>
														<TableHead className="text-right">
															Utilization
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{report.topItemsByQuantity.map(
														(item: any) => (
															<TableRow
																key={
																	item.itemId
																}
															>
																<TableCell className="font-medium">
																	<div>
																		{
																			item.itemName
																		}
																		<p className="text-xs text-muted-foreground">
																			{categoryLabels[
																				item
																					.category
																			] ||
																				item.category}
																		</p>
																	</div>
																</TableCell>
																<TableCell className="text-center font-semibold">
																	{
																		item.totalQuantityRented
																	}
																</TableCell>
																<TableCell className="text-right">
																	{(
																		item.utilizationRate ||
																		0
																	).toFixed(
																		1,
																	)}
																	%
																</TableCell>
															</TableRow>
														),
													)}
												</TableBody>
											</Table>
										</CardContent>
									</Card>
								)}
						</div>

						{/* Category Breakdown */}
						{report.categoryBreakdown &&
							report.categoryBreakdown.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base">
											Category Breakdown
										</CardTitle>
									</CardHeader>
									<CardContent>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>
														Category
													</TableHead>
													<TableHead className="text-center">
														Orders
													</TableHead>
													<TableHead className="text-center">
														Items
													</TableHead>
													<TableHead className="text-right">
														Revenue
													</TableHead>
													<TableHead className="text-right">
														% of Total
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{report.categoryBreakdown.map(
													(cat: any) => (
														<TableRow
															key={cat.category}
														>
															<TableCell className="font-medium">
																{categoryLabels[
																	cat.category
																] ||
																	cat.category}
															</TableCell>
															<TableCell className="text-center">
																{
																	cat.orderCount
																}
															</TableCell>
															<TableCell className="text-center">
																{
																	cat.itemCount
																}
															</TableCell>
															<TableCell className="text-right font-medium">
																{formatCurrency(
																	cat.revenue ||
																		0,
																)}
															</TableCell>
															<TableCell className="text-right">
																<Badge
																	variant="outline"
																	className="text-xs"
																>
																	{(
																		cat.percentageOfTotal ||
																		0
																	).toFixed(
																		1,
																	)}
																	%
																</Badge>
															</TableCell>
														</TableRow>
													),
												)}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							)}

						{/* All Orders */}
						{report.orders && report.orders.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">All Orders</CardTitle>
									<CardDescription>
										Complete order list for the selected period
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Order #</TableHead>
													<TableHead>Customer</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Items</TableHead>
													<TableHead className="text-right">Total</TableHead>
													<TableHead className="text-right">Paid</TableHead>
													<TableHead className="text-right">Balance</TableHead>
													<TableHead>Period</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{pagedOrders.map((order: any) => (
													<TableRow key={order.id || order.orderNumber}>
														<TableCell className="font-medium">
															{order.orderNumber}
														</TableCell>
														<TableCell>{order.customerName}</TableCell>
														<TableCell>
															<Badge variant="outline" className="text-xs">
																{order.status}
															</Badge>
														</TableCell>
														<TableCell className="max-w-[280px] truncate text-sm">
															{order.itemsText || `${order.itemCount || 0} item(s)`}
														</TableCell>
														<TableCell className="text-right font-medium">
															{formatCurrency(order.totalAmount || 0)}
														</TableCell>
														<TableCell className="text-right">
															{formatCurrency(order.amountPaid || 0)}
														</TableCell>
														<TableCell className="text-right text-orange-600">
															{formatCurrency(order.balanceDue || 0)}
														</TableCell>
														<TableCell className="text-sm whitespace-nowrap">
															{order.rentalStartTime
																? new Date(order.rentalStartTime).toLocaleDateString("en-NG")
																: "-"}
															{" - "}
															{order.rentalEndTime
																? new Date(order.rentalEndTime).toLocaleDateString("en-NG")
																: "-"}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
									{report.orders.length > ordersPageSize && (
										<div className="flex items-center justify-between border-t pt-4 mt-4">
											<p className="text-xs text-muted-foreground">
												Page {safeOrdersPage} of {totalOrderPages}
											</p>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setOrdersPage((prev) => Math.max(1, prev - 1))
													}
													disabled={safeOrdersPage <= 1}
												>
													Previous
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setOrdersPage((prev) =>
															Math.min(totalOrderPages, prev + 1),
														)
													}
													disabled={safeOrdersPage >= totalOrderPages}
												>
													Next
												</Button>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Order Status Breakdown */}
						{orderInsights.statusRows.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Order Status Breakdown</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Status</TableHead>
													<TableHead className="text-center">Orders</TableHead>
													<TableHead className="text-right">Total</TableHead>
													<TableHead className="text-right">Paid</TableHead>
													<TableHead className="text-right">Balance</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{orderInsights.statusRows.map((row) => (
													<TableRow key={row.status}>
														<TableCell>
															<Badge variant="outline" className="text-xs">{row.status}</Badge>
														</TableCell>
														<TableCell className="text-center">{row.count}</TableCell>
														<TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
														<TableCell className="text-right">{formatCurrency(row.paid)}</TableCell>
														<TableCell className="text-right text-orange-600">
															{formatCurrency(row.balance)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Payment State Summary */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<div className="bg-white border rounded-xl p-3">
								<p className="text-xs text-muted-foreground">Fully Paid Orders</p>
								<p className="text-lg font-bold text-green-600">
									{orderInsights.paymentSummary.fullyPaid}
								</p>
							</div>
							<div className="bg-white border rounded-xl p-3">
								<p className="text-xs text-muted-foreground">Partially Paid Orders</p>
								<p className="text-lg font-bold text-amber-600">
									{orderInsights.paymentSummary.partiallyPaid}
								</p>
							</div>
							<div className="bg-white border rounded-xl p-3">
								<p className="text-xs text-muted-foreground">Unpaid Orders</p>
								<p className="text-lg font-bold text-red-600">
									{orderInsights.paymentSummary.unpaid}
								</p>
							</div>
						</div>

						{/* Outstanding / Overdue / Cancelled */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Outstanding Orders</CardTitle>
									<CardDescription>Top 20 by current balance</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									{orderInsights.outstandingRows.length === 0 ? (
										<p className="text-sm text-muted-foreground">No outstanding orders</p>
									) : (
										orderInsights.outstandingRows.map((row) => (
											<div key={`out-${row.id || row.orderNumber}`} className="flex items-center justify-between text-sm">
												<span className="truncate pr-2">{row.orderNumber}</span>
												<span className="font-medium text-orange-600">{formatCurrency(row.balanceDue || 0)}</span>
											</div>
										))
									)}
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Overdue Orders</CardTitle>
									<CardDescription>Top 20 currently overdue</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									{orderInsights.overdueRows.length === 0 ? (
										<p className="text-sm text-muted-foreground">No overdue orders</p>
									) : (
										orderInsights.overdueRows.map((row) => (
											<div key={`ovd-${row.id || row.orderNumber}`} className="flex items-center justify-between text-sm">
												<span className="truncate pr-2">{row.orderNumber}</span>
												<Badge variant="outline" className="text-xs">OVERDUE</Badge>
											</div>
										))
									)}
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Cancelled Orders</CardTitle>
									<CardDescription>Top 20 cancelled records</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									{orderInsights.cancelledRows.length === 0 ? (
										<p className="text-sm text-muted-foreground">No cancelled orders</p>
									) : (
										orderInsights.cancelledRows.map((row) => (
											<div key={`can-${row.id || row.orderNumber}`} className="flex items-center justify-between text-sm">
												<span className="truncate pr-2">{row.orderNumber}</span>
												<Badge variant="outline" className="text-xs">CANCELLED</Badge>
											</div>
										))
									)}
								</CardContent>
							</Card>
						</div>

						{/* Daily Stats */}
						{report.dailyStats &&
							report.dailyStats.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base">
											Daily Activity
										</CardTitle>
										<CardDescription>
											Day-by-day breakdown for the
											selected period
										</CardDescription>
									</CardHeader>
									<CardContent>
								<div className="overflow-x-auto max-h-[400px] overflow-y-auto">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>
															Date
														</TableHead>
														<TableHead className="text-center">
															Created
														</TableHead>
														<TableHead className="text-center">
															Completed
														</TableHead>
												<TableHead>
													Items Rented
												</TableHead>
														<TableHead className="text-right">
															Revenue
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{report.dailyStats.map((day: any) => {
														const created =
															day.ordersCreated ??
															day.createdOrders ??
															day.totalCreated ??
															0;
														const completed =
															day.ordersCompleted ??
															day.completedOrders ??
															day.totalCompleted ??
															0;
														const itemNamesSource =
															day.itemNames ??
															day.itemsRentedNames ??
															day.rentedItemNames ??
															day.rentedItems ??
															day.items;
														const normalizedItemNames = Array.isArray(
															itemNamesSource,
														)
															? itemNamesSource
																	.map((item: any) =>
																		typeof item === "string"
																			? item
																			: item?.itemName || item?.name || "",
																	)
																	.filter(Boolean)
															: typeof itemNamesSource === "string"
																? itemNamesSource
																		.split(",")
																		.map((name: string) => name.trim())
																		.filter(Boolean)
																: [];
														const dateKey = normalizeDateKey(day.date);
														const fallbackNames = dateKey
															? Array.from(dailyItemsByDate.get(dateKey) || [])
															: [];
														const renderedItems =
															normalizedItemNames.length > 0
																? normalizedItemNames.join(", ")
																: fallbackNames.length > 0
																	? fallbackNames.join(", ")
																	: "-";
														const revenue =
															day.revenue ?? day.totalRevenue ?? 0;

														return (
															<TableRow
																key={day.date}
															>
																<TableCell className="font-medium text-sm">
																	{new Date(
																		day.date,
																	).toLocaleDateString(
																		"en-NG",
																		{
																			weekday:
																				"short",
																			month: "short",
																			day: "numeric",
																		},
																	)}
																</TableCell>
																<TableCell className="text-center">
																	{created}
																</TableCell>
																<TableCell className="text-center">
																	{completed}
																</TableCell>
																<TableCell className="max-w-[320px] truncate">
																	{renderedItems}
																</TableCell>
																<TableCell className="text-right font-medium">
																	{formatCurrency(
																		revenue,
																	)}
																</TableCell>
															</TableRow>
														);
													})}
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							)}
					</>
				)}
			</div>
		</BreadCrumbWrapper>
	);
}
