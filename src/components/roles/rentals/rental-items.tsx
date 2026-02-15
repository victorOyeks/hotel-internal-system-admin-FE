"use client";

import { useMemo, useState } from "react";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	SearchIcon,
	PackageIcon,
	BoxIcon,
	CheckCircle2Icon,
	AlertTriangleIcon,
	WrenchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RentalItemDialog } from "./rental-item-dialog";
import { RentalItemDetailsDialog } from "./rental-item-details-dialog";

type RentalItem = {
	id: string;
	name: string;
	category: string;
	dailyRate: number;
	depositAmount: number;
	totalQuantity: number;
	availableQuantity: number;
	rentedQuantity?: number;
	maintenanceQuantity?: number;
	condition?: string;
	pricingType?: string;
	active: boolean;
};

type RentalItemsPageProps = {
	items: RentalItem[];
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

export function RentalItemsPage({ items, breadcrumbs }: RentalItemsPageProps) {
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const stats = useMemo(() => {
		const totalItems = items.length;
		const totalStock = items.reduce((sum, i) => sum + i.totalQuantity, 0);
		const totalAvailable = items.reduce((sum, i) => sum + i.availableQuantity, 0);
		const totalRented = items.reduce((sum, i) => sum + (i.rentedQuantity ?? (i.totalQuantity - i.availableQuantity)), 0);
		const totalMaintenance = items.reduce((sum, i) => sum + (i.maintenanceQuantity ?? 0), 0);
		const outOfStock = items.filter((i) => i.availableQuantity === 0 && i.active).length;
		return { totalItems, totalStock, totalAvailable, totalRented, totalMaintenance, outOfStock };
	}, [items]);

	const categories = useMemo(() => {
		const cats = new Set(items.map((i) => i.category));
		return Array.from(cats).sort();
	}, [items]);

	const filteredItems = items.filter((item) => {
		const matchesSearch =
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(categoryLabels[item.category] || item.category)
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
		const matchesCategory = !selectedCategory || item.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-4 p-4 md:p-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Rental Items</h1>
						<p className="text-sm text-muted-foreground">
							Manage your rental inventory and pricing
						</p>
					</div>
					<RentalItemDialog />
				</div>

				{/* Summary Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-blue-50 rounded-lg">
							<BoxIcon className="w-4 h-4 text-blue-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Total Items</p>
							<p className="text-lg font-bold">{stats.totalItems}</p>
							<p className="text-[11px] text-muted-foreground">{stats.totalStock} units in stock</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-green-50 rounded-lg">
							<CheckCircle2Icon className="w-4 h-4 text-green-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Available</p>
							<p className="text-lg font-bold">{stats.totalAvailable}</p>
							<p className="text-[11px] text-muted-foreground">Ready to rent</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-purple-50 rounded-lg">
							<PackageIcon className="w-4 h-4 text-purple-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Rented Out</p>
							<p className="text-lg font-bold">{stats.totalRented}</p>
							<p className="text-[11px] text-muted-foreground">With customers</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-amber-50 rounded-lg">
							{stats.outOfStock > 0 ? (
								<AlertTriangleIcon className="w-4 h-4 text-amber-600" />
							) : (
								<WrenchIcon className="w-4 h-4 text-amber-600" />
							)}
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								{stats.outOfStock > 0 ? "Out of Stock" : "In Maintenance"}
							</p>
							<p className="text-lg font-bold">
								{stats.outOfStock > 0 ? stats.outOfStock : stats.totalMaintenance}
							</p>
							<p className="text-[11px] text-muted-foreground">
								{stats.outOfStock > 0 ? "Need restocking" : "Being serviced"}
							</p>
						</div>
					</div>
				</div>

				{/* Table */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">
								Inventory ({filteredItems.length})
							</CardTitle>
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search items..."
									className="pl-10 w-64"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
						{/* Category Filter Chips */}
						{categories.length > 1 && (
							<div className="flex flex-wrap gap-1.5 pt-2">
								<button
									onClick={() => setSelectedCategory(null)}
									className={cn(
										"px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
										!selectedCategory
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground hover:bg-muted/80",
									)}
								>
									All
								</button>
								{categories.map((cat) => (
									<button
										key={cat}
										onClick={() =>
											setSelectedCategory(selectedCategory === cat ? null : cat)
										}
										className={cn(
											"px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
											selectedCategory === cat
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground hover:bg-muted/80",
										)}
									>
										{categoryLabels[cat] || cat}
									</button>
								))}
							</div>
						)}
					</CardHeader>
					<CardContent>
						{filteredItems.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<PackageIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
								<p className="font-medium">No rental items found</p>
								<p className="text-sm mt-1">
									{searchQuery || selectedCategory
										? "Try adjusting your search or filter"
										: "Add your first rental item to get started"}
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Item</TableHead>
											<TableHead>Category</TableHead>
											<TableHead className="text-right">Daily Rate</TableHead>
											<TableHead className="text-right">Deposit</TableHead>
											<TableHead className="text-center">Stock</TableHead>
											<TableHead className="text-center">Utilization</TableHead>
											<TableHead className="text-center">Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredItems.map((item) => {
											const utilizationRate =
												item.totalQuantity > 0
													? Math.round(
															((item.totalQuantity - item.availableQuantity) /
																item.totalQuantity) *
																100,
														)
													: 0;
											const isAvailable = item.availableQuantity > 0;

											return (
												<TableRow
													key={item.id}
													className="hover:bg-muted/50 cursor-pointer"
													onClick={() => {
														setSelectedItemId(item.id);
														setIsDetailsOpen(true);
													}}
												>
													<TableCell>
														<div className="flex items-center gap-2.5">
															<div className="p-1.5 bg-blue-50 rounded-md">
																<PackageIcon className="w-4 h-4 text-blue-600" />
															</div>
															<div>
																<p className="font-medium text-sm">{item.name}</p>
																{item.pricingType && item.pricingType !== "DAILY" && (
																	<p className="text-[11px] text-muted-foreground capitalize">
																		{item.pricingType.toLowerCase().replace(/_/g, " ")} pricing
																	</p>
																)}
															</div>
														</div>
													</TableCell>
													<TableCell>
														<Badge variant="outline" className="text-xs font-normal">
															{categoryLabels[item.category] || item.category}
														</Badge>
													</TableCell>
													<TableCell className="text-right font-semibold text-green-600">
														{formatCurrency(item.dailyRate)}
													</TableCell>
													<TableCell className="text-right text-sm">
														{formatCurrency(item.depositAmount)}
													</TableCell>
													<TableCell className="text-center">
														<div className="flex flex-col items-center">
															<span className="text-sm">
																<span className="font-semibold">{item.availableQuantity}</span>
																<span className="text-muted-foreground"> / {item.totalQuantity}</span>
															</span>
															{(item.rentedQuantity ?? 0) > 0 && (
																<span className="text-[10px] text-purple-600">
																	{item.rentedQuantity} rented
																</span>
															)}
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2 justify-center">
															<div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
																<div
																	className={cn(
																		"h-full rounded-full transition-all",
																		utilizationRate > 80
																			? "bg-red-500"
																			: utilizationRate > 50
																				? "bg-amber-500"
																				: utilizationRate > 0
																					? "bg-blue-500"
																					: "bg-gray-200",
																	)}
																	style={{ width: `${Math.max(utilizationRate, 2)}%` }}
																/>
															</div>
															<span className={cn(
																"text-xs font-medium w-8 text-right",
																utilizationRate > 80
																	? "text-red-600"
																	: utilizationRate > 50
																		? "text-amber-600"
																		: "text-muted-foreground",
															)}>
																{utilizationRate}%
															</span>
														</div>
													</TableCell>
													<TableCell className="text-center">
														{item.active ? (
															isAvailable ? (
																<Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
																	Available
																</Badge>
															) : (
																<Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
																	Out of Stock
																</Badge>
															)
														) : (
															<Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs">
																Inactive
															</Badge>
														)}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<RentalItemDetailsDialog
				itemId={selectedItemId}
				open={isDetailsOpen}
				onOpenChange={setIsDetailsOpen}
			/>
		</BreadCrumbWrapper>
	);
}
