"use client";

import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import {
	useReactTable,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	createColumnHelper,
	flexRender,
} from "@tanstack/react-table";
import { useSetAtom, useAtom, atom } from "jotai";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Table as TableType } from "@tanstack/react-table";
import {
	EditIcon,
	EyeIcon,
	PencilIcon,
	PlusIcon,
	SearchIcon,
	CheckIcon,
	XIcon,
	CalendarIcon,
	UserIcon,
	Loader2Icon,
	AlertCircleIcon,
	RotateCcwIcon,
	MoreHorizontalIcon,
	CreditCardIcon,
	BuildingIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/shared/pagination";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { SuccessDialog } from "@/components/shared/shared-dialogs";
import type { BookingStatus, Pagination } from "@/lib/fetch";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { cn, formatCurrency } from "@/lib/utils";
import type { APIOutput, Prettify } from "@/lib/action-utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	cancelReservation,
	checkInGuest,
	checkOutGuest,
	getBookingPayments,
	recordPayment,
	updateBooking,
} from "@/lib/front-desk-actions";
import { revalidateRoute } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { UnifiedBookingForm, type RoomType } from "./dashboard";
import { TableFilter } from "@/components/shared/table-filter";
import { AssignToOrgContent } from "./rooms-table-actions";
import { Building2Icon } from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type BookingViewResponse = Prettify<
	APIOutput<"@get/api/front-desks/bookings">["data"]["content"][number]
>;

const successDialogAtom = atom({
	show: false,
	message: "",
});

function ChangeBookingStatus({
	booking,
	onClose,
}: {
	booking?: BookingViewResponse;
	onClose?: () => void;
}) {
	const setShowSuccessDialog = useSetAtom(successDialogAtom);
	const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "">("");
	const [notes, setNotes] = useState("");
	const [optionalFields, setOptionalFields] = useState<{
		finalAmountPaid?: number;
		paymentMethod?: string;
		paymentReference?: string;
		paymentType?: "DEPOSIT" | "INSTALLMENT" | "FINAL" | "OTHER" | "REFUND";
	}>({
		paymentMethod: "CASH",
		paymentReference: "",
		paymentType: "FINAL",
	});

	const allStatusOptions: Array<{
		value: BookingStatus;
		label: string;
		description: string;
	}> = [
			{
				value: "RESERVED",
				label: "Reserved",
				description: "Room is reserved for the guest",
			},
			{
				value: "CHECKED_IN",
				label: "Checked In",
				description: "Guest has checked into the room",
			},
			{
				value: "CHECKED_OUT",
				label: "Checked Out",
				description: "Guest has checked out from the room",
			},
			{
				value: "CANCELLED",
				label: "Cancelled",
				description: "Booking has been cancelled",
			},
		];

	const currentStatus = booking?.bookingStatus;

	// Define valid transitions based on business logic
	// Booking workflow: RESERVED → CHECKED_IN → CHECKED_OUT
	// Cancellation is only allowed from RESERVED status
	// Once CHECKED_OUT or CANCELLED, no further transitions are allowed
	const getValidTransitions = (
		currentStatus: BookingStatus,
	): BookingStatus[] => {
		switch (currentStatus) {
			case "RESERVED":
				// From Reserved: can check in or cancel
				return ["CHECKED_IN", "CANCELLED"];

			case "CHECKED_IN":
				// From Checked In: can only check out (no cancellation once checked in)
				return ["CHECKED_OUT"];

			case "CHECKED_OUT":
				// From Checked Out: no further transitions allowed (final state)
				return [];

			case "CANCELLED":
				// From Cancelled: no further transitions allowed (final state)
				return [];

			// case "AVAILABLE":
			//   // From Available: can be reserved
			//   return ["RESERVED"];

			default:
				return [];
		}
	};

	const validTransitions = currentStatus
		? getValidTransitions(currentStatus)
		: [];
	const statusOptions = allStatusOptions.filter((option) =>
		validTransitions.includes(option.value),
	);
	const currentStatusLabel =
		statusOptions.find((option) => option.value === currentStatus)?.label ||
		currentStatus?.replaceAll("_", " ").toLowerCase();

	const { isPending, mutate } = useMutation({
		mutationFn: async () => {
			if (!selectedStatus) return;

			switch (selectedStatus) {
				case "CANCELLED": {
					const response = await cancelReservation({
						roomId: booking?.roomIdentifier!,
					});
					if (!response.success) {
						throw new Error(response.error || "Failed to create reservation.");
					}
					return;
				}
				case "CHECKED_IN": {
					const response = await checkInGuest({
						roomId: booking?.roomIdentifier!,
						guestName: booking?.guestName!,
						title: "Mr", // Default title as it's not in booking
						guestEmail: `${booking?.guestName?.toLowerCase()?.replace(/\s/g, ".")}@example.com`, // Generate placeholder email
						phoneNumber: booking?.guestPhoneNumber!,
						noOfAdults: booking?.noOfAdults ?? 1,
						noOfChildren: booking?.noOfChildren ?? 0,
						nightlyRate: booking?.nightlyRate ?? 0,
						dailySpendingCap: 0,
						checkInDate: new Date().toISOString().split("T")[0],
						checkOutDate: booking?.checkOutDate
							? new Date(booking.checkOutDate).toISOString().split("T")[0]
							: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Default to tomorrow if missing
						discountValue: 0,
						discountType: "FIXED",
						initialPayment: {
							amount: booking?.amountPaid || 0,
							currency: "NGN",
							method: "CASH",
							status: "SUCCESS",
							type: "DEPOSIT",
							paymentDate: new Date(),
							reference: `INIT-${Date.now()}`,
						},
					});

					if (!response.success) {
						throw new Error(response.error || "Failed to check in guest.");
					}
					return;
				}
				case "CHECKED_OUT": {
					// First, record the payment if there's an amount to pay
					if (
						optionalFields.finalAmountPaid &&
						optionalFields.finalAmountPaid > 0
					) {
						const paymentResponse = await recordPayment({
							bookingId: booking?.id!,
							amount: optionalFields.finalAmountPaid,
							currency: "NGN",
							method: optionalFields.paymentMethod || "CASH",
							reference:
								optionalFields.paymentReference || `CHECKOUT-${Date.now()}`,
							type: optionalFields.paymentType || "FINAL",
							paymentDate: new Date().toISOString(),
						});

						if (!paymentResponse.success) {
							throw new Error(
								paymentResponse.error || "Failed to record payment.",
							);
						}
					}

					// Only proceed with checkout if payment type is FINAL (full payment)
					// For other payment types (INSTALLMENT, DEPOSIT, OTHER), just record payment without checkout
					if (
						optionalFields.paymentType === "FINAL" ||
						booking?.amountRemaining === 0
					) {
						const response = await checkOutGuest({
							roomId: booking?.roomIdentifier!,
							finalAmountPaid:
								(booking?.amountPaid ?? 0) +
								(optionalFields.finalAmountPaid ?? 0),
						});

						if (!response.success) {
							throw new Error(response.error || "Failed to check out guest.");
						}
					} else {
						// For non-final payments, just show success message without checkout
						toast.success(
							"Payment recorded successfully. Guest can be checked out when final payment is made.",
						);
					}
					return;
				}
				default: {
					toast.info("Status update feature coming soon!");
				}
			}
		},
		onSuccess: () => {
			setShowSuccessDialog({
				show: true,
				message: "Booking status updated successfully.",
			});
			onClose?.();
			revalidateRoute("/front-desk/bookings");
		},
		onError: (e) => {
			toast.error("Failed to update booking status.", {
				description: e instanceof Error ? e.message : undefined,
			});
		},
	});

	const getStatusColor = (status: BookingStatus) => {
		const colors = {
			RESERVED: "bg-yellow-100 text-yellow-800 border-yellow-200",
			CHECKED_IN: "bg-green-100 text-green-800 border-green-200",
			CHECKED_OUT: "bg-blue-100 text-blue-800 border-blue-200",
			CANCELLED: "bg-red-100 text-red-800 border-red-200",
			AVAILABLE: "bg-gray-100 text-gray-800 border-gray-200",
		};
		return colors[status] || colors.AVAILABLE;
	};

	return (
		<DialogContent className="p-6 rounded-2xl max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hidden">
			<DialogTitle className="text-xl font-semibold">
				Change Booking Status
			</DialogTitle>
			<DialogDescription className="text-gray-600">
				{statusOptions.length > 0
					? "Update the status of this booking following the hotel workflow."
					: "View booking details and current status."}
			</DialogDescription>

			<div className="space-y-2">
				{/* Current Booking Info */}
				{booking && (
					<div className="bg-gray-50 p-4 rounded-lg space-y-2">
						<div className="flex items-center gap-2">
							<UserIcon className="w-4 h-4 text-gray-500" />
							<span className="font-medium">{booking.guestName}</span>
						</div>
						<div className="flex items-center gap-2">
							<CalendarIcon className="w-4 h-4 text-gray-500" />
							<span className="text-sm text-gray-600">
								Room {booking.roomType} • ID: {booking.customId}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-500">Current Status:</span>
							<span
								className={cn`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(
									currentStatus!,
								)}`}
							>
								{currentStatusLabel}
							</span>
						</div>
						{/* Payment Status */}
						{currentStatus === "CHECKED_IN" && (
							<div className="pt-2 border-t border-gray-200">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Balance:</span>
									<span
										className={`font-medium ${booking.amountRemaining > 0
											? "text-amber-600"
											: "text-green-600"
											}`}
									>
										{formatCurrency(booking.amountRemaining)}
										{booking.amountRemaining > 0 && " due"}
									</span>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Status Selection */}
				<div className="space-y-3">
					<Label htmlFor="status-select" className="text-sm font-medium">
						New Status
					</Label>
					{statusOptions.length > 0 ? (
						<Select
							value={selectedStatus}
							onValueChange={(value) =>
								setSelectedStatus(value as BookingStatus)
							}
						>
							<SelectTrigger id="status-select" className="w-full">
								<SelectValue placeholder="Select new status" />
							</SelectTrigger>
							<SelectContent className="w-full">
								{statusOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<div className="flex flex-col items-start">
											<span className="font-medium">{option.label}</span>
											<span className="text-xs text-gray-500">
												{option.description}
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<div className="p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
							No status changes available for this booking
						</div>
					)}
				</div>

				{/* Status Change Warning */}
				{selectedStatus && selectedStatus !== currentStatus && (
					<Alert
						variant={
							selectedStatus === "CANCELLED"
								? "destructive"
								: selectedStatus === "CHECKED_OUT"
									? "info"
									: selectedStatus === "CHECKED_IN"
										? "success"
										: "warning"
						}
					>
						<AlertCircleIcon className="h-4 w-4" />
						<AlertDescription>
							{selectedStatus === "CANCELLED" &&
								currentStatus === "RESERVED" &&
								"Cancelling this reservation will free up the room for new bookings. This action cannot be undone."}
							{selectedStatus === "CHECKED_OUT" &&
								currentStatus === "CHECKED_IN" &&
								"Checking out will finalize the stay and make the room available for cleaning and new guests."}
							{selectedStatus === "CHECKED_IN" &&
								currentStatus === "RESERVED" &&
								"Checking in will mark the guest as currently occupying the room and start their stay."}
							{selectedStatus === "RESERVED" &&
								"Creating a reservation will hold this room for the guest's arrival."}
						</AlertDescription>
					</Alert>
				)}

				{/* No valid transitions message */}
				{statusOptions.length === 0 && (
					<Alert variant="info">
						<AlertCircleIcon className="h-4 w-4" />
						<AlertDescription>
							{currentStatus === "CHECKED_OUT" &&
								"This booking is completed. No further status changes are available."}
							{currentStatus === "CANCELLED" &&
								"This booking was cancelled. No further status changes are available."}
						</AlertDescription>
					</Alert>
				)}

				{/* Optional field for checkout */}
				{selectedStatus === "CHECKED_OUT" && booking && (
					<div className="space-y-3">
						{/* Payment Summary */}
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
							<h4 className="font-medium text-blue-900 text-sm">
								Payment Summary
							</h4>
							<div className="space-y-1 text-sm">
								<div className="flex justify-between">
									<span className="text-blue-700">Total Amount Due:</span>
									<span className="font-medium text-blue-900">
										{formatCurrency(booking.totalAmountDue)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-blue-700">Amount Paid:</span>
									<span className="font-medium text-blue-900">
										{formatCurrency(booking.amountPaid)}
									</span>
								</div>
								<div className="flex justify-between pt-2 border-t border-blue-200">
									<span className="text-blue-700 font-medium">
										Amount Remaining:
									</span>
									<span
										className={`font-bold ${booking.amountRemaining > 0
											? "text-red-600"
											: "text-green-600"
											}`}
									>
										{formatCurrency(booking.amountRemaining)}
									</span>
								</div>
							</div>
						</div>

						{/* Payment Required Alert */}
						{booking.amountRemaining > 0 && (
							<Alert variant="warning">
								<AlertCircleIcon className="h-4 w-4" />
								<AlertDescription>
									<p>
										Guest must pay the remaining balance of{" "}
										<span className="font-medium">
											{formatCurrency(booking.amountRemaining)}
										</span>{" "}
										before checkout.
									</p>
								</AlertDescription>
							</Alert>
						)}

						{/* Payment Fields */}
						{booking.amountRemaining > 0 && (
							<>
								<div className="space-y-2">
									<Label
										htmlFor="finalAmountPaid"
										className="text-sm font-medium"
									>
										Payment Amount <span className="text-red-500">*</span>
									</Label>
									<Input
										id="finalAmountPaid"
										type="number"
										step="0.01"
										min="0"
										max={booking.amountRemaining}
										value={optionalFields.finalAmountPaid || ""}
										onChange={(e) =>
											setOptionalFields((prev) => ({
												...prev,
												finalAmountPaid: Number(e.target.value),
											}))
										}
										placeholder={`Enter amount (Max: ${formatCurrency(
											booking.amountRemaining,
										)})`}
										className="w-full"
									/>
									{optionalFields.finalAmountPaid !== undefined &&
										optionalFields.finalAmountPaid !==
										booking.amountRemaining && (
											<p className="text-xs text-amber-600">
												Note: Amount entered (
												{formatCurrency(optionalFields.finalAmountPaid)}) is
												less than the remaining balance.
											</p>
										)}
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="paymentMethod"
										className="text-sm font-medium"
									>
										Payment Method <span className="text-red-500">*</span>
									</Label>
									<Select
										value={optionalFields.paymentMethod}
										onValueChange={(value) =>
											setOptionalFields((prev) => ({
												...prev,
												paymentMethod: value,
											}))
										}
									>
										<SelectTrigger id="paymentMethod" className="w-full">
											<SelectValue placeholder="Select payment method" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="CASH">Cash</SelectItem>
											<SelectItem value="CARD">Card</SelectItem>
											<SelectItem value="BANK_TRANSFER">
												Bank Transfer
											</SelectItem>
											<SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="paymentType" className="text-sm font-medium">
										Payment Type <span className="text-red-500">*</span>
									</Label>
									<Select
										value={optionalFields.paymentType}
										onValueChange={(value) =>
											setOptionalFields((prev) => ({
												...prev,
												paymentType: value as typeof optionalFields.paymentType,
											}))
										}
									>
										<SelectTrigger id="paymentType" className="w-full">
											<SelectValue placeholder="Select payment type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="FINAL">Final Payment</SelectItem>
											<SelectItem value="INSTALLMENT">Installment</SelectItem>
											<SelectItem value="DEPOSIT">Deposit</SelectItem>
											<SelectItem value="OTHER">Other</SelectItem>
										</SelectContent>
									</Select>
									{optionalFields.paymentType &&
										optionalFields.paymentType !== "FINAL" && (
											<p className="text-xs text-blue-600">
												Note: This will record the payment without checking out
												the guest.
											</p>
										)}
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="paymentReference"
										className="text-sm font-medium"
									>
										Payment Reference
									</Label>
									<Input
										id="paymentReference"
										type="text"
										value={optionalFields.paymentReference}
										onChange={(e) =>
											setOptionalFields((prev) => ({
												...prev,
												paymentReference: e.target.value,
											}))
										}
										placeholder="e.g., Receipt number, transaction ID"
										className="w-full"
									/>
								</div>
							</>
						)}

						{booking.amountRemaining === 0 && (
							<Alert variant="success">
								<CheckIcon className="h-4 w-4" />
								<AlertDescription>
									Payment is complete. Guest can be checked out.
								</AlertDescription>
							</Alert>
						)}
					</div>
				)}

				{/* Notes */}
				{statusOptions.length > 0 && selectedStatus === "RESERVED" && (
					<div className="space-y-3">
						<Label htmlFor="notes" className="text-sm font-medium">
							Notes (Optional)
						</Label>
						<Textarea
							id="notes"
							placeholder="Add any additional notes about this status change..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							className="resize-none"
						/>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex gap-3 pt-4">
					<Button
						variant="outline"
						onClick={onClose}
						className="flex-1"
						disabled={isPending}
					>
						<XIcon className="w-4 h-4 mr-2" />
						{statusOptions.length > 0 ? "Cancel" : "Close"}
					</Button>
					{statusOptions.length > 0 && (
						<Button
							onClick={() => mutate()}
							disabled={
								!selectedStatus ||
								selectedStatus === currentStatus ||
								isPending ||
								// Disable if trying to checkout and there's a remaining balance without payment
								(selectedStatus === "CHECKED_OUT" &&
									booking &&
									booking.amountRemaining > 0 &&
									(!optionalFields.finalAmountPaid ||
										optionalFields.finalAmountPaid <= 0))
							}
							className="flex-1"
						>
							{isPending ? (
								<>
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
									Updating...
								</>
							) : (
								<>
									<CheckIcon className="w-4 h-4 mr-2" />
									{selectedStatus === "CHECKED_OUT" &&
										booking &&
										booking.amountRemaining > 0
										? optionalFields.paymentType === "FINAL"
											? "Record Payment & Check Out"
											: "Record Payment"
										: "Update Status"}
								</>
							)}
						</Button>
					)}
				</div>
			</div>
		</DialogContent>
	);
}

function PaymentHistoryContent({ bookingId }: { bookingId: string }) {
	const { data: payments, isLoading } = useQuery({
		queryKey: ["booking-payments", bookingId],
		queryFn: async () => {
			if (!bookingId) return [];
			const res = await getBookingPayments({ bookingId });
			if (!res.success && res.error) throw new Error(res.error);
			return res.success ? res.data.data : [];
		},
	});

	return (
		<DialogContent className="min-w-3xl">
			<DialogHeader>
				<DialogTitle>Payment History</DialogTitle>
				<DialogDescription>
					View all payments recorded for this booking.
				</DialogDescription>
			</DialogHeader>

			<div className="mt-4">
				{isLoading ? (
					<div className="flex justify-center p-8">
						<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : !payments || payments.length === 0 ? (
					<div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
						No payments recorded for this booking.
					</div>
				) : (
					<div className="rounded-md border overflow-hidden">
						<Table>
							<TableHeader className="bg-gray-100">
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Method</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Reference</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments.map((payment) => (
									<TableRow key={payment.reference}>
										<TableCell>
											{new Date(payment.paymentDate).toLocaleDateString()}
											<div className="text-xs text-gray-500">
												{new Date(payment.paymentDate).toLocaleTimeString()}
											</div>
										</TableCell>
										<TableCell className="capitalize">
											{payment.method.toLowerCase().replace(/_/g, " ")}
										</TableCell>
										<TableCell className="capitalize">
											<Badge variant="outline">
												{payment.type.toLowerCase().replace(/_/g, " ")}
											</Badge>
										</TableCell>
										<TableCell className="font-mono text-xs">
											{payment.reference}
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(payment.amount)}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													payment.status === "SUCCESS"
														? "green"
														: payment.status === "PENDING"
															? "yellow"
															: payment.status === "FAILED"
																? "destructive"
																: "secondary"
												}
											>
												{payment.status.toLowerCase()}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</DialogContent>
	);
}

function BookingDetailsContent({ booking }: { booking: BookingViewResponse }) {
	const statusColor: Record<string, string> = {
		RESERVED: "bg-yellow-50 text-yellow-700 border-yellow-200",
		CHECKED_IN: "bg-green-50 text-green-700 border-green-200",
		CHECKED_OUT: "bg-blue-50 text-blue-700 border-blue-200",
		CANCELLED: "bg-red-50 text-red-700 border-red-200",
	};

	const nights = booking.numberOfNights ?? Math.ceil(
		(new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24),
	);

	return (
		<DialogContent className="sm:max-w-4xl">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					Booking Details
					<span className="text-muted-foreground font-normal text-base">
						- {booking.customId}
					</span>
					<span
						className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[booking.bookingStatus] || "bg-gray-100 text-gray-700 border-gray-200"}`}
					>
						{booking.bookingStatus.toLowerCase().replace(/_/g, " ")}
					</span>
				</DialogTitle>
			</DialogHeader>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
				{/* Guest Info - Column 1 */}
				<div className="space-y-4">
					<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
						Guest Information
					</h4>
					<div className="flex flex-col gap-4 p-4 rounded-lg border bg-card h-full">
						<div className="flex items-center gap-4">
							<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
								<UserIcon className="h-6 w-6" />
							</div>
							<div>
								<h3 className="font-semibold text-lg">{booking.guestName}</h3>
								{booking.guestPhoneNumber && (
									<div className="text-sm text-muted-foreground">
										{booking.guestPhoneNumber}
									</div>
								)}
							</div>
						</div>

						{booking.guestEmail && (
							<div className="text-sm text-muted-foreground bg-muted p-2 rounded truncate">
								{booking.guestEmail}
							</div>
						)}

						{booking.organizationName && (
							<div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted p-2 rounded">
								<BuildingIcon className="h-4 w-4" />
								<span className="font-medium">Org:</span>{" "}
								{booking.organizationName}
							</div>
						)}

						<div className="grid grid-cols-2 gap-2 mt-auto pt-4">
							<div className="bg-muted/50 p-2 rounded text-center">
								<div className="text-xs text-muted-foreground">Adults</div>
								<div className="font-semibold">{booking.noOfAdults || 0}</div>
							</div>
							<div className="bg-muted/50 p-2 rounded text-center">
								<div className="text-xs text-muted-foreground">Children</div>
								<div className="font-semibold">
									{booking.noOfChildren || 0}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Booking Info - Column 2 */}
				<div className="space-y-4">
					<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
						Booking Details
					</h4>
					<div className="flex flex-col gap-4 h-full">
						<div className="p-4 rounded-lg border bg-muted/30 space-y-3 flex-1">
							<div className="text-sm font-medium flex items-center gap-2 mb-2">
								<CalendarIcon className="h-4 w-4 text-primary" />
								Stay Information
							</div>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Room</span>
									<span className="font-medium">{booking.roomNo}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Room Type</span>
									<span className="font-medium text-right">
										{booking.roomType}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Branch</span>
									<span className="font-medium text-right">
										{booking.branchName}
									</span>
								</div>
							</div>
						</div>

						<div className="p-4 rounded-lg border bg-muted/30 space-y-3 flex-1">
							<div className="space-y-2 text-sm">
								<div className="flex justify-between border-b pb-2">
									<div>
										<div className="text-xs text-muted-foreground">
											Check In
										</div>
										<div className="font-medium">
											{new Date(booking.checkInDate).toLocaleDateString()}
										</div>
									</div>
									<div className="text-right">
										<div className="text-xs text-muted-foreground">
											Check Out
										</div>
										<div className="font-medium">
											{new Date(booking.checkOutDate).toLocaleDateString()}
										</div>
									</div>
								</div>
								<div className="flex justify-between items-center pt-1">
									<span className="text-muted-foreground">Duration</span>
									<span className="font-medium">
										{nights} Night{nights !== 1 ? "s" : ""}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Financial Section - Column 3 */}
				<div className="space-y-4">
					<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
						Financials
					</h4>
					<div className="p-5 rounded-lg border bg-card h-full flex flex-col">
						<div className="flex items-center gap-2 font-medium mb-4 text-primary">
							<CreditCardIcon className="h-5 w-5" />
							Payment Summary
						</div>

						<div className="space-y-4 flex-1">
							<div className="flex justify-between items-center pb-3 border-b border-dashed">
								<span className="text-muted-foreground">Nightly Rate</span>
								<span className="font-mono">
									{formatCurrency(booking.nightlyRate)}
								</span>
							</div>

							<div className="space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">
										Accommodation
									</span>
									<span className="font-medium">
										{formatCurrency(booking.accommodationCost)}
									</span>
								</div>
								{booking.restaurantOrdersTotal > 0 && (
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">
											Restaurant Orders
										</span>
										<span className="font-medium">
											{formatCurrency(booking.restaurantOrdersTotal)}
										</span>
									</div>
								)}
								<div className="flex justify-between items-center border-t pt-2">
									<span className="text-muted-foreground">Total Due</span>
									<span className="font-semibold">
										{formatCurrency(booking.totalAmountDue)}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Amount Paid</span>
									<span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
										{formatCurrency(booking.amountPaid)}
									</span>
								</div>
							</div>

							<div className="mt-auto pt-4 border-t">
								<div className="flex flex-col gap-1">
									<span className="text-sm text-muted-foreground">
										Outstanding Balance
									</span>
									<span
										className={`text-2xl font-bold ${booking.amountRemaining > 0 ? "text-red-600" : "text-green-600"}`}
									>
										{formatCurrency(booking.amountRemaining)}
									</span>
									{booking.amountRemaining > 0 && (
										<span className="text-xs text-red-500 font-medium">
											Payment Required
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</DialogContent>
	);
}

function EditBookingContent({
	booking,
	onClose,
}: {
	booking: BookingViewResponse;
	onClose: () => void;
}) {
	const [guestName, setGuestName] = useState(booking.guestName);
	const [guestEmail, setGuestEmail] = useState(booking.guestEmail ?? "");
	const [phoneNumber, setPhoneNumber] = useState(booking.guestPhoneNumber ?? "");
	const [noOfAdults, setNoOfAdults] = useState(booking.noOfAdults ?? 1);
	const [noOfChildren, setNoOfChildren] = useState(booking.noOfChildren ?? 0);
	const [checkOutDate, setCheckOutDate] = useState(
		booking.checkOutDate
			? new Date(booking.checkOutDate).toISOString().split("T")[0]
			: "",
	);

	const originalCheckOutDate = booking.checkOutDate
		? new Date(booking.checkOutDate).toISOString().split("T")[0]
		: "";
	const checkOutChanged = checkOutDate !== originalCheckOutDate;

	const checkInDateStr = booking.checkInDate
		? new Date(booking.checkInDate).toISOString().split("T")[0]
		: "";
	const minCheckOutDate = checkInDateStr
		? new Date(new Date(checkInDateStr).getTime() + 86400000)
				.toISOString()
				.split("T")[0]
		: "";

	const { isPending, mutate } = useMutation({
		mutationFn: async () => {
			const payload: Record<string, unknown> = {};

			if (guestName !== booking.guestName) payload.guestName = guestName;
			if (guestEmail !== (booking.guestEmail ?? ""))
				payload.guestEmail = guestEmail || undefined;
			if (phoneNumber !== (booking.guestPhoneNumber ?? ""))
				payload.phoneNumber = phoneNumber;
			if (noOfAdults !== (booking.noOfAdults ?? 1))
				payload.noOfAdults = noOfAdults;
			if (noOfChildren !== (booking.noOfChildren ?? 0))
				payload.noOfChildren = noOfChildren;
			if (checkOutChanged) payload.checkOutDate = checkOutDate;

			if (Object.keys(payload).length === 0) {
				throw new Error("No changes to save");
			}

			const response = await updateBooking({
				bookingId: booking.id,
				...payload,
			});
			if (!response.success) {
				throw new Error(response.error || "Failed to update booking");
			}
			return response.data;
		},
		onSuccess: () => {
			toast.success("Booking updated successfully");
			onClose();
			revalidateRoute("/front-desk/bookings");
		},
		onError: (e) => {
			toast.error(e instanceof Error ? e.message : "Failed to update booking");
		},
	});

	return (
		<DialogContent className="p-6 rounded-2xl max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hidden">
			<DialogHeader>
				<DialogTitle>Edit Booking</DialogTitle>
				<DialogDescription>
					Update guest information and stay details for booking{" "}
					{booking.customId}
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="edit-guestName">Guest Name</Label>
					<Input
						id="edit-guestName"
						value={guestName}
						onChange={(e) => setGuestName(e.target.value)}
						placeholder="Guest name"
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="edit-guestEmail">Email</Label>
						<Input
							id="edit-guestEmail"
							type="email"
							value={guestEmail}
							onChange={(e) => setGuestEmail(e.target.value)}
							placeholder="guest@example.com"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-phoneNumber">Phone Number</Label>
						<Input
							id="edit-phoneNumber"
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(e.target.value)}
							placeholder="Phone number"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="edit-noOfAdults">No. of Adults</Label>
						<Input
							id="edit-noOfAdults"
							type="number"
							min={1}
							value={noOfAdults}
							onChange={(e) => setNoOfAdults(Number(e.target.value))}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-noOfChildren">No. of Children</Label>
						<Input
							id="edit-noOfChildren"
							type="number"
							min={0}
							value={noOfChildren}
							onChange={(e) => setNoOfChildren(Number(e.target.value))}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Check-in Date</Label>
						<Input
							type="date"
							value={checkInDateStr}
							disabled
							className="bg-gray-50"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-checkOutDate">Check-out Date</Label>
						<Input
							id="edit-checkOutDate"
							type="date"
							min={minCheckOutDate}
							value={checkOutDate}
							onChange={(e) => setCheckOutDate(e.target.value)}
						/>
					</div>
				</div>

				{checkOutChanged && (
					<Alert variant="info">
						<AlertCircleIcon className="h-4 w-4" />
						<AlertDescription>
							Changing the check-out date will recalculate the accommodation
							cost and total amount due.
						</AlertDescription>
					</Alert>
				)}

				<div className="flex gap-3 pt-4">
					<Button
						variant="outline"
						onClick={onClose}
						className="flex-1"
						disabled={isPending}
					>
						<XIcon className="w-4 h-4 mr-2" />
						Cancel
					</Button>
					<Button
						onClick={() => mutate()}
						className="flex-1"
						disabled={isPending}
					>
						{isPending ? (
							<>
								<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<CheckIcon className="w-4 h-4 mr-2" />
								Save Changes
							</>
						)}
					</Button>
				</div>
			</div>
		</DialogContent>
	);
}

function BookingActionsCell({ booking }: { booking: BookingViewResponse }) {
	const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
	const [openStatusDialog, setOpenStatusDialog] = useState(false);
	const [openPaymentHistory, setOpenPaymentHistory] = useState(false);
	const [openAssignOrg, setOpenAssignOrg] = useState(false);
	const [openEditDialog, setOpenEditDialog] = useState(false);

	const canEdit =
		booking.bookingStatus === "CHECKED_IN" ||
		booking.bookingStatus === "RESERVED";

	const canAssignOrg =
		(booking.bookingStatus === "CHECKED_IN" || booking.bookingStatus === "RESERVED") &&
		!booking.organizationName;

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<MoreHorizontalIcon className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
					<DialogTrigger asChild>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<EyeIcon className="mr-2 h-4 w-4" />
							View Details
						</DropdownMenuItem>
					</DialogTrigger>
					<BookingDetailsContent booking={booking} />
				</Dialog>

				{canEdit && (
					<Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
						<DialogTrigger asChild>
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
								}}
							>
								<PencilIcon className="mr-2 h-4 w-4" />
								Edit Booking
							</DropdownMenuItem>
						</DialogTrigger>
						<EditBookingContent
							booking={booking}
							onClose={() => setOpenEditDialog(false)}
						/>
					</Dialog>
				)}

				<Dialog open={openStatusDialog} onOpenChange={setOpenStatusDialog}>
					<DialogTrigger asChild>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<EditIcon className="mr-2 h-4 w-4" />
							Update Status
						</DropdownMenuItem>
					</DialogTrigger>
					<ChangeBookingStatus
						booking={booking}
						onClose={() => setOpenStatusDialog(false)}
					/>
				</Dialog>

				<Dialog
					open={openPaymentHistory}
					onOpenChange={setOpenPaymentHistory}
				>
					<DialogTrigger asChild>
						<DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<RotateCcwIcon className="mr-2 h-4 w-4" />
							Payment History
						</DropdownMenuItem>
					</DialogTrigger>
					<PaymentHistoryContent bookingId={booking.id} />
				</Dialog>

				{canAssignOrg && (
					<>
						<DropdownMenuSeparator />
						<Dialog open={openAssignOrg} onOpenChange={setOpenAssignOrg}>
							<DialogTrigger asChild>
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
									}}
								>
									<Building2Icon className="mr-2 h-4 w-4" />
									Assign to Organization
								</DropdownMenuItem>
							</DialogTrigger>
							<AssignToOrgContent
								bookingId={booking.id}
								guestName={booking.guestName}
								setOpen={setOpenAssignOrg}
							/>
						</Dialog>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const columnHelper = createColumnHelper<BookingViewResponse>();

const columns = [
	columnHelper.accessor("customId", {
		header: "ID",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("guestName", {
		header: "Guest Name",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("roomIdentifier", {
		header: "Room",
		cell: (info) => (
			<span className="font-mono text-sm">{info.getValue()}</span>
		),
	}),
	columnHelper.accessor("roomType", {
		header: "Room Type",
		cell: (info) => (
			<div className="flex items-center justify-center bg-[#fff5da] text-[#1c1c1c] p-2 rounded-md">
				{info.getValue()}
			</div>
		),
	}),

	columnHelper.accessor("amountPaid", {
		header: "Amount Paid",
		cell: (info) => formatCurrency(info.getValue()),
	}),

	columnHelper.accessor("bookingStatus", {
		header: "Status",
		cell: (info) => {
			const statusToVariant: Record<BookingStatus, BadgeVariant> = {
				CHECKED_IN: "green",
				CHECKED_OUT: "blue",
				RESERVED: "yellow",
				CANCELLED: "destructive",
			};
			const status = info.getValue();
			const normalizedStatus = status.replace(/_/g, " ").toLowerCase();
			return (
				<Badge className="capitalize" variant={statusToVariant[status]}>
					{normalizedStatus}
				</Badge>
			);
		},
	}),

	columnHelper.display({
		header: "Duration",
		cell: (info) => {
			const checkInDate = new Date(info.row.original.checkInDate);
			const checkOutDate = new Date(info.row.original.checkOutDate);

			// e.g Sep 03, 2025 - Sep 03, 2025

			const options: Intl.DateTimeFormatOptions = {
				month: "short",
				day: "2-digit",
				year: "numeric",
			};

			const formattedCheckIn = checkInDate.toLocaleDateString(
				undefined,
				options,
			);
			const formattedCheckOut = checkOutDate.toLocaleDateString(
				undefined,
				options,
			);

			return (
				<span>
					{formattedCheckIn} - {formattedCheckOut}
				</span>
			);
		},
	}),

	columnHelper.display({
		id: "actions",
		cell: (info) => <BookingActionsCell booking={info.row.original} />,
	}),
];

function BookingList({ table }: { table: TableType<BookingViewResponse> }) {
	return (
		<div className="overflow-hidden rounded-md border">
			<Table>
				<TableHeader className="bg-gray-100">
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id} className="text-gray-500">
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>

				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className="text-gray-600">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={columns.length}>
							<div className="w-full flex items-center justify-between">
								<p>
									{table.getFilteredSelectedRowModel().rows.length} of{" "}
									{table.getFilteredRowModel().rows.length} row(s) selected.
								</p>

								<DataTablePagination table={table} />
							</div>
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	);
}

function BookingsFilter({
	roomTypes,
	queryState,
	setQueryState,
}: {
	roomTypes: string[];
	queryState: {
		bookingStatus:
		| "RESERVED"
		| "CHECKED_OUT"
		| "CHECKED_IN"
		| "CANCELLED"
		| null;
		search: string | null;
		roomType: string | null;
	};
	setQueryState: (state: Partial<typeof queryState>) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [tempFilters, setTempFilters] = useState({
		roomType: queryState.roomType,
		bookingStatus: queryState.bookingStatus,
	});

	// Memoize filter state computations
	const filterStates = useMemo(() => {
		const hasActiveFilters = tempFilters.roomType || tempFilters.bookingStatus;
		const hasAppliedFilters = queryState.bookingStatus || queryState.roomType;
		const appliedFiltersCount = [
			queryState.bookingStatus,
			queryState.roomType,
		].filter(Boolean).length;

		return {
			hasActiveFilters,
			hasAppliedFilters,
			appliedFiltersCount,
		};
	}, [
		tempFilters.roomType,
		tempFilters.bookingStatus,
		queryState.bookingStatus,
		queryState.roomType,
	]);

	// Memoized callback functions to prevent unnecessary re-renders
	const applyFilters = useCallback(() => {
		setQueryState({
			...queryState,
			bookingStatus: tempFilters.bookingStatus,
			roomType: tempFilters.roomType,
		});
		setIsOpen(false);
	}, [
		queryState,
		tempFilters.bookingStatus,
		tempFilters.roomType,
		setQueryState,
	]);

	const clearFilters = useCallback(() => {
		const clearedFilters = {
			roomType: null,
			bookingStatus: null,
		};
		setTempFilters(clearedFilters);
		setQueryState({
			search: queryState.search,
			bookingStatus: null,
			roomType: null,
		});
		setIsOpen(false);
	}, [queryState.search, setQueryState]);

	return (
		<TableFilter open={isOpen} setOpen={(open) => setIsOpen(open)}>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="font-semibold text-sm">Filter Bookings</h4>
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilters}
						className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
					>
						<RotateCcwIcon className="h-3 w-3 mr-1" />
						Clear all
					</Button>
				</div>

				{/* Booking Status Filter */}
				<div className="space-y-2">
					<Label className="text-sm font-medium">Status</Label>
					<Select
						value={tempFilters.bookingStatus ?? ""}
						onValueChange={(value) =>
							setTempFilters({
								...tempFilters,
								bookingStatus:
									value === ""
										? null
										: (value as typeof queryState.bookingStatus),
							})
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="RESERVED">Reserved</SelectItem>
							<SelectItem value="CHECKED_IN">Checked In</SelectItem>
							<SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
							<SelectItem value="CANCELLED">Cancelled</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Room Type Filter */}
				<div className="space-y-2">
					<Label className="text-sm font-medium">Room Type</Label>
					<Select
						value={tempFilters.roomType || ""}
						onValueChange={(value) =>
							setTempFilters({ ...tempFilters, roomType: value || null })
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="All room types" />
						</SelectTrigger>
						<SelectContent>
							{roomTypes.map((roomType) => (
								<SelectItem key={roomType} value={roomType}>
									{roomType}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Filter Summary */}
				{filterStates.hasActiveFilters && (
					<div className="pt-2 border-t">
						<p className="text-xs text-muted-foreground mb-2">
							Active filters:
						</p>
						<div className="flex flex-wrap gap-1">
							{tempFilters.bookingStatus && (
								<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
									Status:{" "}
									{tempFilters.bookingStatus.toLowerCase().replace("_", " ")}
								</span>
							)}
							{tempFilters.roomType && (
								<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
									Room: {tempFilters.roomType}
								</span>
							)}
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsOpen(false)}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button size="sm" onClick={applyFilters} className="flex-1">
						Apply Filters
					</Button>
				</div>
			</div>
		</TableFilter>
	);
}

function BookingsListToolbar({
	rooms,
	roomTypes,
	table,
}: {
	rooms: Array<RoomType>;
	roomTypes: string[];
	table: TableType<BookingViewResponse>;
}) {
	const [queryState, setQueryState] = useQueryStates({
		bookingStatus: parseAsStringLiteral([
			"RESERVED",
			"CHECKED_OUT",
			"CHECKED_IN",
			"CANCELLED",
		]),
		search: parseAsString,
		roomType: parseAsString,
	});

	const [modalStates, setModalStates] = useState({
		checkInModalOpen: false,
		reservationModalOpen: false,
	});

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div className="flex items-center gap-x-2">
				<Button
					size="sm"
					variant="outline"
					data-active={queryState.bookingStatus === null}
					onClick={() => setQueryState({ bookingStatus: null })}
					className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${queryState.bookingStatus === null
						? "bg-primary text-primary-foreground border-primary"
						: ""
						}`}
				>
					All Bookings{" "}
					{queryState.bookingStatus === null &&
						`(${table.getRowCount() * table.getPageCount()})`}
				</Button>

				<Button
					size="sm"
					variant="outline"
					data-active={queryState.bookingStatus === "RESERVED"}
					onClick={() => setQueryState({ bookingStatus: "RESERVED" })}
					className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${queryState.bookingStatus === "RESERVED"
						? "bg-primary text-primary-foreground border-primary"
						: ""
						}`}
				>
					Reservations{" "}
					{queryState.bookingStatus === "RESERVED" &&
						`(${table.getFilteredRowModel().rows.length})`}
				</Button>

				<Button
					size="sm"
					variant="outline"
					data-active={queryState.bookingStatus === "CHECKED_OUT"}
					onClick={() => setQueryState({ bookingStatus: "CHECKED_OUT" })}
					className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${queryState.bookingStatus === "CHECKED_OUT"
						? "bg-primary text-primary-foreground border-primary"
						: ""
						}`}
				>
					Booking history{" "}
					{queryState.bookingStatus === "CHECKED_OUT" &&
						`(${table.getFilteredRowModel().rows.length})`}
				</Button>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search bookings"
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
						value={queryState.search ?? ""}
						onChange={(e) => setQueryState({ search: e.target.value || null })}
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>
				<div className="flex items-center gap-2">
					<BookingsFilter
						roomTypes={roomTypes}
						queryState={queryState}
						setQueryState={setQueryState}
					/>

					{/* Applied Filters Display */}
					{queryState.roomType && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<span>Room Type:</span>
							<span className="bg-primary/10 px-2 py-1 rounded-md font-medium">
								{queryState.roomType}
							</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
								onClick={() => setQueryState({ roomType: null })}
							>
								<XIcon className="h-3 w-3" />
							</Button>
						</div>
					)}
				</div>

				{queryState.bookingStatus === "RESERVED" && (
					<Dialog
						open={modalStates.reservationModalOpen}
						onOpenChange={(open) =>
							setModalStates({ ...modalStates, reservationModalOpen: open })
						}
					>
						<DialogTrigger asChild>
							<Button size={"sm"} className="rounded-xl gap-2">
								<PlusIcon className="w-4 h-4" />
								New Reservation
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add New Reservation</DialogTitle>
								<DialogDescription>
									Fill in the details below to create a new reservation.
								</DialogDescription>
							</DialogHeader>

							<UnifiedBookingForm
								data={{
									rooms,
									roomTypes,
								}}
								mode="reservation"
								setOpen={(open) =>
									setModalStates({
										...modalStates,
										reservationModalOpen: open,
									})
								}
							/>
						</DialogContent>
					</Dialog>
				)}

				<Dialog
					open={modalStates.checkInModalOpen}
					onOpenChange={(open) =>
						setModalStates({ ...modalStates, checkInModalOpen: open })
					}
				>
					<DialogTrigger asChild>
						<Button size={"sm"} className="rounded-xl gap-2">
							<PlusIcon className="w-4 h-4" />
							Create Booking
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Booking</DialogTitle>
							<DialogDescription>
								Fill in the details below to create a new booking.
							</DialogDescription>
						</DialogHeader>

						<UnifiedBookingForm
							data={{ rooms, roomTypes }}
							mode="check-in"
							setOpen={(open) =>
								setModalStates({
									...modalStates,
									checkInModalOpen: open,
								})
							}
						/>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}

export function BookingsPage({
	breadcrumb,
	paginationMeta,
	bookings,
	rooms,
	roomTypes,
}: {
	bookings: BookingViewResponse[];
	rooms: RoomType[];
	roomTypes: string[];
	paginationMeta: Pagination;
	breadcrumb: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();
	const table = useReactTable({
		data: bookings,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		state: {
			pagination,
		},
	});
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

	useEffect(() => {
		setBreadcrumb(breadcrumb);
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumb]);

	return (
		<div className="p-4 space-y-2 md:space-y-4">
			<BookingsListToolbar rooms={rooms} roomTypes={roomTypes} table={table} />
			<BookingList table={table} />
			<SuccessDialog
				open={successDialogOpen.show}
				setOpenAction={(show) =>
					setSuccessDialogOpen({ ...successDialogOpen, show })
				}
				message={successDialogOpen.message}
			/>
		</div>
	);
}
