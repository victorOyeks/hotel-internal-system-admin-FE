"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getLaundryItemDetails,
	deactivateLaundryItem,
} from "@/lib/laundry-actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
	Loader2Icon,
	AlertCircleIcon,
	RefreshCwIcon,
	ShirtIcon,
	TrashIcon,
} from "lucide-react";
import { LaundryItemDialog } from "./laundry-item-dialog";

type LaundryItemDetailsDialogProps = {
	itemId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
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

const SERVICE_LABELS: Record<string, string> = {
	washOnlyPrice: "Wash Only",
	washAndIronPrice: "Wash & Iron",
	washAndFoldPrice: "Wash & Fold",
	dryCleanPrice: "Dry Clean",
	ironOnlyPrice: "Iron Only",
	steamPressPrice: "Steam Press",
	stainRemovalPrice: "Stain Removal",
	handWashPrice: "Hand Wash",
	washIronAndPackPrice: "Wash, Iron & Pack",
};

export function LaundryItemDetailsDialog({
	itemId,
	open,
	onOpenChange,
}: LaundryItemDetailsDialogProps) {
	const queryClient = useQueryClient();

	const {
		data: item,
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery({
		queryKey: ["laundry", "items", itemId],
		queryFn: async () => {
			const result = await getLaundryItemDetails(itemId!);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: !!itemId && open,
		retry: 1,
	});

	const deactivateMutation = useMutation({
		mutationFn: async () => {
			const result = await deactivateLaundryItem(itemId!);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success("Item deactivated successfully");
			queryClient.invalidateQueries({ queryKey: ["laundry", "items"] });
			queryClient.invalidateQueries({
				queryKey: ["laundry", "dashboard-stats"],
			});
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to deactivate item");
		},
	});

	if (!itemId) return null;

	const servicePrices = item
		? Object.entries(SERVICE_LABELS)
				.map(([key, label]) => ({
					label,
					price: item[key] as number | undefined,
				}))
				.filter((s) => s.price != null && s.price > 0)
		: [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
						<p className="text-sm text-muted-foreground">Loading item details...</p>
					</div>
				) : isError ? (
					<div className="flex flex-col items-center justify-center py-12 gap-4">
						<AlertCircleIcon className="w-10 h-10 text-red-400" />
						<div className="text-center">
							<p className="font-medium text-red-600">Failed to load item</p>
							<p className="text-sm text-muted-foreground mt-1">
								{error?.message || "Something went wrong."}
							</p>
						</div>
						<Button variant="outline" size="sm" onClick={() => refetch()}>
							<RefreshCwIcon className="w-4 h-4 mr-2" />
							Try Again
						</Button>
					</div>
				) : !item ? (
					<div className="text-center py-12 text-muted-foreground">
						Item not found
					</div>
				) : (
					<>
						<DialogHeader>
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-50 rounded-lg">
									<ShirtIcon className="w-5 h-5 text-blue-600" />
								</div>
								<div>
									<DialogTitle className="text-2xl font-bold">
										{item.name}
									</DialogTitle>
									<DialogDescription>
										{item.description || "Laundry service item details"}
									</DialogDescription>
								</div>
							</div>
						</DialogHeader>

						<div className="space-y-5">
							{/* Status & Category */}
							<div className="flex items-center gap-2">
								<Badge
									variant="outline"
									className="text-xs"
								>
									{categoryLabels[item.category] || item.category}
								</Badge>
								{item.active ? (
									<Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
										Active
									</Badge>
								) : (
									<Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs">
										Inactive
									</Badge>
								)}
							</div>

							<Separator />

							{/* Service Pricing */}
							<div>
								<h3 className="text-sm font-semibold mb-3">Service Pricing</h3>
								{servicePrices.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No prices configured
									</p>
								) : (
									<div className="grid grid-cols-2 gap-2">
										{servicePrices.map((service) => (
											<div
												key={service.label}
												className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2"
											>
												<span className="text-sm text-muted-foreground">
													{service.label}
												</span>
												<span className="text-sm font-semibold text-green-600">
													{formatCurrency(service.price!)}
												</span>
											</div>
										))}
									</div>
								)}
							</div>

							<Separator />

							{/* Urgency Multipliers */}
							<div>
								<h3 className="text-sm font-semibold mb-3">
									Urgency Multipliers
								</h3>
								<div className="grid grid-cols-3 gap-2">
									<div className="bg-amber-50 rounded-lg px-3 py-2 text-center">
										<p className="text-[11px] text-amber-700">Express</p>
										<p className="text-lg font-bold text-amber-800">
											{item.expressMultiplier || 1.5}x
										</p>
										<p className="text-[10px] text-amber-600">12-24 hours</p>
									</div>
									<div className="bg-orange-50 rounded-lg px-3 py-2 text-center">
										<p className="text-[11px] text-orange-700">Same Day</p>
										<p className="text-lg font-bold text-orange-800">
											{item.sameDayMultiplier || 2.0}x
										</p>
										<p className="text-[10px] text-orange-600">6-12 hours</p>
									</div>
									<div className="bg-red-50 rounded-lg px-3 py-2 text-center">
										<p className="text-[11px] text-red-700">Urgent</p>
										<p className="text-lg font-bold text-red-800">
											{item.urgentMultiplier || 3.0}x
										</p>
										<p className="text-[10px] text-red-600">3-6 hours</p>
									</div>
								</div>
							</div>

							{/* Special Instructions */}
							{item.specialInstructions && (
								<>
									<Separator />
									<div>
										<h3 className="text-sm font-semibold mb-2">
											Special Instructions
										</h3>
										<p className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
											{item.specialInstructions}
										</p>
									</div>
								</>
							)}

							<Separator />

							{/* Actions */}
							<div className="flex justify-between">
								<LaundryItemDialog
									editItem={item}
									trigger={
										<Button variant="outline" size="sm">
											Edit Item
										</Button>
									}
									onSuccess={() => {
										refetch();
									}}
								/>
								{item.active && (
									<Button
										variant="outline"
										size="sm"
										className="text-red-600 hover:text-red-700 hover:bg-red-50"
										disabled={deactivateMutation.isPending}
										onClick={() => deactivateMutation.mutate()}
									>
										{deactivateMutation.isPending ? (
											<Loader2Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
										) : (
											<TrashIcon className="w-3.5 h-3.5 mr-1.5" />
										)}
										Deactivate
									</Button>
								)}
							</div>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
