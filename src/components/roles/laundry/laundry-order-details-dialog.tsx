"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getLaundryOrderDetails,
	getLaundryPaymentSummary,
	updateLaundryOrderStatus,
} from "@/lib/laundry-actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
	UserIcon,
	PhoneIcon,
	MailIcon,
	DollarSignIcon,
	ShirtIcon,
	Loader2Icon,
	AlertCircleIcon,
	RefreshCwIcon,
	EditIcon,
	ClockIcon,
	DoorOpenIcon,
} from "lucide-react";

type LaundryOrderDetailsDialogProps = {
	orderId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const statusColors: Record<string, string> = {
	PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
	PICKED_UP: "bg-cyan-100 text-cyan-800 border-cyan-200",
	IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
	READY: "bg-teal-100 text-teal-800 border-teal-200",
	DELIVERED: "bg-green-100 text-green-800 border-green-200",
	CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
};

const urgencyColors: Record<string, string> = {
	STANDARD: "bg-green-50 text-green-700 border-green-200",
	EXPRESS: "bg-amber-50 text-amber-700 border-amber-200",
	SAME_DAY: "bg-orange-50 text-orange-700 border-orange-200",
	URGENT: "bg-red-50 text-red-700 border-red-200",
};

const paymentStatusColors: Record<string, string> = {
	UNPAID: "bg-red-100 text-red-800 border-red-200",
	PARTIALLY_PAID: "bg-orange-100 text-orange-800 border-orange-200",
	PAID: "bg-green-100 text-green-800 border-green-200",
	CHARGED_TO_ROOM: "bg-sky-100 text-sky-800 border-sky-200",
	COMPLIMENTARY: "bg-purple-100 text-purple-800 border-purple-200",
	REFUNDED: "bg-violet-100 text-violet-800 border-violet-200",
};

const ALL_STATUSES = [
	"PENDING", "PICKED_UP", "IN_PROGRESS", "READY",
	"DELIVERED", "CANCELLED",
] as const;

const TERMINAL_STATUSES = new Set(["DELIVERED", "CANCELLED"]);

const getValidTransitions = (currentStatus: string): string[] => {
	if (TERMINAL_STATUSES.has(currentStatus)) return [];
	return ALL_STATUSES.filter((s) => s !== currentStatus);
};

const transitionLabels: Record<string, string> = {
	PENDING: "Set Pending",
	PICKED_UP: "Mark Picked Up",
	IN_PROGRESS: "Start Processing",
	READY: "Mark Ready",
	DELIVERED: "Mark Delivered",
	CANCELLED: "Cancel Order",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function LaundryOrderDetailsDialog({
	orderId,
	open,
	onOpenChange,
}: LaundryOrderDetailsDialogProps) {
	const [isChangingStatus, setIsChangingStatus] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState("");
	const [statusNotes, setStatusNotes] = useState("");
	const queryClient = useQueryClient();
	const router = useRouter();

	const {
		data: order,
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery({
		queryKey: ["laundry", "orders", orderId],
		queryFn: async () => {
			const result = await getLaundryOrderDetails(orderId!);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: !!orderId && open,
		retry: 1,
	});

	const { data: paymentSummary } = useQuery({
		queryKey: ["laundry", "orders", orderId, "payment-summary"],
		queryFn: async () => {
			const result = await getLaundryPaymentSummary(orderId!);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: !!orderId && open && !!order,
		retry: 1,
	});

	const statusMutation = useMutation({
		mutationFn: async ({
			status,
			notes,
		}: {
			status: string;
			notes?: string;
		}) => {
			const result = await updateLaundryOrderStatus(orderId!, {
				status,
				notes,
			});
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success("Order status updated successfully");
			setIsChangingStatus(false);
			setSelectedStatus("");
			setStatusNotes("");
			queryClient.invalidateQueries({ queryKey: ["laundry", "orders"] });
			queryClient.invalidateQueries({
				queryKey: ["laundry", "dashboard-stats"],
			});
			router.refresh();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update status");
		},
	});

	if (!orderId) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
						<p className="text-sm text-muted-foreground">
							Loading order details...
						</p>
					</div>
				) : isError ? (
					<div className="flex flex-col items-center justify-center py-12 gap-4">
						<AlertCircleIcon className="w-10 h-10 text-red-400" />
						<div className="text-center">
							<p className="font-medium text-red-600">
								Failed to load order
							</p>
							<p className="text-sm text-muted-foreground mt-1">
								{error?.message || "Something went wrong."}
							</p>
						</div>
						<Button variant="outline" size="sm" onClick={() => refetch()}>
							<RefreshCwIcon className="w-4 h-4 mr-2" />
							Try Again
						</Button>
					</div>
				) : !order ? (
					<div className="text-center py-12 text-muted-foreground">
						Order not found
					</div>
				) : (
					<>
						<DialogHeader>
							<DialogTitle className="text-2xl font-bold">
								{order.orderNumber}
							</DialogTitle>
							<DialogDescription>
								Laundry order details and tracking
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-6">
							{/* Status Badges */}
							<div className="flex flex-wrap items-center gap-2">
								<Badge
									className={
										statusColors[order.status] ||
										"bg-gray-100 text-gray-800"
									}
								>
									{order.status?.replace(/_/g, " ")}
								</Badge>
								<Badge
									className={
										urgencyColors[order.urgency] ||
										"bg-gray-100 text-gray-800"
									}
								>
									{order.urgency}
								</Badge>
								<Badge
									className={
										paymentStatusColors[order.paymentStatus] ||
										"bg-gray-100 text-gray-800"
									}
								>
									{order.paymentStatus?.replace(/_/g, " ")}
								</Badge>
								{order.hasIssues && (
									<Badge className="bg-red-100 text-red-800 border-red-200">
										<AlertCircleIcon className="w-3 h-3 mr-1" />
										Issues
									</Badge>
								)}
								{!isChangingStatus && (
									<Button
										variant="outline"
										size="sm"
										disabled={
											!(getValidTransitions(order.status).length > 0)
										}
										onClick={() => {
											setSelectedStatus("");
											setIsChangingStatus(true);
										}}
									>
										<EditIcon className="w-3.5 h-3.5 mr-1.5" />
										Update Status
									</Button>
								)}
							</div>

							{/* Status Change Form */}
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
													{getValidTransitions(order.status).map(
														(status) => (
															<SelectItem key={status} value={status}>
																{transitionLabels[status] || status}
															</SelectItem>
														),
													)}
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
											disabled={
												!selectedStatus ||
												statusMutation.isPending
											}
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

							<Separator />

							{/* Customer Information */}
							<div>
								<h3 className="text-lg font-semibold mb-3">
									Customer Information
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-2">
										<UserIcon className="w-4 h-4 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">
												Customer Name
											</p>
											<p className="font-medium">{order.customerName}</p>
										</div>
									</div>
									{order.customerPhone && (
										<div className="flex items-center gap-2">
											<PhoneIcon className="w-4 h-4 text-muted-foreground" />
											<div>
												<p className="text-sm text-muted-foreground">
													Phone
												</p>
												<p className="font-medium">{order.customerPhone}</p>
											</div>
										</div>
									)}
									{order.customerEmail && (
										<div className="flex items-center gap-2">
											<MailIcon className="w-4 h-4 text-muted-foreground" />
											<div>
												<p className="text-sm text-muted-foreground">
													Email
												</p>
												<p className="font-medium">{order.customerEmail}</p>
											</div>
										</div>
									)}
									{order.roomIdentifier && (
										<div className="flex items-center gap-2">
											<DoorOpenIcon className="w-4 h-4 text-muted-foreground" />
											<div>
												<p className="text-sm text-muted-foreground">
													Room
												</p>
												<p className="font-medium">
													Room {order.roomIdentifier}
												</p>
											</div>
										</div>
									)}
								</div>
							</div>

							<Separator />

							{/* Delivery Timeline */}
							{(order.pickupRequestedTime ||
								order.expectedDeliveryTime ||
								order.actualPickupTime ||
								order.actualDeliveryTime) && (
								<>
									<div>
										<h3 className="text-lg font-semibold mb-3">
											Timeline
										</h3>
										<div className="grid grid-cols-2 gap-4">
											{order.actualPickupTime && (
												<div className="flex items-center gap-2">
													<ClockIcon className="w-4 h-4 text-muted-foreground" />
													<div>
														<p className="text-sm text-muted-foreground">
															Picked Up
														</p>
														<p className="font-medium">
															{new Date(
																order.actualPickupTime,
															).toLocaleString()}
														</p>
													</div>
												</div>
											)}
											{order.expectedDeliveryTime && (
												<div className="flex items-center gap-2">
													<ClockIcon className="w-4 h-4 text-muted-foreground" />
													<div>
														<p className="text-sm text-muted-foreground">
															Expected Delivery
														</p>
														<p className="font-medium">
															{new Date(
																order.expectedDeliveryTime,
															).toLocaleString()}
														</p>
													</div>
												</div>
											)}
											{order.actualDeliveryTime && (
												<div className="flex items-center gap-2">
													<ClockIcon className="w-4 h-4 text-green-600" />
													<div>
														<p className="text-sm text-muted-foreground">
															Delivered
														</p>
														<p className="font-medium text-green-600">
															{new Date(
																order.actualDeliveryTime,
															).toLocaleString()}
														</p>
													</div>
												</div>
											)}
										</div>
									</div>
									<Separator />
								</>
							)}

							{/* Order Items */}
							{order.items && order.items.length > 0 && (
								<>
									<div>
										<div className="flex items-center gap-2 mb-3">
											<ShirtIcon className="w-5 h-5 text-blue-600" />
											<h3 className="text-lg font-semibold">
												Laundry Items ({order.totalItemsCount})
											</h3>
										</div>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Item</TableHead>
													<TableHead>Service</TableHead>
													<TableHead className="text-center">Qty</TableHead>
													<TableHead className="text-right">
														Unit Price
													</TableHead>
													<TableHead className="text-right">Total</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{order.items.map((item: any) => (
													<TableRow key={item.id}>
														<TableCell>
															<div>
																<p className="font-medium">
																	{item.laundryItemName}
																</p>
																{item.itemColor && (
																	<p className="text-xs text-muted-foreground">
																		{item.itemColor}
																		{item.brandOrLabel &&
																			` - ${item.brandOrLabel}`}
																	</p>
																)}
																{item.damaged && (
																	<Badge className="mt-1 bg-red-100 text-red-800 text-xs">
																		Damaged
																	</Badge>
																)}
																{item.lost && (
																	<Badge className="mt-1 bg-red-200 text-red-900 text-xs">
																		Lost
																	</Badge>
																)}
															</div>
														</TableCell>
														<TableCell>
															<Badge variant="outline" className="text-xs">
																{item.serviceType?.replace(/_/g, " ")}
															</Badge>
														</TableCell>
														<TableCell className="text-center">
															{item.quantity}
														</TableCell>
														<TableCell className="text-right">
															{formatCurrency(item.unitPrice || 0)}
														</TableCell>
														<TableCell className="text-right font-semibold">
															{formatCurrency(item.totalPrice || 0)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
									<Separator />
								</>
							)}

							{/* Payment History */}
							{order.payments && order.payments.length > 0 && (
								<>
									<div>
										<div className="flex items-center gap-2 mb-3">
											<DollarSignIcon className="w-5 h-5 text-green-600" />
											<h3 className="text-lg font-semibold">
												Payment History ({order.paymentCount})
											</h3>
										</div>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Date</TableHead>
													<TableHead>Type</TableHead>
													<TableHead>Method</TableHead>
													<TableHead className="text-right">Amount</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{order.payments.map((payment: any) => (
													<TableRow key={payment.id}>
														<TableCell>
															{new Date(
																payment.paymentDate,
															).toLocaleDateString()}
														</TableCell>
														<TableCell>
															<Badge variant="outline">
																{payment.type?.replace(/_/g, " ")}
															</Badge>
														</TableCell>
														<TableCell>
															<Badge variant="outline">
																{payment.method?.replace(/_/g, " ")}
															</Badge>
														</TableCell>
														<TableCell className="text-right font-semibold text-green-600">
															{formatCurrency(payment.amount)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
									<Separator />
								</>
							)}

							{/* Financial Summary */}
							<div className="bg-muted/50 p-4 rounded-lg">
								<h3 className="text-lg font-semibold mb-3">
									Financial Summary
								</h3>
								<div className="space-y-2">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Subtotal:</span>
										<span className="font-semibold">
											{formatCurrency(
												paymentSummary?.totalAmount ??
													order.subtotal ??
													0,
											)}
										</span>
									</div>
									{(order.urgencyCharge ?? 0) > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Urgency Charge:
											</span>
											<span className="font-semibold text-amber-600">
												{formatCurrency(order.urgencyCharge)}
											</span>
										</div>
									)}
									{(order.discount ?? 0) > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground text-green-600">
												Discount:
											</span>
											<span className="font-semibold text-green-600">
												-{formatCurrency(order.discount)}
											</span>
										</div>
									)}
									<Separator />
									<div className="flex justify-between">
										<span className="font-semibold">Total Amount:</span>
										<span className="font-bold">
											{formatCurrency(
												paymentSummary?.totalAmount ??
													order.totalAmount ??
													0,
											)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Amount Paid:
										</span>
										<span className="font-semibold text-green-600">
											{formatCurrency(
												paymentSummary?.amountPaid ??
													order.amountPaid ??
													0,
											)}
										</span>
									</div>
									<Separator />
									<div className="flex justify-between text-lg">
										<span className="font-semibold">Balance Due:</span>
										<span
											className={`font-bold ${
												(paymentSummary?.balanceDue ??
													order.balanceDue ??
													0) > 0
													? "text-orange-600"
													: "text-green-600"
											}`}
										>
											{formatCurrency(
												paymentSummary?.balanceDue ??
													order.balanceDue ??
													0,
											)}
										</span>
									</div>
								</div>
							</div>

							{/* Issues Section */}
							{order.hasIssues && (
								<div className="bg-red-50 p-4 rounded-lg border border-red-200">
									<h3 className="text-lg font-semibold mb-2 text-red-900">
										Issues
									</h3>
									{order.issuesDescription && (
										<p className="text-sm text-red-800">
											{order.issuesDescription}
										</p>
									)}
								</div>
							)}

							{/* Notes */}
							{(order.specialInstructions ||
								order.customerNotes ||
								order.internalNotes) && (
								<div className="bg-muted/30 p-4 rounded-lg">
									<h3 className="text-lg font-semibold mb-2">Notes</h3>
									{order.specialInstructions && (
										<div className="mb-2">
											<p className="text-xs font-medium text-muted-foreground">
												Special Instructions
											</p>
											<p className="text-sm">{order.specialInstructions}</p>
										</div>
									)}
									{order.customerNotes && (
										<div className="mb-2">
											<p className="text-xs font-medium text-muted-foreground">
												Customer Notes
											</p>
											<p className="text-sm">{order.customerNotes}</p>
										</div>
									)}
									{order.internalNotes && (
										<div>
											<p className="text-xs font-medium text-muted-foreground">
												Internal Notes
											</p>
											<p className="text-sm">{order.internalNotes}</p>
										</div>
									)}
								</div>
							)}
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
