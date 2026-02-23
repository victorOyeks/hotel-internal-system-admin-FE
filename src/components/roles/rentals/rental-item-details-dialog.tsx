"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getRentalItemDetails,
	getRentalItemMaintenanceHistory,
	sendToMaintenance,
	updateRentalItem,
} from "@/lib/rental-actions";
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
	Loader2Icon,
	SendIcon,
} from "lucide-react";
import { toast } from "sonner";

type RentalItemDetailsDialogProps = {
	itemId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type RestockHistoryRecord = {
	id: string;
	quantity: number;
	note?: string;
	createdAt: string;
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

function isFaultyMaintenanceEntry(entry: any) {
	const values = [
		entry?.type,
		entry?.action,
		entry?.status,
		entry?.maintenanceResultStatus,
		entry?.resultStatus,
		entry?.condition,
	]
		.filter(Boolean)
		.map((value) => String(value).toUpperCase());
	const byStatus = values.some(
		(value) =>
			value.includes("WRITE_OFF") ||
			value.includes("FAULTY") ||
			value.includes("BAD") ||
			value.includes("DAMAGED") ||
			value.includes("OUT_OF_SERVICE"),
	);
	if (byStatus) return true;
	const text = `${String(entry?.reason || "")} ${String(entry?.notes || "")}`.toLowerCase();
	return (
		text.includes("cannot be fixed") ||
		text.includes("can't be fixed") ||
		text.includes("not fixable") ||
		text.includes("irreparable") ||
		text.includes("faulty") ||
		text.includes("damaged") ||
		text.includes("bad")
	);
}

export function RentalItemDetailsDialog({
	itemId,
	open,
	onOpenChange,
}: RentalItemDetailsDialogProps) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
	const [maintenanceQty, setMaintenanceQty] = useState(1);
	const [maintenanceReason, setMaintenanceReason] = useState("");
	const [maintenanceNotes, setMaintenanceNotes] = useState("");
	const [showRestockForm, setShowRestockForm] = useState(false);
	const [restockQty, setRestockQty] = useState(1);
	const [restockNotes, setRestockNotes] = useState("");
	const [localRestockHistory, setLocalRestockHistory] = useState<RestockHistoryRecord[]>(
		[],
	);

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
			queryClient.invalidateQueries({ queryKey: ["rentals", "items"] });
			queryClient.invalidateQueries({ queryKey: ["rentals", "maintenance"] });
			queryClient.invalidateQueries({
				queryKey: ["rentals", "maintenance", "pending"],
			});
			queryClient.invalidateQueries({
				queryKey: ["rentals", "dashboard-stats"],
			});
			router.refresh();
			setShowMaintenanceForm(false);
			setMaintenanceQty(1);
			setMaintenanceReason("");
			setMaintenanceNotes("");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to send to maintenance");
		},
	});

	const restockMutation = useMutation({
		mutationFn: async () => {
			if (!itemId || !item) {
				throw new Error("Item not available for restock");
			}
			if (restockQty < 1) {
				throw new Error("Restock quantity must be at least 1");
			}
			const payload = {
				name: item.name,
				description: item.description || "",
				category: item.category,
				condition: item.condition || "GOOD",
				pricingType: item.pricingType || "DAILY",
				brand: item.brand || "",
				model: item.model || "",
				serialNumber: item.serialNumber || "",
				hourlyRate: item.hourlyRate ?? 0,
				dailyRate: item.dailyRate ?? 0,
				weeklyRate: item.weeklyRate ?? 0,
				monthlyRate: item.monthlyRate ?? 0,
				flatRate: item.flatRate ?? 0,
				depositAmount: item.depositAmount ?? 0,
				totalQuantity: Math.max(0, Number(item.totalQuantity ?? 0)) + restockQty,
				replacementValue: item.replacementValue ?? 0,
				lateReturnPenaltyPerHour: item.lateReturnPenaltyPerHour ?? 0,
				lateReturnPenaltyPerDay: item.lateReturnPenaltyPerDay ?? 0,
				size: item.size || "",
				color: item.color || "",
				specifications: item.specifications || "",
				usageInstructions: item.usageInstructions || "",
				safetyInstructions: item.safetyInstructions || "",
				requiresDeposit: Boolean(item.requiresDeposit),
				requiresIdentification: Boolean(item.requiresIdentification),
				requiresSignedAgreement: Boolean(item.requiresSignedAgreement),
				minimumAge: item.minimumAge ?? 0,
				active: item.active !== false,
			};

			const result = await updateRentalItem(itemId, payload);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			const applyRestockUpdate = (entry: Record<string, unknown>) => ({
				...entry,
				totalQuantity: Math.max(0, Number(entry?.totalQuantity ?? 0)) + restockQty,
				availableQuantity:
					Math.max(0, Number(entry?.availableQuantity ?? 0)) + restockQty,
			});

			queryClient.setQueryData(["rentals", "items", itemId], (prev: unknown) => {
				if (!prev || typeof prev !== "object") return prev;
				return applyRestockUpdate(prev as Record<string, unknown>);
			});

			queryClient.setQueryData(["rentals", "items"], (prev: unknown) => {
				if (!Array.isArray(prev)) return prev;
				return prev.map((entry) =>
					String((entry as Record<string, unknown>)?.id || "") === String(itemId)
						? applyRestockUpdate(entry as Record<string, unknown>)
						: entry,
				);
			});

			toast.success("Item restocked successfully");
			queryClient.invalidateQueries({ queryKey: ["rentals", "items", itemId] });
			queryClient.invalidateQueries({ queryKey: ["rentals", "items"] });
			queryClient.invalidateQueries({
				queryKey: ["rentals", "dashboard-stats"],
			});
			setShowRestockForm(false);
			setLocalRestockHistory((prev) => [
				{
					id: crypto.randomUUID(),
					quantity: restockQty,
					note: restockNotes || "Restock",
					createdAt: new Date().toISOString(),
				},
				...prev,
			].slice(0, 20));
			setRestockQty(1);
			setRestockNotes("");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to restock item");
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
			const result = await getRentalItemMaintenanceHistory(itemId!);
			if (!result.success) return [];
			return Array.isArray(result.data)
				? result.data
				: (result.data?.content ?? []);
		},
		enabled: !!itemId && open,
	});

	const cachedItems = (queryClient.getQueryData(["rentals", "items"]) || []) as Array<any>;
	const cachedItem = cachedItems.find((entry) => String(entry?.id || "") === String(itemId));
	const faultyFromCachedList = Math.max(
		0,
		Number(
			cachedItem?.faultyQuantity ??
				cachedItem?.writeOffQuantity ??
				cachedItem?.damagedQuantity ??
				cachedItem?.outOfServiceQuantity ??
				0,
		),
	);

	const faultyQuantityFromItem = Math.max(
		0,
		Number(
			item?.faultyQuantity ??
				item?.writeOffQuantity ??
				item?.damagedQuantity ??
				item?.outOfServiceQuantity ??
				0,
		),
	);
	const hasFaultyFieldFromApi =
		item?.faultyQuantity !== undefined ||
		item?.writeOffQuantity !== undefined ||
		item?.damagedQuantity !== undefined ||
		item?.outOfServiceQuantity !== undefined;
	const faultyFromHistory = Array.isArray(maintenanceHistory)
		? maintenanceHistory
				.filter((entry: any) => isFaultyMaintenanceEntry(entry))
				.reduce(
					(sum: number, entry: any) =>
						sum + Math.max(0, Number(entry?.quantity || 0)),
					0,
				)
		: 0;
	const effectiveFaultyQuantity = Math.max(
		faultyQuantityFromItem,
		faultyFromCachedList,
		faultyFromHistory,
	);
	const faultyDisplayValue =
		hasFaultyFieldFromApi || faultyFromHistory > 0
			? String(effectiveFaultyQuantity)
			: "0";
	const totalQuantity = Math.max(0, Number(item?.totalQuantity ?? 0));
	const rawMaintenanceQuantity = Math.max(0, Number(item?.maintenanceQuantity ?? 0));
	const rawRentedQuantity = Math.max(0, Number(item?.rentedQuantity ?? 0));
	const faultyQuantity = Math.max(0, Number(faultyDisplayValue || 0));
	const maintenanceQuantity = Math.min(
		rawMaintenanceQuantity,
		Math.max(0, totalQuantity - faultyQuantity),
	);
	const rentedQuantity = Math.min(
		rawRentedQuantity,
		Math.max(0, totalQuantity - maintenanceQuantity - faultyQuantity),
	);
	// Available must follow: total - rented - maintenance - faulty
	const availableQuantity = Math.max(
		0,
		totalQuantity - rentedQuantity - maintenanceQuantity - faultyQuantity,
	);
	const utilizationRate =
		totalQuantity > 0
			? ((totalQuantity - availableQuantity) / totalQuantity) * 100
			: 0;
	const restockHistoryRows = useMemo(() => {
		const fromMaintenance = Array.isArray(maintenanceHistory)
			? maintenanceHistory
					.filter((entry: any) => {
						const value = `${String(entry?.action || "")} ${String(entry?.type || "")} ${String(entry?.status || "")}`.toUpperCase();
						return value.includes("RESTOCK") || value.includes("STOCK_IN");
					})
					.map((entry: any) => ({
						id: String(entry?.id || crypto.randomUUID()),
						quantity: Math.max(0, Number(entry?.quantity ?? 0)),
						note: String(entry?.reason || entry?.notes || "Restock"),
						createdAt: String(entry?.createdAt || entry?.updatedAt || new Date().toISOString()),
					}))
			: [];

		const merged = [...localRestockHistory, ...fromMaintenance];
		const byId = new Map<string, RestockHistoryRecord>();
		for (const row of merged) byId.set(row.id, row);
		return Array.from(byId.values())
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			)
			.slice(0, 20);
	}, [localRestockHistory, maintenanceHistory]);

	if (!itemId) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[96vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
										availableQuantity > 0 ? (
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
								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
									<div className="border rounded-lg p-3 min-w-0">
										<p className="text-xs text-muted-foreground">Total</p>
										<p className="text-xl sm:text-2xl font-bold">{item.totalQuantity}</p>
									</div>
									<div className="border rounded-lg p-3 min-w-0">
										<p className="text-xs text-muted-foreground">Available</p>
										<p className="text-xl sm:text-2xl font-bold text-green-700">{availableQuantity}</p>
									</div>
									<div className="border rounded-lg p-3 min-w-0">
										<p className="text-xs text-muted-foreground">Rented</p>
										<p className="text-xl sm:text-2xl font-bold">{rentedQuantity}</p>
									</div>
									<div className="border rounded-lg p-3 min-w-0">
										<p className="text-xs text-muted-foreground">Maintenance</p>
										<p className="text-xl sm:text-2xl font-bold">{maintenanceQuantity}</p>
									</div>
									<div className="border rounded-lg p-3 min-w-0">
										<p className="text-xs text-muted-foreground">Faulty</p>
										<p className="text-xl sm:text-2xl font-bold text-red-700">
											{faultyDisplayValue}
										</p>
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
							<>
								<Separator />
								<div>
									<div className="flex items-center justify-between mb-2">
										<h3 className="text-sm font-semibold text-muted-foreground">
											Restock
										</h3>
										{!showRestockForm && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => setShowRestockForm(true)}
											>
												Restock Item
											</Button>
										)}
									</div>
									{showRestockForm && (
										<div className="bg-muted/40 border rounded-lg p-3 space-y-3">
											<div className="grid grid-cols-2 gap-3">
												<div className="space-y-1.5">
													<Label className="text-xs">Quantity to Add</Label>
													<Input
														type="number"
														min={1}
														value={restockQty}
														onChange={(e) =>
															setRestockQty(parseInt(e.target.value) || 1)
														}
													/>
												</div>
												<div className="space-y-1.5">
													<Label className="text-xs">Note (optional)</Label>
													<Input
														placeholder="e.g. New shipment"
														value={restockNotes}
														onChange={(e) => setRestockNotes(e.target.value)}
													/>
												</div>
											</div>
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setShowRestockForm(false)}
													disabled={restockMutation.isPending}
												>
													Cancel
												</Button>
												<Button
													size="sm"
													onClick={() => restockMutation.mutate()}
													disabled={restockMutation.isPending}
												>
													{restockMutation.isPending && (
														<Loader2Icon className="w-3 h-3 mr-1 animate-spin" />
													)}
													Confirm Restock
												</Button>
											</div>
										</div>
									)}
								</div>
							</>
							{restockHistoryRows.length > 0 && (
								<>
									<div>
										<h3 className="text-sm font-semibold text-muted-foreground mb-2">
											Restock History
										</h3>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Date</TableHead>
													<TableHead className="text-center">Qty Added</TableHead>
													<TableHead>Note</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{restockHistoryRows.map((row) => (
													<TableRow key={row.id}>
														<TableCell className="text-sm">
															{new Date(row.createdAt).toLocaleString()}
														</TableCell>
														<TableCell className="text-center font-medium">
															{row.quantity}
														</TableCell>
														<TableCell className="text-sm">
															{row.note || "-"}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</>
							)}

							{/* Maintenance Action */}
							{availableQuantity > 0 && (
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
															max={availableQuantity}
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

							{/* Additional Info */}
							{maintenanceHistory && maintenanceHistory.length > 0 && (
								<>
									<Separator />
									<div>
										<h3 className="text-sm font-semibold text-muted-foreground mb-2">
											Maintenance History
										</h3>
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
															{new Date(log.createdAt).toLocaleDateString()}
														</TableCell>
														<TableCell>
															<Badge variant="outline" className="text-xs font-normal">
																{log.action?.replace(/_/g, " ")}
															</Badge>
														</TableCell>
														<TableCell className="text-sm">{log.quantity}</TableCell>
														<TableCell className="text-sm">{log.reason || "-"}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</>
							)}

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
