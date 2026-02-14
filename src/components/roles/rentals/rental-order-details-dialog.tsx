"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getOrderDetails,
	getOrderPaymentSummary,
	updateOrderStatus,
} from "@/lib/rental-actions";
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
	CalendarIcon,
	UserIcon,
	PhoneIcon,
	MailIcon,
	DollarSignIcon,
	PackageIcon,
	Loader2Icon,
	ClockIcon,
	AlertCircleIcon,
	ShieldCheckIcon,
	RefreshCwIcon,
	EditIcon,
} from "lucide-react";

type RentalOrderDetailsDialogProps = {
	orderId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const statusColors: Record<string, string> = {
	PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
	CONFIRMED: "bg-indigo-100 text-indigo-800 border-indigo-200",
	PICKED_UP: "bg-cyan-100 text-cyan-800 border-cyan-200",
	ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
	OVERDUE: "bg-red-100 text-red-800 border-red-200",
	RETURNED: "bg-teal-100 text-teal-800 border-teal-200",
	COMPLETED: "bg-green-100 text-green-800 border-green-200",
	CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
	LOST: "bg-red-200 text-red-900 border-red-300",
	DAMAGED: "bg-orange-100 text-orange-800 border-orange-200",
};

const paymentStatusColors: Record<string, string> = {
	UNPAID: "bg-red-100 text-red-800 border-red-200",
	DEPOSIT_PARTIALLY_PAID: "bg-amber-100 text-amber-800 border-amber-200",
	DEPOSIT_PAID: "bg-blue-100 text-blue-800 border-blue-200",
	PARTIALLY_PAID: "bg-orange-100 text-orange-800 border-orange-200",
	PAID: "bg-green-100 text-green-800 border-green-200",
	PARTIALLY_REFUNDED: "bg-purple-100 text-purple-800 border-purple-200",
	FULLY_REFUNDED: "bg-violet-100 text-violet-800 border-violet-200",
	CHARGED_TO_ROOM: "bg-sky-100 text-sky-800 border-sky-200",
	PENDING_DAMAGE_ASSESSMENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
	OVERDUE_CHARGES_PENDING: "bg-red-100 text-red-800 border-red-200",
};

// Valid status transitions based on rental order flow
const validTransitions: Record<string, string[]> = {
	PENDING: ["CONFIRMED", "CANCELLED"],
	CONFIRMED: ["PICKED_UP", "CANCELLED"],
	PICKED_UP: ["ACTIVE"],
	ACTIVE: ["RETURNED"],
	OVERDUE: ["RETURNED"],
	RETURNED: ["COMPLETED", "DAMAGED", "LOST"],
	// Terminal statuses - no transitions
	COMPLETED: [],
	CANCELLED: [],
	LOST: [],
	DAMAGED: [],
};

// Action labels for status transitions (friendly names shown in dropdown)
const transitionLabels: Record<string, string> = {
	CONFIRMED: "Confirm",
	CANCELLED: "Cancel Order",
	PICKED_UP: "Mark Picked Up",
	ACTIVE: "Mark Active",
	RETURNED: "Mark Returned",
	COMPLETED: "Complete",
	DAMAGED: "Mark Damaged",
	LOST: "Mark Lost",
};

const statusLabels: Record<string, string> = {
	PENDING: "Pending",
	CONFIRMED: "Confirmed",
	PICKED_UP: "Picked Up",
	ACTIVE: "Active",
	OVERDUE: "Overdue",
	RETURNED: "Returned",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
	LOST: "Lost",
	DAMAGED: "Damaged",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function RentalOrderDetailsDialog({
	orderId,
	open,
	onOpenChange,
}: RentalOrderDetailsDialogProps) {
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
		queryKey: ["rentals", "orders", orderId],
		queryFn: async () => {
			const result = await getOrderDetails(orderId!);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: !!orderId && open,
		retry: 1,
	});

	const { data: paymentSummary } = useQuery({
		queryKey: ["rentals", "orders", orderId, "payment-summary"],
		queryFn: async () => {
			const result = await getOrderPaymentSummary(orderId!);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: !!orderId && open && !!order,
		retry: 1,
	});

	const statusMutation = useMutation({
		mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
			const result = await updateOrderStatus(orderId!, { status, notes });
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success("Order status updated successfully");
			setIsChangingStatus(false);
			setSelectedStatus("");
			setStatusNotes("");
			queryClient.invalidateQueries({ queryKey: ["rentals", "orders"] });
			queryClient.invalidateQueries({ queryKey: ["rentals", "dashboard-stats"] });
			router.refresh();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update status");
		},
	});

	if (!orderId) return null;

	const totalDays =
		order?.rentalStartTime && order?.rentalEndTime
			? Math.ceil(
					(new Date(order.rentalEndTime).getTime() -
						new Date(order.rentalStartTime).getTime()) /
						(1000 * 60 * 60 * 24),
				)
			: 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<Loader2Icon className="w-8 h-8 animate-spin text-blue-600" />
						<p className="text-sm text-muted-foreground">Loading order details...</p>
					</div>
				) : isError ? (
					<div className="flex flex-col items-center justify-center py-12 gap-4">
						<AlertCircleIcon className="w-10 h-10 text-red-400" />
						<div className="text-center">
							<p className="font-medium text-red-600">Failed to load order</p>
							<p className="text-sm text-muted-foreground mt-1">
								{error?.message || "Something went wrong. Please try again."}
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
								Rental order details and information
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-6">
							{/* Status Section */}
							<div className="flex flex-wrap items-center gap-3">
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
										paymentStatusColors[order.paymentStatus] ||
										"bg-gray-100 text-gray-800"
									}
								>
									Payment: {order.paymentStatus?.replace(/_/g, " ")}
								</Badge>
								{order.isOverdue && (
									<Badge className="bg-red-100 text-red-800 border-red-200">
										<AlertCircleIcon className="w-3 h-3 mr-1" />
										Overdue
									</Badge>
								)}
								{order.extended && (
									<Badge className="bg-purple-100 text-purple-800 border-purple-200">
										<ClockIcon className="w-3 h-3 mr-1" />
										Extended ({order.extensionCount}x)
									</Badge>
								)}
								{order.inspectionCompleted && (
									<Badge className="bg-green-100 text-green-800 border-green-200">
										<ShieldCheckIcon className="w-3 h-3 mr-1" />
										Inspected
									</Badge>
								)}
								{!isChangingStatus && (
									<Button
										variant="outline"
										size="sm"
										disabled={!(validTransitions[order.status]?.length > 0)}
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
													{(validTransitions[order.status] || []).map((status) => (
															<SelectItem key={status} value={status}>
																{transitionLabels[status] || statusLabels[status]}
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
											disabled={!selectedStatus || selectedStatus === order.status || statusMutation.isPending}
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
													Phone Number
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
									{order.identificationType && (
										<div className="flex items-center gap-2">
											<UserIcon className="w-4 h-4 text-muted-foreground" />
											<div>
												<p className="text-sm text-muted-foreground">
													ID: {order.identificationType}
												</p>
												<p className="font-medium">
													{order.identificationNumber}
												</p>
											</div>
										</div>
									)}
								</div>
							</div>

							<Separator />

							{/* Rental Period */}
							<div>
								<h3 className="text-lg font-semibold mb-3">Rental Period</h3>
								<div className="grid grid-cols-3 gap-4">
									<div className="flex items-center gap-2">
										<CalendarIcon className="w-4 h-4 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">
												Start Date
											</p>
											<p className="font-medium">
												{new Date(
													order.rentalStartTime,
												).toLocaleDateString()}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<CalendarIcon className="w-4 h-4 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">
												End Date
											</p>
											<p className="font-medium">
												{new Date(
													order.rentalEndTime,
												).toLocaleDateString()}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<ClockIcon className="w-4 h-4 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">
												Duration
											</p>
											<p className="font-medium">
												{order.totalRentalDurationHours
													? `${order.totalRentalDurationHours} hours`
													: `${totalDays} days`}
											</p>
										</div>
									</div>
								</div>
							</div>

							<Separator />

							{/* Rented Items */}
							{order.items && order.items.length > 0 && (
								<>
									<div>
										<div className="flex items-center gap-2 mb-3">
											<PackageIcon className="w-5 h-5 text-blue-600" />
											<h3 className="text-lg font-semibold">
												Rented Items ({order.totalItemsCount})
											</h3>
										</div>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Item Name</TableHead>
													<TableHead className="text-center">
														Qty
													</TableHead>
													<TableHead className="text-right">
														Unit Price
													</TableHead>
													<TableHead className="text-right">
														Total
													</TableHead>
													<TableHead className="text-right">
														Deposit
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{order.items.map((item: any) => (
													<TableRow key={item.id}>
														<TableCell className="font-medium">
															{item.rentalItemName}
															{item.damaged && (
																<Badge className="ml-2 bg-red-100 text-red-800 text-xs">
																	Damaged
																</Badge>
															)}
															{item.lost && (
																<Badge className="ml-2 bg-red-200 text-red-900 text-xs">
																	Lost
																</Badge>
															)}
														</TableCell>
														<TableCell className="text-center">
															{item.quantity}
														</TableCell>
														<TableCell className="text-right">
															{formatCurrency(item.unitRentalPrice || 0)}
														</TableCell>
														<TableCell className="text-right font-semibold">
															{formatCurrency(item.totalRentalPrice || 0)}
														</TableCell>
														<TableCell className="text-right">
															{formatCurrency(item.totalDeposit || 0)}
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
													<TableHead className="text-right">
														Amount
													</TableHead>
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
										<span className="text-muted-foreground">
											Rental Subtotal:
										</span>
										<span className="font-semibold">
											{formatCurrency(
												paymentSummary?.rentalSubtotal ??
													order.rentalSubtotal ??
													0,
											)}
										</span>
									</div>
									{(paymentSummary?.totalDeposit ??
										order.totalDeposit) > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Total Deposit:
											</span>
											<span className="font-semibold">
												{formatCurrency(
													paymentSummary?.totalDeposit ??
														order.totalDeposit,
												)}
											</span>
										</div>
									)}
									{paymentSummary?.depositPaid > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Deposit Paid:
											</span>
											<span className="font-semibold text-green-600">
												{formatCurrency(
													paymentSummary.depositPaid,
												)}
											</span>
										</div>
									)}
									{paymentSummary?.depositRefunded > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Deposit Refunded:
											</span>
											<span className="font-semibold text-purple-600">
												{formatCurrency(
													paymentSummary.depositRefunded,
												)}
											</span>
										</div>
									)}
									{(paymentSummary?.lateReturnPenalty ??
										order.lateReturnPenalty) > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground text-red-600">
												Late Penalty:
											</span>
											<span className="font-semibold text-red-600">
												{formatCurrency(
													paymentSummary?.lateReturnPenalty ??
														order.lateReturnPenalty,
												)}
											</span>
										</div>
									)}
									{(paymentSummary?.damageFee ??
										order.damageFee) > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground text-red-600">
												Damage Fee:
											</span>
											<span className="font-semibold text-red-600">
												{formatCurrency(
													paymentSummary?.damageFee ??
														order.damageFee,
												)}
											</span>
										</div>
									)}
									{order.discount > 0 && (
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
										<span className="font-semibold">
											Total Amount:
										</span>
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
									{paymentSummary?.paymentCount != null && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Payments Made:
											</span>
											<span className="font-semibold">
												{paymentSummary.paymentCount}
											</span>
										</div>
									)}
									<Separator />
									<div className="flex justify-between text-lg">
										<span className="font-semibold">
											Balance Due:
										</span>
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
									{order.damageDescription && (
										<p className="text-sm text-red-800 mt-1">
											Damage: {order.damageDescription}
										</p>
									)}
								</div>
							)}

							{/* Notes Section */}
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
