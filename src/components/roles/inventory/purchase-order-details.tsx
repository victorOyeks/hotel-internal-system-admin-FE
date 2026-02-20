"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePurchaseOrderStatus } from "@/lib/inventory-actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircleIcon, EditIcon, Loader2Icon, XCircleIcon } from "lucide-react";
import type { PurchaseOrderResponse } from "@/lib/fetch";
import type { PropsWithChildren } from "react";
import { formatDate } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface PurchaseOrderDetailsProps extends PropsWithChildren {
	order: PurchaseOrderResponse;
}

const statusColors: Record<string, string> = {
	DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
	PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
	APPROVED: "bg-green-100 text-green-800 border-green-200",
	REJECTED: "bg-red-100 text-red-800 border-red-200",
	SENT_TO_SUPPLIER: "bg-blue-100 text-blue-800 border-blue-200",
	PARTIALLY_RECEIVED: "bg-orange-100 text-orange-800 border-orange-200",
	FULLY_RECEIVED: "bg-teal-100 text-teal-800 border-teal-200",
	CANCELLED: "bg-gray-200 text-gray-700 border-gray-300",
	CLOSED: "bg-slate-100 text-slate-800 border-slate-200",
};

// Final statuses — no further changes allowed
const FINAL_STATUSES = ["FULLY_RECEIVED", "CANCELLED", "CLOSED"];

// All non-final statuses that can be selected as a target
const ALL_STATUSES = [
	"DRAFT",
	"PENDING_APPROVAL",
	"APPROVED",
	"REJECTED",
	"SENT_TO_SUPPLIER",
	"PARTIALLY_RECEIVED",
	"FULLY_RECEIVED",
	"CANCELLED",
	"CLOSED",
];

const statusLabels: Record<string, string> = {
	DRAFT: "Draft",
	PENDING_APPROVAL: "Pending Approval",
	APPROVED: "Approved",
	REJECTED: "Rejected",
	SENT_TO_SUPPLIER: "Sent to Supplier",
	PARTIALLY_RECEIVED: "Partially Received",
	FULLY_RECEIVED: "Fully Received",
	CANCELLED: "Cancelled",
	CLOSED: "Closed",
};

export function PurchaseOrderDetails({
	order,
	children,
}: PurchaseOrderDetailsProps) {
	const [isChangingStatus, setIsChangingStatus] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState("");
	const [statusNotes, setStatusNotes] = useState("");
	const [currentOrder, setCurrentOrder] = useState(order);

	const queryClient = useQueryClient();
	const router = useRouter();

	const isFinal = FINAL_STATUSES.includes(currentOrder.status);

	const statusMutation = useMutation({
		mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
			const result = await updatePurchaseOrderStatus(currentOrder.id, { status, notes });
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: (data) => {
			toast.success("Purchase order status updated successfully");
			if (data) setCurrentOrder(data as PurchaseOrderResponse);
			setIsChangingStatus(false);
			setSelectedStatus("");
			setStatusNotes("");
			queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
			router.refresh();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update status");
		},
	});

	if (!order) return null;

	// Available targets: all statuses except the current one
	const availableStatuses = ALL_STATUSES.filter((s) => s !== currentOrder.status);

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{currentOrder.poNumber}</DialogTitle>
					<DialogDescription>Purchase Order Details</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Status Section */}
					<div className="flex flex-wrap items-center gap-3">
						<Badge
							className={
								statusColors[currentOrder.status] ||
								"bg-gray-100 text-gray-800"
							}
						>
							{currentOrder.status.replace(/_/g, " ")}
						</Badge>

						{!isChangingStatus && (
							<Button
								variant="outline"
								size="sm"
								disabled={isFinal}
								onClick={() => {
									setSelectedStatus("");
									setIsChangingStatus(true);
								}}
							>
								<EditIcon className="w-3.5 h-3.5 mr-1.5" />
								Change Status
							</Button>
						)}
					</div>

					{/* Status Change Panel */}
					{isChangingStatus && (
						<div className="bg-muted/50 p-4 rounded-lg space-y-3">
							<p className="text-sm font-medium">Update Order Status</p>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-xs text-muted-foreground mb-1 block">
										New Status
									</label>
									<Select
										value={selectedStatus}
										onValueChange={setSelectedStatus}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											{availableStatuses.map((status) => (
												<SelectItem key={status} value={status}>
													{statusLabels[status]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="text-xs text-muted-foreground mb-1 block">
										Notes (optional)
									</label>
									<Input
										placeholder="Reason for status change..."
										value={statusNotes}
										onChange={(e) => setStatusNotes(e.target.value)}
									/>
								</div>
							</div>
							<div className="flex gap-2">
								<Button
									size="sm"
									disabled={!selectedStatus || statusMutation.isPending}
									onClick={() =>
										statusMutation.mutate({
											status: selectedStatus,
											notes: statusNotes || undefined,
										})
									}
								>
									{statusMutation.isPending && (
										<Loader2Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
									)}
									Update Status
								</Button>
								<Button
									variant="ghost"
									size="sm"
									disabled={statusMutation.isPending}
									onClick={() => {
										setIsChangingStatus(false);
										setSelectedStatus("");
										setStatusNotes("");
									}}
								>
									Cancel
								</Button>
							</div>
						</div>
					)}

					{/* Order Info */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Supplier</p>
							<p className="font-semibold">{currentOrder.supplierName}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Order Date</p>
							<p className="font-semibold">
								{new Date(currentOrder.orderDate).toLocaleDateString()}
							</p>
						</div>
						{currentOrder.expectedDeliveryDate && (
							<div>
								<p className="text-sm text-muted-foreground">Expected Delivery</p>
								<p className="font-semibold">
									{new Date(currentOrder.expectedDeliveryDate).toLocaleDateString()}
								</p>
							</div>
						)}
						<div>
							<p className="text-sm text-muted-foreground">Payment Terms</p>
							<p className="font-semibold">{currentOrder.paymentTerms || "N/A"}</p>
						</div>
					</div>

					<Separator />

					{/* Items */}
					<div>
						<h3 className="font-semibold mb-3">Order Items</h3>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>SKU</TableHead>
									<TableHead>Product</TableHead>
									<TableHead className="text-right">Quantity</TableHead>
									<TableHead className="text-right">Unit Price</TableHead>
									<TableHead className="text-right">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{currentOrder.items.map((item) => (
									<TableRow key={item.id}>
										<TableCell className="font-mono text-sm">
											{item.productSku}
										</TableCell>
										<TableCell>{item.productName}</TableCell>
										<TableCell className="text-right">
											{item.quantityOrdered} {item.unit}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(item.unitPrice)}
										</TableCell>
										<TableCell className="text-right font-semibold">
											{formatCurrency(item.lineTotal)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<Separator />

					{/* Totals */}
					<div className="space-y-2">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Subtotal:</span>
							<span className="font-semibold">
								{formatCurrency(currentOrder.subtotal)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Shipping:</span>
							<span className="font-semibold">
								{formatCurrency(currentOrder.shippingCost)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tax:</span>
							<span className="font-semibold">
								{formatCurrency(currentOrder.taxAmount)}
							</span>
						</div>
						<Separator />
						<div className="flex justify-between text-lg">
							<span className="font-bold">Total:</span>
							<span className="font-bold">
								{formatCurrency(currentOrder.totalAmount)}
							</span>
						</div>
					</div>

					{/* Approval Info */}
					{currentOrder.approvedBy && (
						<div className="bg-muted/50 p-4 rounded-lg">
							<p className="text-sm text-muted-foreground">Approved By</p>
							<p className="font-semibold">{currentOrder.approvedBy || "N/A"}</p>
							<p className="text-xs text-muted-foreground">
								{currentOrder.approvalDate &&
									formatDate(new Date(currentOrder.approvalDate), "dd-MM-yyyy")}
							</p>
						</div>
					)}

					{/* Rejection Info */}
					{currentOrder.rejectedBy && (
						<div className="bg-red-50 p-4 rounded-lg border border-red-200">
							<p className="text-sm text-muted-foreground text-red-700">Rejected By</p>
							<p className="font-semibold text-red-900">{currentOrder.rejectedBy}</p>
							{currentOrder.rejectionReason && (
								<p className="text-sm text-red-800 mt-1">
									Reason: {currentOrder.rejectionReason}
								</p>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
