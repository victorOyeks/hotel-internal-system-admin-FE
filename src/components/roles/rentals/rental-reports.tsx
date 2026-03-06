"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRentalReports } from "@/lib/rental-actions";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import {
	Card,
	CardContent,
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
import {
	BarChart3Icon,
	Loader2Icon,
	TrendingUpIcon,
	ClipboardListIcon,
	CheckCircle2Icon,
	AlertCircleIcon,
	XCircleIcon,
	PackageIcon,
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
	PHOTOGRAPHY: "Photography",
	TOOLS: "Tools",
	LINENS: "Linens",
	FURNITURE: "Furniture",
	KITCHEN_EQUIPMENT: "Kitchen Equipment",
	AUDIO_VISUAL: "Audio Visual",
	OTHERS: "Others",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function getDefaultDates() {
	const now = new Date();
	const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
	return {
		startDate: startDate.toISOString().split("T")[0],
		endDate: now.toISOString().split("T")[0],
	};
}

const toNum = (v: unknown) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
};

export function RentalReportsPage({ breadcrumbs }: RentalReportsPageProps) {
	const defaults = getDefaultDates();
	const [startDate, setStartDate] = useState(defaults.startDate);
	const [endDate, setEndDate] = useState(defaults.endDate);
	const [queryDates, setQueryDates] = useState({
		startDate: defaults.startDate,
		endDate: defaults.endDate,
	});

	const { data: report, isLoading, isFetching, isError, error } = useQuery({
		queryKey: ["rentals", "reports", queryDates],
		queryFn: async () => {
			const result = await getRentalReports(queryDates.startDate, queryDates.endDate);
			if (!result.success) throw new Error(result.error);
			return result.data;
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
	};

	const totalOrders = toNum(report?.totalOrders);
	const completedOrders = toNum(report?.completedOrders);
	const activeOrders = toNum(report?.activeOrders);
	const overdueOrders = toNum(report?.overdueOrders);
	const cancelledOrders = toNum(report?.cancelledOrders);
	const totalRevenue = toNum(report?.totalRevenue);
	const totalCollected = toNum(report?.totalCollected);
	const totalOutstanding = toNum(report?.totalOutstanding);
	const totalQuantityRented = toNum(report?.totalQuantityRented);
	const damagedItemsCount = toNum(report?.damagedItemsCount);
	const lostItemsCount = toNum(report?.lostItemsCount);
	const topItemsByRevenue = Array.isArray(report?.topItemsByRevenue) ? report.topItemsByRevenue : [];
	const categoryBreakdown = Array.isArray(report?.categoryBreakdown) ? report.categoryBreakdown : [];
	const collectionRate = totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : "0.0";

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-5 p-6">
				{/* Header + Date Picker */}
				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Rental Reports</h1>
						<p className="text-sm text-muted-foreground mt-0.5">
							Performance overview for the selected period
						</p>
					</div>
					<div className="flex items-end gap-3">
						<div className="space-y-1">
							<Label className="text-xs">From</Label>
							<Input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="w-40 h-9"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">To</Label>
							<Input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="w-40 h-9"
							/>
						</div>
						<Button
							size="sm"
							onClick={(e) => {
								e.preventDefault();
								handleGenerate();
							}}
							disabled={isFetching}
							className="h-9"
						>
							{isFetching ? (
								<Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" />
							) : (
								<BarChart3Icon className="w-4 h-4 mr-1.5" />
							)}
							Generate
						</Button>
					</div>
				</div>

				{isLoading && (
					<div className="flex justify-center py-20">
						<Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
					</div>
				)}

				{isError && (
					<Card>
						<CardContent className="py-12 text-center text-muted-foreground">
							{(error as Error)?.message || "Failed to load report"}
						</CardContent>
					</Card>
				)}

				{report && !isLoading && (
					<>
						{/* Order Summary */}
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
							<Card className="shadow-none">
								<CardContent className="p-4 flex items-center gap-3">
									<div className="p-2 rounded-lg bg-slate-100">
										<ClipboardListIcon className="w-4 h-4 text-slate-600" />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Total Orders</p>
										<p className="text-xl font-bold">{totalOrders}</p>
									</div>
								</CardContent>
							</Card>
							<Card className="shadow-none">
								<CardContent className="p-4 flex items-center gap-3">
									<div className="p-2 rounded-lg bg-green-50">
										<CheckCircle2Icon className="w-4 h-4 text-green-600" />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Completed</p>
										<p className="text-xl font-bold text-green-600">{completedOrders}</p>
									</div>
								</CardContent>
							</Card>
							<Card className="shadow-none">
								<CardContent className="p-4 flex items-center gap-3">
									<div className="p-2 rounded-lg bg-blue-50">
										<PackageIcon className="w-4 h-4 text-blue-600" />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Active</p>
										<p className="text-xl font-bold text-blue-600">{activeOrders}</p>
									</div>
								</CardContent>
							</Card>
							<Card className="shadow-none">
								<CardContent className="p-4 flex items-center gap-3">
									<div className="p-2 rounded-lg bg-red-50">
										<AlertCircleIcon className="w-4 h-4 text-red-600" />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Overdue</p>
										<p className="text-xl font-bold text-red-600">{overdueOrders}</p>
									</div>
								</CardContent>
							</Card>
							<Card className="shadow-none">
								<CardContent className="p-4 flex items-center gap-3">
									<div className="p-2 rounded-lg bg-gray-100">
										<XCircleIcon className="w-4 h-4 text-gray-500" />
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Cancelled</p>
										<p className="text-xl font-bold text-gray-500">{cancelledOrders}</p>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Revenue Overview */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
							<Card className="shadow-none border-l-4 border-l-slate-400">
								<CardContent className="p-4">
									<p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
									<p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
								</CardContent>
							</Card>
							<Card className="shadow-none border-l-4 border-l-green-500">
								<CardContent className="p-4">
									<p className="text-xs text-muted-foreground mb-1">Collected</p>
									<p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
								</CardContent>
							</Card>
							<Card className="shadow-none border-l-4 border-l-orange-500">
								<CardContent className="p-4">
									<p className="text-xs text-muted-foreground mb-1">Outstanding</p>
									<p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
								</CardContent>
							</Card>
							<Card className="shadow-none border-l-4 border-l-blue-500">
								<CardContent className="p-4">
									<p className="text-xs text-muted-foreground mb-1">Collection Rate</p>
									<p className="text-2xl font-bold text-blue-600">{collectionRate}%</p>
								</CardContent>
							</Card>
						</div>

						{/* Quick Stats Row */}
						{(totalQuantityRented > 0 || damagedItemsCount > 0 || lostItemsCount > 0) && (
							<div className="grid grid-cols-3 gap-3">
								<div className="bg-white border rounded-xl p-3 text-center">
									<p className="text-xs text-muted-foreground">Items Rented</p>
									<p className="text-lg font-bold">{totalQuantityRented}</p>
								</div>
								<div className="bg-white border rounded-xl p-3 text-center">
									<p className="text-xs text-muted-foreground">Damaged</p>
									<p className="text-lg font-bold text-red-600">{damagedItemsCount}</p>
								</div>
								<div className="bg-white border rounded-xl p-3 text-center">
									<p className="text-xs text-muted-foreground">Lost</p>
									<p className="text-lg font-bold text-red-600">{lostItemsCount}</p>
								</div>
							</div>
						)}

						{/* Top Items + Category side by side */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{topItemsByRevenue.length > 0 && (
								<Card className="shadow-none">
									<CardHeader className="pb-3">
										<div className="flex items-center gap-2">
											<TrendingUpIcon className="w-4 h-4 text-green-600" />
											<CardTitle className="text-sm font-semibold">Top Items by Revenue</CardTitle>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="text-xs">Item</TableHead>
													<TableHead className="text-xs text-center">Times</TableHead>
													<TableHead className="text-xs text-center">Qty</TableHead>
													<TableHead className="text-xs text-right">Revenue</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{topItemsByRevenue.map((item: any, i: number) => (
													<TableRow key={item.itemId || i}>
														<TableCell className="py-2">
															<p className="text-sm font-medium">{item.itemName}</p>
															<p className="text-xs text-muted-foreground">
																{categoryLabels[item.category] || item.category}
															</p>
														</TableCell>
														<TableCell className="text-center text-sm">{item.timesRented}</TableCell>
														<TableCell className="text-center text-sm">{item.totalQuantityRented}</TableCell>
														<TableCell className="text-right text-sm font-medium text-green-600">
															{formatCurrency(toNum(item.totalRevenue))}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							)}

							{categoryBreakdown.length > 0 && (
								<Card className="shadow-none">
									<CardHeader className="pb-3">
										<div className="flex items-center gap-2">
											<BarChart3Icon className="w-4 h-4 text-blue-600" />
											<CardTitle className="text-sm font-semibold">Category Breakdown</CardTitle>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="text-xs">Category</TableHead>
													<TableHead className="text-xs text-center">Orders</TableHead>
													<TableHead className="text-xs text-right">Revenue</TableHead>
													<TableHead className="text-xs text-right">Share</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{categoryBreakdown.map((cat: any, i: number) => (
													<TableRow key={cat.category || i}>
														<TableCell className="py-2 text-sm font-medium">
															{categoryLabels[cat.category] || cat.category}
														</TableCell>
														<TableCell className="text-center text-sm">{cat.orderCount}</TableCell>
														<TableCell className="text-right text-sm font-medium">
															{formatCurrency(toNum(cat.revenue))}
														</TableCell>
														<TableCell className="text-right">
															<Badge variant="outline" className="text-xs font-normal">
																{toNum(cat.percentageOfTotal).toFixed(1)}%
															</Badge>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							)}
						</div>

						{/* Empty state */}
						{totalOrders === 0 && (
							<Card className="shadow-none">
								<CardContent className="py-16 text-center">
									<ClipboardListIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
									<p className="text-muted-foreground font-medium">No rental orders in this period</p>
									<p className="text-sm text-muted-foreground mt-1">Try adjusting the date range</p>
								</CardContent>
							</Card>
						)}
					</>
				)}
			</div>
		</BreadCrumbWrapper>
	);
}
