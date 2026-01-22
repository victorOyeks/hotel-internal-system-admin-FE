"use client";

import { BoxIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import {
	type InventoryResponse,
	type InventoryRestockRequest,
	RestaurantInventoryTable,
} from "./inventory-table";
import type { Pagination } from "@/lib/fetch";
import { type PropsWithChildren, type ReactNode, useState } from "react";
import type { APIOutput } from "@/lib/action-utils";
import {
	DialogTitle,
	DialogDescription,
	Dialog,
	DialogTrigger,
	DialogContent,
} from "@/components/ui/dialog";
import { AddBarItem, AddFoodItem } from "./quick-action-modals";

type InventorySummaryResponse =
	APIOutput<"@get/api/restaurants/bar-inventory-summary">["data"];

function InventoryStat({ data }: { data: InventorySummaryResponse }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-blue-600/10 rounded-full flex items-center justify-center">
					<BoxIcon className="size-6 text-blue-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Total Items</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.totalItems}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
					<BoxIcon className="size-6 text-green-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Available Items</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.availableItems}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-yellow-600/10 rounded-full flex items-center justify-center">
					<BoxIcon className="size-6 text-yellow-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Low in Stock</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.lowInStockItems}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-red-600/10 rounded-full flex items-center justify-center">
					<BoxIcon className="size-6 text-red-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Out of Stock</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.outOfStockItems}
					</p>
				</div>
			</div>
		</div>
	);
}

const actions = [
	{
		title: "Add food item",
		heading: "Add Food Item to Inventory",
		Component: AddFoodItem,
		icon: PlusIcon,
		key: "add-food-item",
	},
	{
		title: "Add drink item",
		heading: "Add Drink Item to Inventory",
		Component: AddBarItem,
		icon: PlusIcon,
		key: "add-drink-item",
	},
];

function QuickActions() {
	const [open, setOpen] = useState<false | string>(false);
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
			{actions.map(({ icon: Icon, title, key, heading, Component }) => {
				return (
					<BaseModal
						key={key}
						open={open === key}
						setOpen={(open) => setOpen(open ? key : false)}
						trigger={
							<div className="flex flex-row items-center gap-x-2 bg-white p-2 rounded-4xl border border-primary-5/50">
								<div className="flex items-center gap-x-2 flex-1">
									<div className="size-8 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
										<Icon className="size-5 text-green-600" />
									</div>

									<p className="text-sm font-medium">{title}</p>
								</div>

								<ChevronRightIcon className="size-4 text-muted-foreground" />
							</div>
						}
					>
						<DialogTitle>{heading || title}</DialogTitle>
						<DialogDescription className="sr-only">{title}</DialogDescription>
						{Component && (
							<Component setOpen={(open) => setOpen(open ? key : false)} />
						)}
					</BaseModal>
				);
			})}
		</div>
	);
}

function BaseModal({
	children,
	open,
	setOpen,
	trigger,
}: PropsWithChildren<{
	trigger: ReactNode;
	open: boolean;
	setOpen: (open: boolean) => void;
}>) {
	return (
		<Dialog modal open={open} onOpenChange={setOpen}>
			<DialogTrigger>{trigger}</DialogTrigger>

			<DialogContent className="rounded-4xl max-w-md max-h-[90vh] flex flex-col p-6 overflow-y-scroll scrollbar-hidden">
				{children}
			</DialogContent>
		</Dialog>
	);
}

export function RestaurantInventoryPage({
	section,
	statData,
	inventoryData,
	paginationMeta,
}: {
	section: "restock" | null;
	inventoryData: InventoryResponse[] | InventoryRestockRequest[];
	statData: InventorySummaryResponse;
	paginationMeta: Pagination;
}) {
	return (
		<div className="p-4 md:p-6 space-y-2 md:space-y-4">
			<InventoryStat data={statData} />
			<QuickActions />
			<RestaurantInventoryTable
				data={inventoryData}
				section={section}
				paginationMeta={paginationMeta}
			/>
		</div>
	);
}
