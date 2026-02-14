"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendToMaintenance } from "@/lib/rental-actions";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	WrenchIcon,
	SearchIcon,
	PackageIcon,
	ArrowLeftIcon,
	Loader2Icon,
	CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

type MaintenanceLog = {
	id: string;
	hotelId: string;
	rentalItem: {
		id: string;
		name: string;
		category: string;
		totalQuantity: number;
		availableQuantity: number;
		maintenanceQuantity: number;
	};
	type: string;
	quantity: number;
	reason: string;
	notes: string;
	performedBy: string;
	expectedCompletionDate: string;
	actualCompletionDate: string;
	availableQuantityBefore: number;
	maintenanceQuantityBefore: number;
	availableQuantityAfter: number;
	maintenanceQuantityAfter: number;
	createdAt: string;
};

type RentalMaintenancePageProps = {
	pendingMaintenance: MaintenanceLog[];
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const typeLabels: Record<string, string> = {
	SENT_TO_MAINTENANCE: "Sent to Maintenance",
	RETURNED_FROM_MAINTENANCE: "Returned from Maintenance",
	WRITE_OFF: "Written Off",
	CONDITION_UPDATE: "Condition Update",
};

const typeColors: Record<string, string> = {
	SENT_TO_MAINTENANCE: "bg-yellow-100 text-yellow-800",
	RETURNED_FROM_MAINTENANCE: "bg-green-100 text-green-800",
	WRITE_OFF: "bg-red-100 text-red-800",
	CONDITION_UPDATE: "bg-blue-100 text-blue-800",
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

export function RentalMaintenancePage({
	pendingMaintenance,
	breadcrumbs,
}: RentalMaintenancePageProps) {
	const [search, setSearch] = useState("");
	const [returnDialogOpen, setReturnDialogOpen] = useState(false);
	const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(
		null,
	);

	const filtered = pendingMaintenance.filter(
		(log) =>
			log.rentalItem?.name
				?.toLowerCase()
				.includes(search.toLowerCase()) ||
			log.reason?.toLowerCase().includes(search.toLowerCase()),
	);

	const totalInMaintenance = pendingMaintenance.reduce(
		(sum, log) => sum + log.quantity,
		0,
	);
	const uniqueItems = new Set(
		pendingMaintenance.map((log) => log.rentalItem?.id),
	).size;

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Maintenance
					</h1>
					<p className="text-muted-foreground mt-1">
						Track items currently in maintenance and return them to
						inventory
					</p>
				</div>

				{/* Summary */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardContent className="pt-6">
							<p className="text-sm text-muted-foreground">
								Pending Records
							</p>
							<p className="text-2xl font-bold mt-1">
								{pendingMaintenance.length}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<p className="text-sm text-muted-foreground">
								Total Units in Maintenance
							</p>
							<p className="text-2xl font-bold text-yellow-600 mt-1">
								{totalInMaintenance}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<p className="text-sm text-muted-foreground">
								Unique Items Affected
							</p>
							<p className="text-2xl font-bold text-blue-600 mt-1">
								{uniqueItems}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Maintenance Table */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<WrenchIcon className="w-5 h-5 text-yellow-600" />
								<CardTitle className="text-lg">
									Pending Maintenance
								</CardTitle>
							</div>
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search items or reason..."
									className="pl-10 w-64"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{filtered.length === 0 ? (
							<div className="text-center py-12 text-muted-foreground">
								<WrenchIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
								<p>No items currently in maintenance</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Item</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Type</TableHead>
											<TableHead className="text-center">
												Qty
											</TableHead>
											<TableHead>Reason</TableHead>
											<TableHead>Sent Date</TableHead>
											<TableHead>Expected Completion</TableHead>
											<TableHead></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filtered.map((log) => (
											<TableRow
												key={log.id}
												className="hover:bg-muted/50"
											>
												<TableCell>
													<div className="flex items-center gap-2">
														<PackageIcon className="w-4 h-4 text-muted-foreground" />
														<span className="font-medium">
															{log.rentalItem?.name}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="text-xs">
														{categoryLabels[
															log.rentalItem?.category
														] || log.rentalItem?.category}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														className={
															typeColors[log.type] ||
															"bg-gray-100 text-gray-800"
														}
													>
														{typeLabels[log.type] ||
															log.type?.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-center font-medium">
													{log.quantity}
												</TableCell>
												<TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
													{log.reason || "-"}
												</TableCell>
												<TableCell className="text-sm">
													{new Date(
														log.createdAt,
													).toLocaleDateString()}
												</TableCell>
												<TableCell className="text-sm">
													{log.expectedCompletionDate
														? new Date(
																log.expectedCompletionDate,
															).toLocaleDateString()
														: "-"}
												</TableCell>
												<TableCell>
													{log.type ===
														"SENT_TO_MAINTENANCE" && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setSelectedLog(log);
																setReturnDialogOpen(true);
															}}
														>
															<ArrowLeftIcon className="w-3 h-3 mr-1" />
															Return
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<ReturnFromMaintenanceDialog
				log={selectedLog}
				open={returnDialogOpen}
				onOpenChange={setReturnDialogOpen}
			/>
		</BreadCrumbWrapper>
	);
}

type ReturnFromMaintenanceDialogProps = {
	log: MaintenanceLog | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function ReturnFromMaintenanceDialog({
	log,
	open,
	onOpenChange,
}: ReturnFromMaintenanceDialogProps) {
	const queryClient = useQueryClient();
	const [quantity, setQuantity] = useState(1);
	const [reason, setReason] = useState("");
	const [notes, setNotes] = useState("");

	const mutation = useMutation({
		mutationFn: async () => {
			const result = await sendToMaintenance(log!.rentalItem.id, {
				action: "RETURN_FROM_MAINTENANCE",
				quantity,
				reason: reason || undefined,
				notes: notes || undefined,
			});
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success("Item returned from maintenance");
			queryClient.invalidateQueries({
				queryKey: ["rentals", "maintenance"],
			});
			queryClient.invalidateQueries({
				queryKey: ["rentals", "items"],
			});
			onOpenChange(false);
			setQuantity(1);
			setReason("");
			setNotes("");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to return from maintenance");
		},
	});

	if (!log) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Return from Maintenance</DialogTitle>
					<DialogDescription>
						Return {log.rentalItem?.name} back to available
						inventory
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="bg-muted/50 rounded-lg p-3 text-sm">
						<p>
							<span className="text-muted-foreground">
								Item:
							</span>{" "}
							<span className="font-medium">
								{log.rentalItem?.name}
							</span>
						</p>
						<p>
							<span className="text-muted-foreground">
								In Maintenance:
							</span>{" "}
							<span className="font-medium">
								{log.quantity} units
							</span>
						</p>
					</div>

					<div className="space-y-2">
						<Label>Quantity to Return</Label>
						<Input
							type="number"
							min={1}
							max={log.quantity}
							value={quantity}
							onChange={(e) =>
								setQuantity(parseInt(e.target.value) || 1)
							}
						/>
					</div>

					<div className="space-y-2">
						<Label>Reason</Label>
						<Input
							placeholder="e.g. Repair completed"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>Notes (optional)</Label>
						<Textarea
							placeholder="Additional notes..."
							className="min-h-[60px]"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={mutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							disabled={mutation.isPending}
						>
							{mutation.isPending && (
								<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
							)}
							Return to Inventory
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
