"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SearchIcon, ShirtIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { TableFilter } from "@/components/shared/table-filter";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getLaundryItems } from "@/lib/laundry-actions";
import { LaundryItemDialog } from "./laundry-item-dialog";
import { LaundryBulkUploadDialog } from "./laundry-bulk-upload-dialog";
import { LaundryItemDetailsDialog } from "./laundry-item-details-dialog";

type LaundryItem = {
	id: string;
	name: string;
	description?: string;
	category: string;
	washOnlyPrice?: number;
	washAndIronPrice?: number;
	washAndFoldPrice?: number;
	dryCleanPrice?: number;
	ironOnlyPrice?: number;
	steamPressPrice?: number;
	stainRemovalPrice?: number;
	handWashPrice?: number;
	washIronAndPackPrice?: number;
	expressMultiplier?: number;
	sameDayMultiplier?: number;
	urgentMultiplier?: number;
	active: boolean;
	specialInstructions?: string;
	createdAt: string;
};

type LaundryItemsPageProps = {
	items: LaundryItem[];
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const categoryLabels: Record<string, string> = {
	CLOTHING: "Clothing",
	BEDDING: "Bedding",
	TOWELS: "Towels",
	CURTAINS: "Curtains",
	UNIFORMS: "Uniforms",
	TABLE_LINEN: "Table Linen",
	DELICATES: "Delicates",
	ACCESSORIES: "Accessories",
	OUTERWEAR: "Outerwear",
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

function getLowestPrice(item: LaundryItem): number | null {
	const prices = [
		item.washOnlyPrice,
		item.washAndIronPrice,
		item.washAndFoldPrice,
		item.dryCleanPrice,
		item.ironOnlyPrice,
		item.steamPressPrice,
		item.stainRemovalPrice,
		item.handWashPrice,
		item.washIronAndPackPrice,
	].filter((p): p is number => p != null && p > 0);
	return prices.length > 0 ? Math.min(...prices) : null;
}

function getServiceCount(item: LaundryItem): number {
	return [
		item.washOnlyPrice,
		item.washAndIronPrice,
		item.washAndFoldPrice,
		item.dryCleanPrice,
		item.ironOnlyPrice,
		item.steamPressPrice,
		item.stainRemovalPrice,
		item.handWashPrice,
		item.washIronAndPackPrice,
	].filter((p) => p != null && p > 0).length;
}

export function LaundryItemsPage({
	items: initialItems,
	breadcrumbs,
}: LaundryItemsPageProps) {
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterOpen, setFilterOpen] = useState(false);
	const [appliedFilters, setAppliedFilters] = useState<{
		category: string | null;
		status: string | null;
	}>({ category: null, status: null });
	const [localFilters, setLocalFilters] = useState(appliedFilters);

	const { data: items = initialItems } = useQuery({
		queryKey: ["laundry", "items"],
		queryFn: async () => {
			const result = await getLaundryItems();
			if (!result.success) throw new Error(result.error);
			return result.data as LaundryItem[];
		},
		initialData: initialItems,
	});

	const stats = useMemo(() => {
		const totalItems = items.length;
		const activeItems = items.filter((i) => i.active).length;
		const inactiveItems = items.filter((i) => !i.active).length;
		const categories = new Set(items.map((i) => i.category)).size;
		return { totalItems, activeItems, inactiveItems, categories };
	}, [items]);

	const categories = useMemo(() => {
		const cats = new Set(items.map((i) => i.category));
		return Array.from(cats).sort();
	}, [items]);

	const activeFilterCount = [appliedFilters.category, appliedFilters.status].filter(Boolean).length;

	const applyFilters = () => {
		setAppliedFilters(localFilters);
		setFilterOpen(false);
	};

	const clearFilters = () => {
		const cleared = { category: null, status: null };
		setLocalFilters(cleared);
		setAppliedFilters(cleared);
	};

	const filteredItems = items.filter((item) => {
		const matchesSearch =
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(categoryLabels[item.category] || item.category)
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
		const matchesCategory =
			!appliedFilters.category || item.category === appliedFilters.category;
		const matchesStatus =
			!appliedFilters.status ||
			(appliedFilters.status === "active" ? item.active : !item.active);
		return matchesSearch && matchesCategory && matchesStatus;
	});

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-4 p-4 md:p-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Laundry Items</h1>
						<p className="text-sm text-muted-foreground">
							Manage laundry service items and pricing
						</p>
					</div>
					<div className="flex items-center gap-2">
						<LaundryBulkUploadDialog />
						<LaundryItemDialog />
					</div>
				</div>

				{/* Summary Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-blue-50 rounded-lg">
							<ShirtIcon className="w-4 h-4 text-blue-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Total Items</p>
							<p className="text-lg font-bold">{stats.totalItems}</p>
							<p className="text-[11px] text-muted-foreground">
								{stats.categories} categories
							</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-green-50 rounded-lg">
							<CheckCircle2Icon className="w-4 h-4 text-green-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Active</p>
							<p className="text-lg font-bold">{stats.activeItems}</p>
							<p className="text-[11px] text-muted-foreground">
								Available services
							</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-red-50 rounded-lg">
							<XCircleIcon className="w-4 h-4 text-red-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Inactive</p>
							<p className="text-lg font-bold">{stats.inactiveItems}</p>
							<p className="text-[11px] text-muted-foreground">
								Disabled items
							</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-purple-50 rounded-lg">
							<ShirtIcon className="w-4 h-4 text-purple-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Categories</p>
							<p className="text-lg font-bold">{stats.categories}</p>
							<p className="text-[11px] text-muted-foreground">Item groups</p>
						</div>
					</div>
				</div>

				{/* Table */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between gap-3">
							<CardTitle className="text-lg">
								Service Items ({filteredItems.length})
							</CardTitle>
							<div className="flex items-center gap-2">
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										placeholder="Search items..."
										className="pl-10 w-64"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
								<TableFilter
									open={filterOpen}
									setOpen={(open) => {
										setFilterOpen(open);
										if (open) setLocalFilters(appliedFilters);
									}}
									count={activeFilterCount}
								>
									<div className="w-72 space-y-4 p-1">
										<div className="flex items-center justify-between border-b pb-2">
											<h4 className="font-semibold text-sm">Filter Items</h4>
											<Button
												variant="ghost"
												size="sm"
												onClick={clearFilters}
												className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
											>
												Clear all
											</Button>
										</div>
										<div className="space-y-2">
											<Label>Category</Label>
											<Select
												value={localFilters.category || "all"}
												onValueChange={(val) =>
													setLocalFilters((prev) => ({
														...prev,
														category: val === "all" ? null : val,
													}))
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="All Categories" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">All Categories</SelectItem>
													{categories.map((cat) => (
														<SelectItem key={cat} value={cat}>
															{categoryLabels[cat] || cat}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Status</Label>
											<Select
												value={localFilters.status || "all"}
												onValueChange={(val) =>
													setLocalFilters((prev) => ({
														...prev,
														status: val === "all" ? null : val,
													}))
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="All Statuses" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">All Statuses</SelectItem>
													<SelectItem value="active">Active</SelectItem>
													<SelectItem value="inactive">Inactive</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<Button className="w-full" onClick={applyFilters}>
											Apply Filters
										</Button>
									</div>
								</TableFilter>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{filteredItems.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<ShirtIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
								<p className="font-medium">No laundry items found</p>
								<p className="text-sm mt-1">
									{searchQuery || selectedCategory
										? "Try adjusting your search or filter"
										: "Add your first laundry item to get started"}
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Item</TableHead>
											<TableHead>Category</TableHead>
											<TableHead className="text-right">From Price</TableHead>
											<TableHead className="text-center">Services</TableHead>
											<TableHead className="text-center">Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredItems.map((item) => {
											const lowestPrice = getLowestPrice(item);
											const serviceCount = getServiceCount(item);

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
																<ShirtIcon className="w-4 h-4 text-blue-600" />
															</div>
															<div>
																<p className="font-medium text-sm">
																	{item.name}
																</p>
																{item.description && (
																	<p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
																		{item.description}
																	</p>
																)}
															</div>
														</div>
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className="text-xs font-normal"
														>
															{categoryLabels[item.category] || item.category}
														</Badge>
													</TableCell>
													<TableCell className="text-right font-semibold text-green-600">
														{lowestPrice != null
															? formatCurrency(lowestPrice)
															: "—"}
													</TableCell>
													<TableCell className="text-center">
														<Badge variant="outline" className="text-xs">
															{serviceCount} service
															{serviceCount !== 1 ? "s" : ""}
														</Badge>
													</TableCell>
													<TableCell className="text-center">
														{item.active ? (
															<Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
																Active
															</Badge>
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

			<LaundryItemDetailsDialog
				itemId={selectedItemId}
				open={isDetailsOpen}
				onOpenChange={setIsDetailsOpen}
			/>
		</BreadCrumbWrapper>
	);
}
