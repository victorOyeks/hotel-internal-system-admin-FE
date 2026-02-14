"use client";

import { useState } from "react";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchIcon, PackageIcon } from "lucide-react";
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

	const filteredItems = items.filter(
		(item) =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(categoryLabels[item.category] || item.category)
				.toLowerCase()
				.includes(searchQuery.toLowerCase()),
	);

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Rental Items</h1>
						<p className="text-muted-foreground mt-1">
							Manage your rental inventory and pricing
						</p>
					</div>
					<RentalItemDialog />
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-4">
							<div className="flex-1 relative">
								<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search rental items..."
									className="pl-10"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{filteredItems.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<PackageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
								<p className="text-lg font-medium">No rental items found</p>
								<p className="text-sm mt-1">
									{searchQuery
										? "Try adjusting your search"
										: "Add your first rental item to get started"}
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{filteredItems.map((item) => (
									<RentalItemCard
										key={item.id}
										item={item}
										onViewDetails={(id) => {
											setSelectedItemId(id);
											setIsDetailsOpen(true);
										}}
									/>
								))}
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

function RentalItemCard({
	item,
	onViewDetails,
}: {
	item: RentalItem;
	onViewDetails: (id: string) => void;
}) {
	const isAvailable = item.availableQuantity > 0;
	const utilizationRate =
		item.totalQuantity > 0
			? (
					((item.totalQuantity - item.availableQuantity) /
						item.totalQuantity) *
					100
				).toFixed(0)
			: "0";

	return (
		<Card className="hover:shadow-lg transition-shadow">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2 min-w-0">
						<PackageIcon className="w-5 h-5 text-blue-600 shrink-0" />
						<h3 className="text-lg font-semibold truncate">{item.name}</h3>
					</div>
					<Badge variant={isAvailable ? "default" : "secondary"}>
						{isAvailable ? "Available" : "Out of Stock"}
					</Badge>
				</div>
				<Badge variant="outline" className="w-fit mt-1">
					{categoryLabels[item.category] || item.category}
				</Badge>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Daily Rate:</span>
					<span className="font-semibold text-green-600">
						{formatCurrency(item.dailyRate)}
					</span>
				</div>
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Deposit:</span>
					<span className="font-semibold">
						{formatCurrency(item.depositAmount)}
					</span>
				</div>
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Available:</span>
					<span className="font-semibold">
						{item.availableQuantity} / {item.totalQuantity}
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-1.5">
					<div
						className="bg-blue-600 h-1.5 rounded-full transition-all"
						style={{ width: `${utilizationRate}%` }}
					/>
				</div>
				<p className="text-xs text-muted-foreground text-right">
					{utilizationRate}% utilized
				</p>
				<Button
					variant="outline"
					className="w-full mt-2"
					onClick={() => onViewDetails(item.id)}
				>
					View Details
				</Button>
			</CardContent>
		</Card>
	);
}
