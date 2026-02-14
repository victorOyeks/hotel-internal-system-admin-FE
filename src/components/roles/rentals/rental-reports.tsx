"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { $fetch } from "@/lib/fetch";
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
	CalendarIcon,
	DollarSignIcon,
	PackageIcon,
	TrendingUpIcon,
	ClipboardListIcon,
	AlertCircleIcon,
	Loader2Icon,
} from "lucide-react";

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

export function RentalReportsPage({ breadcrumbs }: RentalReportsPageProps) {
	const defaults = getDefaultDates();
	const [startDate, setStartDate] = useState(defaults.startDate);
	const [endDate, setEndDate] = useState(defaults.endDate);
	const [queryDates, setQueryDates] = useState({
		startDate: defaults.startDate,
		endDate: defaults.endDate,
	});

	const {
		data: report,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["rentals", "reports", queryDates],
		queryFn: async () => {
			const response = await $fetch(
				"@get/api/hotels/rentals/reports",
				{
					query: {
						startDate: queryDates.startDate,
						endDate: queryDates.endDate,
					},
					throw: true,
				},
			);
			return response.data;
		},
	});

	const handleGenerate = () => {
		setQueryDates({ startDate, endDate });
	};

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
							<Button onClick={handleGenerate}>
								<BarChart3Icon className="w-4 h-4 mr-2" />
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
							Failed to load report. Please try again.
						</CardContent>
					</Card>
				)}

				{report && (
					<>
						{/* Order Stats */}
						<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
							<Card>
								<CardContent className="pt-5 pb-4">
									<div className="flex items-center gap-2 mb-1">
										<ClipboardListIcon className="w-4 h-4 text-blue-600" />
										<p className="text-xs text-muted-foreground">
											Total Orders
										</p>
									</div>
									<p className="text-2xl font-bold">
										{report.totalOrders}
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-5 pb-4">
									<div className="flex items-center gap-2 mb-1">
										<TrendingUpIcon className="w-4 h-4 text-green-600" />
										<p className="text-xs text-muted-foreground">
											Completed
										</p>
									</div>
									<p className="text-2xl font-bold text-green-600">
										{report.completedOrders}
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-5 pb-4">
									<div className="flex items-center gap-2 mb-1">
										<PackageIcon className="w-4 h-4 text-blue-600" />
										<p className="text-xs text-muted-foreground">
											Active
										</p>
									</div>
									<p className="text-2xl font-bold text-blue-600">
										{report.activeOrders}
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-5 pb-4">
									<div className="flex items-center gap-2 mb-1">
										<AlertCircleIcon className="w-4 h-4 text-red-600" />
										<p className="text-xs text-muted-foreground">
											Overdue
										</p>
									</div>
									<p className="text-2xl font-bold text-red-600">
										{report.overdueOrders}
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-5 pb-4">
									<div className="flex items-center gap-2 mb-1">
										<ClipboardListIcon className="w-4 h-4 text-gray-500" />
										<p className="text-xs text-muted-foreground">
											Cancelled
										</p>
									</div>
									<p className="text-2xl font-bold text-gray-500">
										{report.cancelledOrders}
									</p>
								</CardContent>
							</Card>
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
														<TableHead className="text-center">
															Items Rented
														</TableHead>
														<TableHead className="text-right">
															Revenue
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{report.dailyStats.map(
														(day: any) => (
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
																	{
																		day.ordersCreated
																	}
																</TableCell>
																<TableCell className="text-center">
																	{
																		day.ordersCompleted
																	}
																</TableCell>
																<TableCell className="text-center">
																	{
																		day.itemsRented
																	}
																</TableCell>
																<TableCell className="text-right font-medium">
																	{formatCurrency(
																		day.revenue ||
																			0,
																	)}
																</TableCell>
															</TableRow>
														),
													)}
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
