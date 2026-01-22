"use client";

import { useState } from "react";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlusCircleIcon, SearchIcon, PackageIcon } from "lucide-react";
import type { Pagination } from "@/lib/fetch";
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
	active: boolean;
};

type RentalItemsPageProps = {
	items: RentalItem[];
	paginationMeta: Pagination;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

export function RentalItemsPage({
	items,
	paginationMeta,
	breadcrumbs,
}: RentalItemsPageProps) {
	const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
								<Input placeholder="Search rental items..." className="pl-10" />
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{items.map((item) => (
								<RentalItemCard
									key={item.id}
									item={item}
									onViewDetails={(item) => {
										setSelectedItem(item);
										setIsDetailsOpen(true);
									}}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			<RentalItemDetailsDialog
				item={selectedItem}
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
	onViewDetails: (item: RentalItem) => void;
}) {
	const isAvailable = item.availableQuantity > 0;

	return (
		<Card className="hover:shadow-lg transition-shadow">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<PackageIcon className="w-5 h-5 text-blue-600" />
						<CardTitle className="text-lg">{item.name}</CardTitle>
					</div>
					<Badge variant={isAvailable ? "default" : "secondary"}>
						{isAvailable ? "Available" : "Out of Stock"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Daily Rate:</span>
					<span className="font-semibold">${item.dailyRate}</span>
				</div>
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Deposit:</span>
					<span className="font-semibold">${item.depositAmount}</span>
				</div>
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Available:</span>
					<span className="font-semibold">
						{item.availableQuantity} / {item.totalQuantity}
					</span>
				</div>
				<Button
					variant="outline"
					className="w-full mt-2"
					onClick={() => onViewDetails(item)}
				>
					View Details
				</Button>
			</CardContent>
		</Card>
	);
}
