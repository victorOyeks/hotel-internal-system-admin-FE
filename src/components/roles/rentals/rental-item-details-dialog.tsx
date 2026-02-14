"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRentalItemDetails, sendToMaintenance } from "@/lib/rental-actions";
import { $fetch } from "@/lib/fetch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	PackageIcon,
	DollarSignIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	InfoIcon,
	Loader2Icon,
	WrenchIcon,
	SendIcon,
} from "lucide-react";
import { toast } from "sonner";

type RentalItemDetailsDialogProps = {
	itemId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
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

const conditionLabels: Record<string, string> = {
	EXCELLENT: "Excellent",
	GOOD: "Good",
	FAIR: "Fair",
	POOR: "Poor",
	DAMAGED: "Damaged",
	OUT_OF_SERVICE: "Out of Service",
};

const conditionColors: Record<string, string> = {
	EXCELLENT: "bg-green-100 text-green-800 border-green-200",
	GOOD: "bg-blue-100 text-blue-800 border-blue-200",
	FAIR: "bg-yellow-100 text-yellow-800 border-yellow-200",
	POOR: "bg-orange-100 text-orange-800 border-orange-200",
	DAMAGED: "bg-red-100 text-red-800 border-red-200",
	OUT_OF_SERVICE: "bg-gray-100 text-gray-800 border-gray-200",
};

const pricingTypeLabels: Record<string, string> = {
	HOURLY: "Hourly",
	DAILY: "Daily",
	WEEKLY: "Weekly",
	MONTHLY: "Monthly",
	FLAT_RATE: "Flat Rate",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function RentalItemDetailsDialog({
	itemId,
	open,
	onOpenChange,
}: RentalItemDetailsDialogProps) {
	const queryClient = useQueryClient();
	const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
	const [maintenanceQty, setMaintenanceQty] = useState(1);
	const [maintenanceReason, setMaintenanceReason] = useState("");
	const [maintenanceNotes, setMaintenanceNotes] = useState("");

	const maintenanceMutation = useMutation({
		mutationFn: async () => {
			const result = await sendToMaintenance(itemId!, {
				action: "SEND_TO_MAINTENANCE",
				quantity: maintenanceQty,
				reason: maintenanceReason || undefined,
				notes: maintenanceNotes || undefined,
			});
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success("Item sent to maintenance");
			queryClient.invalidateQueries({ queryKey: ["rentals", "items", itemId] });
			queryClient.invalidateQueries({ queryKey: ["rentals", "maintenance"] });
			setShowMaintenanceForm(false);
			setMaintenanceQty(1);
			setMaintenanceReason("");
			setMaintenanceNotes("");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to send to maintenance");
		},
	});

	const { data: item, isLoading } = useQuery({
		queryKey: ["rentals", "items", itemId],
		queryFn: async () => {
			const result = await getRentalItemDetails(itemId!);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: !!itemId && open,
	});

	const { data: maintenanceHistory } = useQuery({
		queryKey: ["rentals", "items", itemId, "maintenance"],
		queryFn: async () => {
			// TODO: Add server action for maintenance history
			return [];
		},
		enabled: !!itemId && open,
	});

	if (!itemId) return null;

	const utilizationRate =
		item?.totalQuantity > 0
			? ((item.totalQuantity - item.availableQuantity) / item.totalQuantity) *
				100
			: 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
					</div>
				) : !item ? (
					<div className="text-center py-12 text-muted-foreground">
						Item not found
					</div>
				) : (
					<>
						<DialogHeader>
							<DialogTitle className="text-2xl font-bold flex items-center gap-2">
								<PackageIcon className="w-6 h-6 text-blue-600" />
								{item.name}
							</DialogTitle>
							<DialogDescription>
								Rental item details and availability
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-6">
							{/* Status Badges */}
							<div className="flex flex-wrap gap-3">
								<Badge
									className={
										item.availableQuantity > 0
											? "bg-green-100 text-green-800 border-green-200"
											: "bg-red-100 text-red-800 border-red-200"
									}
								>
									{item.availableQuantity > 0
										? "Available"
										: "Out of Stock"}
								</Badge>
								<Badge
									variant="outline"
									className="bg-purple-100 text-purple-800 border-purple-200"
								>
									{categoryLabels[item.category] || item.category}
								</Badge>
								<Badge
									className={
										conditionColors[item.condition] ||
										"bg-gray-100 text-gray-800"
									}
								>
									{conditionLabels[item.condition] || item.condition}
								</Badge>
								{item.pricingType && (
									<Badge variant="outline">
										{pricingTypeLabels[item.pricingType] || item.pricingType}{" "}
										Pricing
									</Badge>
								)}
								{!item.active && (
									<Badge className="bg-gray-100 text-gray-800 border-gray-200">
										Inactive
									</Badge>
								)}
							</div>

							{/* Item Details */}
							{(item.brand || item.model || item.serialNumber) && (
								<>
									<div className="grid grid-cols-3 gap-4">
										{item.brand && (
											<div>
												<p className="text-sm text-muted-foreground">
													Brand
												</p>
												<p className="font-medium">{item.brand}</p>
											</div>
										)}
										{item.model && (
											<div>
												<p className="text-sm text-muted-foreground">
													Model
												</p>
												<p className="font-medium">{item.model}</p>
											</div>
										)}
										{item.serialNumber && (
											<div>
												<p className="text-sm text-muted-foreground">
													Serial Number
												</p>
												<p className="font-medium">{item.serialNumber}</p>
											</div>
										)}
									</div>
									<Separator />
								</>
							)}

							{/* Pricing Information */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<DollarSignIcon className="w-5 h-5 text-green-600" />
									<h3 className="text-lg font-semibold">Pricing</h3>
								</div>
								<div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
									{item.hourlyRate > 0 && (
										<div>
											<p className="text-sm text-muted-foreground">
												Hourly Rate
											</p>
											<p className="text-xl font-bold text-green-600">
												{formatCurrency(item.hourlyRate)}
											</p>
											<p className="text-xs text-muted-foreground">
												per hour
											</p>
										</div>
									)}
									{item.dailyRate > 0 && (
										<div>
											<p className="text-sm text-muted-foreground">
												Daily Rate
											</p>
											<p className="text-xl font-bold text-green-600">
												{formatCurrency(item.dailyRate)}
											</p>
											<p className="text-xs text-muted-foreground">per day</p>
										</div>
									)}
									{item.weeklyRate > 0 && (
										<div>
											<p className="text-sm text-muted-foreground">
												Weekly Rate
											</p>
											<p className="text-xl font-bold text-green-600">
												{formatCurrency(item.weeklyRate)}
											</p>
											<p className="text-xs text-muted-foreground">
												per week
											</p>
										</div>
									)}
									{item.monthlyRate > 0 && (
										<div>
											<p className="text-sm text-muted-foreground">
												Monthly Rate
											</p>
											<p className="text-xl font-bold text-green-600">
												{formatCurrency(item.monthlyRate)}
											</p>
											<p className="text-xs text-muted-foreground">
												per month
											</p>
										</div>
									)}
									{item.flatRate > 0 && (
										<div>
											<p className="text-sm text-muted-foreground">
												Flat Rate
											</p>
											<p className="text-xl font-bold text-green-600">
												{formatCurrency(item.flatRate)}
											</p>
											<p className="text-xs text-muted-foreground">
												per rental
											</p>
										</div>
									)}
									<div>
										<p className="text-sm text-muted-foreground">
											Security Deposit
										</p>
										<p className="text-xl font-bold">
											{formatCurrency(item.depositAmount || 0)}
										</p>
										<p className="text-xs text-muted-foreground">
											refundable
										</p>
									</div>
								</div>
								{(item.lateReturnPenaltyPerHour > 0 ||
									item.lateReturnPenaltyPerDay > 0) && (
									<div className="mt-3 grid grid-cols-2 gap-4 bg-red-50 p-3 rounded-lg">
										{item.lateReturnPenaltyPerHour > 0 && (
											<div>
												<p className="text-xs text-red-700">
													Late Penalty / Hour
												</p>
												<p className="font-semibold text-red-800">
													{formatCurrency(item.lateReturnPenaltyPerHour)}
												</p>
											</div>
										)}
										{item.lateReturnPenaltyPerDay > 0 && (
											<div>
												<p className="text-xs text-red-700">
													Late Penalty / Day
												</p>
												<p className="font-semibold text-red-800">
													{formatCurrency(item.lateReturnPenaltyPerDay)}
												</p>
											</div>
										)}
									</div>
								)}
							</div>

							<Separator />

							{/* Inventory & Availability */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<PackageIcon className="w-5 h-5 text-blue-600" />
									<h3 className="text-lg font-semibold">
										Inventory & Availability
									</h3>
								</div>
								<div className="grid grid-cols-4 gap-4">
									<div className="bg-blue-50 p-4 rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<InfoIcon className="w-4 h-4 text-blue-600" />
											<p className="text-sm font-medium text-blue-900">
												Total
											</p>
										</div>
										<p className="text-3xl font-bold text-blue-600">
											{item.totalQuantity}
										</p>
									</div>
									<div className="bg-green-50 p-4 rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<TrendingUpIcon className="w-4 h-4 text-green-600" />
											<p className="text-sm font-medium text-green-900">
												Available
											</p>
										</div>
										<p className="text-3xl font-bold text-green-600">
											{item.availableQuantity}
										</p>
									</div>
									<div className="bg-orange-50 p-4 rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<TrendingDownIcon className="w-4 h-4 text-orange-600" />
											<p className="text-sm font-medium text-orange-900">
												Rented
											</p>
										</div>
										<p className="text-3xl font-bold text-orange-600">
											{item.rentedQuantity || 0}
										</p>
									</div>
									<div className="bg-yellow-50 p-4 rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<WrenchIcon className="w-4 h-4 text-yellow-600" />
											<p className="text-sm font-medium text-yellow-900">
												Maintenance
											</p>
										</div>
										<p className="text-3xl font-bold text-yellow-600">
											{item.maintenanceQuantity || 0}
										</p>
									</div>
								</div>
								<div className="mt-4">
									<div className="flex justify-between text-sm mb-2">
										<span className="text-muted-foreground">
											Utilization Rate
										</span>
										<span className="font-semibold">
											{utilizationRate.toFixed(1)}%
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2.5">
										<div
											className="bg-blue-600 h-2.5 rounded-full transition-all"
											style={{ width: `${utilizationRate}%` }}
										></div>
									</div>
								</div>
							</div>

							{/* Maintenance Action */}
							{item.availableQuantity > 0 && (
								<>
									<Separator />
									<div>
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2">
												<WrenchIcon className="w-5 h-5 text-yellow-600" />
												<h3 className="text-lg font-semibold">
													Maintenance
												</h3>
											</div>
											{!showMaintenanceForm && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setShowMaintenanceForm(true)
													}
												>
													<SendIcon className="w-3 h-3 mr-1" />
													Send to Maintenance
												</Button>
											)}
										</div>
										{showMaintenanceForm && (
											<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1.5">
														<Label className="text-sm">
															Quantity
														</Label>
														<Input
															type="number"
															min={1}
															max={item.availableQuantity}
															value={maintenanceQty}
															onChange={(e) =>
																setMaintenanceQty(
																	parseInt(e.target.value) || 1,
																)
															}
														/>
													</div>
													<div className="space-y-1.5">
														<Label className="text-sm">
															Reason
														</Label>
														<Input
															placeholder="e.g. Scheduled repair"
															value={maintenanceReason}
															onChange={(e) =>
																setMaintenanceReason(e.target.value)
															}
														/>
													</div>
												</div>
												<div className="space-y-1.5">
													<Label className="text-sm">
														Notes (optional)
													</Label>
													<Textarea
														placeholder="Additional details..."
														className="min-h-[50px]"
														value={maintenanceNotes}
														onChange={(e) =>
															setMaintenanceNotes(e.target.value)
														}
													/>
												</div>
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															setShowMaintenanceForm(false)
														}
														disabled={maintenanceMutation.isPending}
													>
														Cancel
													</Button>
													<Button
														size="sm"
														onClick={() =>
															maintenanceMutation.mutate()
														}
														disabled={maintenanceMutation.isPending}
													>
														{maintenanceMutation.isPending && (
															<Loader2Icon className="w-3 h-3 mr-1 animate-spin" />
														)}
														Confirm
													</Button>
												</div>
											</div>
										)}
									</div>
								</>
							)}

							{/* Requirements */}
							{(item.requiresDeposit ||
								item.requiresIdentification ||
								item.requiresSignedAgreement ||
								item.minimumAge > 0) && (
								<>
									<Separator />
									<div>
										<h3 className="text-lg font-semibold mb-3">
											Requirements
										</h3>
										<div className="flex flex-wrap gap-2">
											{item.requiresDeposit && (
												<Badge variant="outline">Requires Deposit</Badge>
											)}
											{item.requiresIdentification && (
												<Badge variant="outline">
													Requires ID
												</Badge>
											)}
											{item.requiresSignedAgreement && (
												<Badge variant="outline">
													Requires Agreement
												</Badge>
											)}
											{item.minimumAge > 0 && (
												<Badge variant="outline">
													Min Age: {item.minimumAge}
												</Badge>
											)}
										</div>
									</div>
								</>
							)}

							{/* Maintenance History */}
							{maintenanceHistory && maintenanceHistory.length > 0 && (
								<>
									<Separator />
									<div>
										<div className="flex items-center gap-2 mb-3">
											<WrenchIcon className="w-5 h-5 text-yellow-600" />
											<h3 className="text-lg font-semibold">
												Maintenance History
											</h3>
										</div>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Date</TableHead>
													<TableHead>Action</TableHead>
													<TableHead>Qty</TableHead>
													<TableHead>Reason</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{maintenanceHistory.map((log: any) => (
													<TableRow key={log.id}>
														<TableCell>
															{new Date(
																log.createdAt,
															).toLocaleDateString()}
														</TableCell>
														<TableCell>
															<Badge variant="outline">
																{log.action?.replace(/_/g, " ")}
															</Badge>
														</TableCell>
														<TableCell>{log.quantity}</TableCell>
														<TableCell className="text-sm">
															{log.reason || "-"}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</>
							)}

							{/* Additional Info */}
							{(item.usageInstructions ||
								item.safetyInstructions ||
								item.specifications) && (
								<>
									<Separator />
									<div className="space-y-3">
										{item.specifications && (
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													Specifications
												</p>
												<p className="text-sm">{item.specifications}</p>
											</div>
										)}
										{item.usageInstructions && (
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													Usage Instructions
												</p>
												<p className="text-sm">{item.usageInstructions}</p>
											</div>
										)}
										{item.safetyInstructions && (
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													Safety Instructions
												</p>
												<p className="text-sm">{item.safetyInstructions}</p>
											</div>
										)}
									</div>
								</>
							)}
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
