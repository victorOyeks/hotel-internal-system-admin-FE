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
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
					</div>
				) : !item ? (
					<div className="text-center py-12 text-muted-foreground">
						Item not found
					</div>
				) : (
					<>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<div>
									<DialogTitle className="text-xl font-semibold">
										{item.name}
									</DialogTitle>
									<DialogDescription className="mt-0.5">
										{categoryLabels[item.category] || item.category}
										{item.pricingType && ` · ${pricingTypeLabels[item.pricingType] || item.pricingType} pricing`}
									</DialogDescription>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="outline" className="text-xs">
										{conditionLabels[item.condition] || item.condition}
									</Badge>
									{item.active ? (
										item.availableQuantity > 0 ? (
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
								</div>
							</div>
						</DialogHeader>

						<div className="space-y-5 mt-1">
							{/* Item Details */}
							{(item.brand || item.model || item.serialNumber) && (
								<div className="grid grid-cols-3 gap-4 text-sm">
									{item.brand && (
										<div>
											<p className="text-muted-foreground text-xs">Brand</p>
											<p className="font-medium">{item.brand}</p>
										</div>
									)}
									{item.model && (
										<div>
											<p className="text-muted-foreground text-xs">Model</p>
											<p className="font-medium">{item.model}</p>
										</div>
									)}
									{item.serialNumber && (
										<div>
											<p className="text-muted-foreground text-xs">Serial Number</p>
											<p className="font-medium">{item.serialNumber}</p>
										</div>
									)}
								</div>
							)}

							{/* Pricing Information */}
							<div>
								<h3 className="text-sm font-semibold text-muted-foreground mb-2">Pricing</h3>
								<div className="grid grid-cols-3 gap-3 bg-muted/40 p-3 rounded-lg">
									{item.hourlyRate > 0 && (
										<div>
											<p className="text-xs text-muted-foreground">Hourly</p>
											<p className="text-base font-semibold text-green-700">
												{formatCurrency(item.hourlyRate)}
											</p>
										</div>
									)}
									{item.dailyRate > 0 && (
										<div>
											<p className="text-xs text-muted-foreground">Daily</p>
											<p className="text-base font-semibold text-green-700">
												{formatCurrency(item.dailyRate)}
											</p>
										</div>
									)}
									{item.weeklyRate > 0 && (
										<div>
											<p className="text-xs text-muted-foreground">Weekly</p>
											<p className="text-base font-semibold text-green-700">
												{formatCurrency(item.weeklyRate)}
											</p>
										</div>
									)}
									{item.monthlyRate > 0 && (
										<div>
											<p className="text-xs text-muted-foreground">Monthly</p>
											<p className="text-base font-semibold text-green-700">
												{formatCurrency(item.monthlyRate)}
											</p>
										</div>
									)}
									{item.flatRate > 0 && (
										<div>
											<p className="text-xs text-muted-foreground">Flat Rate</p>
											<p className="text-base font-semibold text-green-700">
												{formatCurrency(item.flatRate)}
											</p>
										</div>
									)}
									<div>
										<p className="text-xs text-muted-foreground">Deposit</p>
										<p className="text-base font-semibold">
											{formatCurrency(item.depositAmount || 0)}
										</p>
									</div>
								</div>
								{(item.lateReturnPenaltyPerHour > 0 ||
									item.lateReturnPenaltyPerDay > 0) && (
									<div className="mt-2 flex gap-4 text-sm">
										{item.lateReturnPenaltyPerHour > 0 && (
											<p className="text-muted-foreground">
												Late penalty: <span className="font-medium text-orange-600">{formatCurrency(item.lateReturnPenaltyPerHour)}/hr</span>
											</p>
										)}
										{item.lateReturnPenaltyPerDay > 0 && (
											<p className="text-muted-foreground">
												Late penalty: <span className="font-medium text-orange-600">{formatCurrency(item.lateReturnPenaltyPerDay)}/day</span>
											</p>
										)}
									</div>
								)}
							</div>

							<Separator />

							{/* Inventory & Availability */}
							<div>
								<h3 className="text-sm font-semibold text-muted-foreground mb-2">Inventory</h3>
								<div className="grid grid-cols-4 gap-3">
									<div className="border rounded-lg p-3">
										<p className="text-xs text-muted-foreground">Total</p>
										<p className="text-2xl font-bold">{item.totalQuantity}</p>
									</div>
									<div className="border rounded-lg p-3">
										<p className="text-xs text-muted-foreground">Available</p>
										<p className="text-2xl font-bold text-green-700">{item.availableQuantity}</p>
									</div>
									<div className="border rounded-lg p-3">
										<p className="text-xs text-muted-foreground">Rented</p>
										<p className="text-2xl font-bold">{item.rentedQuantity || 0}</p>
									</div>
									<div className="border rounded-lg p-3">
										<p className="text-xs text-muted-foreground">Maintenance</p>
										<p className="text-2xl font-bold">{item.maintenanceQuantity || 0}</p>
									</div>
								</div>
								<div className="mt-3">
									<div className="flex justify-between text-xs mb-1.5">
										<span className="text-muted-foreground">Utilization</span>
										<span className="font-medium">{utilizationRate.toFixed(1)}%</span>
									</div>
									<div className="w-full bg-muted rounded-full h-1.5">
										<div
											className="bg-blue-500 h-1.5 rounded-full transition-all"
											style={{ width: `${utilizationRate}%` }}
										/>
									</div>
								</div>
							</div>

							{/* Maintenance Action */}
							{item.availableQuantity > 0 && (
								<>
									<Separator />
									<div>
										<div className="flex items-center justify-between mb-2">
											<h3 className="text-sm font-semibold text-muted-foreground">Maintenance</h3>
											{!showMaintenanceForm && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => setShowMaintenanceForm(true)}
												>
													<SendIcon className="w-3 h-3 mr-1" />
													Send to Maintenance
												</Button>
											)}
										</div>
										{showMaintenanceForm && (
											<div className="bg-muted/40 border rounded-lg p-3 space-y-3">
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1.5">
														<Label className="text-xs">Quantity</Label>
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
														<Label className="text-xs">Reason</Label>
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
													<Label className="text-xs">Notes (optional)</Label>
													<Textarea
														placeholder="Additional details..."
														className="min-h-[50px] resize-none"
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
										<h3 className="text-sm font-semibold text-muted-foreground mb-2">Requirements</h3>
										<div className="flex flex-wrap gap-2">
											{item.requiresDeposit && (
												<Badge variant="outline" className="text-xs font-normal">Requires Deposit</Badge>
											)}
											{item.requiresIdentification && (
												<Badge variant="outline" className="text-xs font-normal">Requires ID</Badge>
											)}
											{item.requiresSignedAgreement && (
												<Badge variant="outline" className="text-xs font-normal">Requires Agreement</Badge>
											)}
											{item.minimumAge > 0 && (
												<Badge variant="outline" className="text-xs font-normal">Min Age: {item.minimumAge}</Badge>
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
										<h3 className="text-sm font-semibold text-muted-foreground mb-2">Maintenance History</h3>
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
														<TableCell className="text-sm">
															{new Date(
																log.createdAt,
															).toLocaleDateString()}
														</TableCell>
														<TableCell>
															<Badge variant="outline" className="text-xs font-normal">
																{log.action?.replace(/_/g, " ")}
															</Badge>
														</TableCell>
														<TableCell className="text-sm">{log.quantity}</TableCell>
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
