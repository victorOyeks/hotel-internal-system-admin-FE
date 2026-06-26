"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { ExportDialog } from "@/components/shared/shared-dialogs";
import { TableFilter } from "@/components/shared/table-filter";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { APIOutput } from "@/lib/action-utils";
import { revalidateRoute } from "@/lib/actions";
import type { Pagination } from "@/lib/fetch";
import {
	updateOrderStatus,
	recordRestaurantPayment,
	updateKitchenOrder,
	getCheckedInBookingsForRestaurant,
} from "@/lib/restaurant-actions";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	CheckCircle2Icon,
	ChevronDownIcon,
	CircleAlertIcon,
	ClipboardListIcon,
	CreditCardIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	RotateCcwIcon,
	CalendarIcon,
	LinkIcon,
	PrinterIcon,
} from "lucide-react";
import { printCustomerReceipt, printKitchenTicket } from "@/lib/receipt-printer";
import {
	createParser,
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
	useQueryState,
	useQueryStates,
} from "nuqs";

/** Like parseAsLocalDate but serializes using local date parts (no UTC shift) */
const parseAsLocalDate = createParser({
	parse: (value: string) => {
		const [y, m, d] = value.split("-").map(Number);
		if (!y || !m || !d) return null;
		return new Date(y, m - 1, d);
	},
	serialize: (date: Date) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	},
});
import { useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";

function formatOrderDate(dateStr: string) {
	const date = new Date(dateStr);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 86400000);
	const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

	const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

	if (dateOnly.getTime() === today.getTime()) return `Today, ${time}`;
	if (dateOnly.getTime() === yesterday.getTime()) return `Yesterday, ${time}`;
	return format(date, "MMM d, yyyy") + `, ${time}`;
}

type OrderItem =
	APIOutput<"@get/api/restaurants/restaurant-orders">["data"]["content"][number];

type RestaurantOrdersPageProps = {
	orders: OrderItem[];
	paginationMeta: Pagination;
	hotelName: string;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

export function RestaurantOrdersPage({
	orders,
	paginationMeta,
	breadcrumbs,
	hotelName,
}: RestaurantOrdersPageProps) {
	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="space-y-4 px-4 py-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							F&B Orders
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Manage all F&B orders and track their progress
						</p>
					</div>
					<Link href="/dashboard/create-order">
						<Button size="sm">
							<PlusIcon className="w-4 h-4 mr-2" />
							New Order
						</Button>
					</Link>
				</div>
				<KitchenToolbar />
				<Orders orders={orders} pagination={paginationMeta} hotelName={hotelName} />
			</div>
		</BreadCrumbWrapper>
	);
}

// Kitchen Orders Filter Component
const KitchenOrdersFilter = ({
	queryState,
	setQueryState,
	setOpen,
}: {
	queryState: {
		destination: string | null;
		status: string | null;
		searchText: string | null;
		startDate: Date | null;
		endDate: Date | null;
	};
	setQueryState: (state: Record<string, unknown>) => void;
	setOpen: (open: boolean) => void;
}) => {
	return (
		<div className="space-y-4 min-w-[350px]">
			{/* Destination Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium text-gray-700">Destination</Label>
				<Input
					placeholder="e.g. Poolside, Dining area..."
					value={queryState.destination ?? ""}
					onChange={(e) =>
						setQueryState({ destination: e.target.value || null })
					}
				/>
			</div>

			{/* Status Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium text-gray-700">Status</Label>
				<Select
					value={queryState.status ?? ""}
					onValueChange={(value) =>
						setQueryState({ status: value || null })
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="All Statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="PENDING">Pending</SelectItem>
						<SelectItem value="COMPLETED">Completed</SelectItem>
						<SelectItem value="CANCELLED">Cancelled</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Date Range */}
			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-gray-700">From</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="w-full justify-start text-left font-normal"
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{queryState.startDate
									? format(queryState.startDate, "MMM dd, yyyy")
									: "Start date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={queryState.startDate ?? undefined}
								onSelect={(date) =>
									setQueryState({ startDate: date ?? null })
								}
							/>
						</PopoverContent>
					</Popover>
				</div>

				<div className="space-y-2">
					<Label className="text-sm font-medium text-gray-700">To</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="w-full justify-start text-left font-normal"
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{queryState.endDate
									? format(queryState.endDate, "MMM dd, yyyy")
									: "End date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={queryState.endDate ?? undefined}
								onSelect={(date) =>
									setQueryState({ endDate: date ?? null })
								}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-2 pt-2">
				<Button
					variant="outline"
					className="flex-1"
					onClick={() => {
						setQueryState({
							destination: null,
							status: null,
							searchText: null,
							startDate: null,
							endDate: null,
						});
						setOpen(false);
					}}
				>
					<RotateCcwIcon className="mr-2 h-4 w-4" />
					Reset
				</Button>
				<Button className="flex-1" onClick={() => setOpen(false)}>
					Apply Filters
				</Button>
			</div>
		</div>
	);
};

function KitchenToolbar() {
	const [queryState, setQueryState] = useQueryStates({
		status: parseAsStringLiteral(["COMPLETED", "CANCELLED", "PENDING"]),
		destination: parseAsString,
		searchText: parseAsString,
		startDate: parseAsLocalDate,
		endDate: parseAsLocalDate,
		page: parseAsInteger.withDefault(1),
		size: parseAsInteger.withDefault(10),
	});

	const [filterOpen, setFilterOpen] = useState(false);

	const appliedFiltersCount = useMemo(() => {
		return (
			(queryState.destination ? 1 : 0) +
			(queryState.status && queryState.status !== "COMPLETED" ? 1 : 0) +
			(queryState.searchText ? 1 : 0) +
			(queryState.startDate ? 1 : 0) +
			(queryState.endDate ? 1 : 0)
		);
	}, [
		queryState.destination,
		queryState.status,
		queryState.searchText,
		queryState.startDate,
		queryState.endDate,
	]);

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div className="flex items-center gap-x-2">
				{(
					[
						{ label: "All Orders", value: null },
						{ label: "Pending", value: "PENDING" },
						{ label: "Completed", value: "COMPLETED" },
						{ label: "Cancelled", value: "CANCELLED" },
					] as const
				).map((tab) => (
					<Button
						key={tab.label}
						size="sm"
						variant="outline"
						data-active={queryState.status === tab.value}
						onClick={() => setQueryState({ status: tab.value, page: 1 })}
						className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
							queryState.status === tab.value
								? "bg-primary text-primary-foreground border-primary"
								: ""
						}`}
					>
						{tab.label}
					</Button>
				))}
			</div>

			<div className="flex items-center gap-x-2">
				<div className="relative">
					<input
						type="text"
						placeholder="Search orders..."
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
						value={queryState.searchText ?? ""}
						onChange={(e) =>
							setQueryState({ searchText: e.target.value || null })
						}
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				{/* Applied Filters Chips */}
				{appliedFiltersCount > 0 && (
					<div className="flex items-center gap-1">
						{queryState.destination && (
							<Badge
								variant="green"
								className="text-xs cursor-pointer"
								onClick={() => setQueryState({ destination: null })}
							>
								Destination: {queryState.destination}
								<button
									type="button"
									className="ml-1 hover:bg-gray-200 rounded"
								>
									×
								</button>
							</Badge>
						)}
						{queryState.status && queryState.status !== "COMPLETED" && (
							<Badge
								variant="green"
								className="text-xs cursor-pointer"
								onClick={() => setQueryState({ status: null })}
							>
								Status: {queryState.status}
								<button
									type="button"
									className="ml-1 hover:bg-gray-200 rounded"
								>
									×
								</button>
							</Badge>
						)}
						{queryState.searchText && (
							<Badge
								variant="green"
								className="text-xs cursor-pointer"
								onClick={() => setQueryState({ searchText: null })}
							>
								Search: {queryState.searchText}
								<button
									type="button"
									className="ml-1 hover:bg-gray-200 rounded"
								>
									×
								</button>
							</Badge>
						)}
						{queryState.startDate && (
							<Badge
								variant="green"
								className="text-xs cursor-pointer"
								onClick={() => setQueryState({ startDate: null })}
							>
								From: {format(queryState.startDate, "MMM dd")}
								<button
									type="button"
									className="ml-1 hover:bg-gray-200 rounded"
								>
									×
								</button>
							</Badge>
						)}
						{queryState.endDate && (
							<Badge
								variant="green"
								className="text-xs cursor-pointer"
								onClick={() => setQueryState({ endDate: null })}
							>
								To: {format(queryState.endDate, "MMM dd")}
								<button
									type="button"
									className="ml-1 hover:bg-gray-200 rounded"
								>
									×
								</button>
							</Badge>
						)}
					</div>
				)}

				<div className="flex items-center gap-2">
					<TableFilter
						open={filterOpen}
						setOpen={setFilterOpen}
						count={appliedFiltersCount}
					>
						<KitchenOrdersFilter
							queryState={{
								destination: queryState.destination,
								status: queryState.status,
								searchText: queryState.searchText,
								startDate: queryState.startDate,
								endDate: queryState.endDate,
							}}
							setQueryState={setQueryState}
							setOpen={setFilterOpen}
						/>
					</TableFilter>

					<ExportDialog
						onSubmitAction={() => Promise.resolve()}
						open={false}
						setOpenAction={() => {}}
					/>
				</div>
			</div>
		</div>
	);
}

function OrderCard({
	order,
	onClick,
}: {
	order: OrderItem;
	onClick: () => void;
}) {
	const statusToVariant = {
		COMPLETED: "green",
		CANCELLED: "red",
		PENDING: "blue",
	} satisfies Record<string, BadgeVariant>;

	const [orderStatus, setOrderStatus] = useState(order.status);

	const { mutate, isPending } = useMutation({
		mutationKey: ["update-order-status", order.id],
		mutationFn: async (newStatus: "COMPLETED" | "CANCELLED" | "PENDING") => {
			const response = await updateOrderStatus({
				orderId: order.id,
				status: newStatus,
			});
			if (!response.success) {
				throw new Error(response.error);
			}
			return response;
		},
		onSuccess: (data) => {
			toast.success("Order status updated successfully", {
				description: data.data,
			});
			revalidateRoute("/restaurant/orders");
		},
		onMutate: (status) => {
			toast.loading("Updating order status...");
			setOrderStatus(status);
		},
		onError: (error) => {
			toast.error("Failed to update order status", {
				description: error.message,
			});
			setOrderStatus(order.status);
		},
		onSettled: () => {
			toast.dismiss();
		},
	});

	const firstItem = order.orderItems[0];
	const remainingItemsCount = order.orderItems.length - 1;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: true
		<div
			className="border border-primary-5/20 rounded-2xl p-4 bg-white h-full flex flex-col justify-between cursor-pointer hover:border-primary-5/40 transition-colors"
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClick();
				}
			}}
			key={order.id}
		>
			<div>
				<div className="flex justify-between items-center">
					<Badge
						variant={
							statusToVariant[orderStatus as keyof typeof statusToVariant] ||
							"blue"
						}
						className="capitalize"
					>
						{orderStatus.replaceAll("_", " ").toLowerCase()}
					</Badge>

					{order.status !== "COMPLETED" && (
						<DropdownMenu modal={false}>
							<DropdownMenuTrigger disabled={isPending} asChild>
								<button
									type="button"
									className="flex items-center gap-x-1 text-xs bg-muted text-muted-foreground rounded-full px-2 py-1"
									onClick={(e) => e.stopPropagation()}
								>
									Update <ChevronDownIcon className="size-4" />
								</button>
							</DropdownMenuTrigger>

							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Button
										size="sm"
										variant="ghost"
										className="w-full justify-between"
										onClick={(e) => {
											e.stopPropagation();
											mutate("PENDING");
										}}
									>
										New order{" "}
										<Checkbox
											checked={orderStatus === "PENDING"}
											onCheckedChange={(checked) =>
												mutate(checked ? "PENDING" : orderStatus)
											}
										/>
									</Button>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Button
										size="sm"
										variant="ghost"
										className="w-full justify-between"
										onClick={(e) => {
											e.stopPropagation();
											mutate("COMPLETED");
										}}
									>
										Completed{" "}
										<Checkbox
											checked={orderStatus === "COMPLETED"}
											onCheckedChange={(checked) =>
												mutate(checked ? "COMPLETED" : orderStatus)
											}
										/>
									</Button>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive" asChild>
									<Button
										size="sm"
										variant="ghost"
										className="w-full justify-between"
										onClick={(e) => {
											e.stopPropagation();
											mutate("CANCELLED");
										}}
									>
										Cancel{" "}
										<Checkbox
											checked={orderStatus === "CANCELLED"}
											onCheckedChange={(checked) =>
												mutate(checked ? "CANCELLED" : orderStatus)
											}
										/>
									</Button>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				<div className="space-y-1">
					<p className="font-medium text-lg mt-2">Order #{order.customId}</p>
					<p className="text-sm text-muted-foreground">{order.destination}</p>
					<p className="text-sm text-muted-foreground">
						{formatOrderDate(order.createdAt)}
					</p>
				</div>
				<hr className="my-4 border-t border-primary-5/20" />
			</div>

			<div className="space-y-2">
				<div className="flex justify-between items-center text-sm font-semibold">
					<p>{order.orderItems.length} items</p>
					<p>Total: {formatCurrency(order.totalAmount)}</p>
				</div>

				<div className={`flex items-center gap-1.5 text-xs font-medium ${(order.amountRemaining ?? order.totalAmount) <= 0 ? "text-green-600" : "text-red-500"}`}>
					{(order.amountRemaining ?? order.totalAmount) <= 0 ? (
						<>
							<CheckCircle2Icon className="size-3.5" />
							<span>Paid</span>
						</>
					) : (
						<>
							<CircleAlertIcon className="size-3.5" />
							<span>Unpaid</span>
						</>
					)}
				</div>

				{firstItem && (
					<div className="flex justify-between items-center text-sm">
						<div>
							<p className="font-medium">{firstItem.itemName}</p>
							<p className="text-muted-foreground text-xs font-medium">
								{formatCurrency(firstItem.price)}
							</p>
						</div>
						<p className="font-medium">x{firstItem.quantity}</p>
					</div>
				)}

				{remainingItemsCount > 0 && (
					<div className="text-sm text-muted-foreground font-medium pt-1">
						+ {remainingItemsCount} more item{remainingItemsCount !== 1 ? "s" : ""}...
					</div>
				)}
			</div>
		</div>
	);
}

const PAYMENT_METHODS = [
	{ value: "CASH", label: "Cash" },
	{ value: "CARD", label: "Card" },
	{ value: "BANK_TRANSFER", label: "Bank Transfer" },
	{ value: "MOBILE_MONEY", label: "Mobile Money" },
	{ value: "CREDIT_CARD", label: "Credit Card" },
	{ value: "DEBIT_CARD", label: "Debit Card" },
	{ value: "ONLINE_PAYMENT", label: "Online Payment" },
	{ value: "OTHERS", label: "Other" },
] as const;

function RecordPaymentForm({
	order,
	onSuccess,
	onCancel,
}: {
	order: OrderItem;
	onSuccess: () => void;
	onCancel: () => void;
}) {
	const [amount, setAmount] = useState<string>("");
	const [method, setMethod] = useState("CASH");
	const [reference, setReference] = useState("");
	const [notes, setNotes] = useState("");

	const balanceDue = order.amountRemaining ?? order.totalAmount;

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			const res = await recordRestaurantPayment({
				orderId: order.id,
				amount: Number(amount),
				method,
				reference: reference || undefined,
				notes: notes || undefined,
			});
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: async () => {
			toast.success("Payment recorded successfully");
			await revalidateRoute("/restaurant/orders");
			onSuccess();
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to record payment");
		},
	});

	const isValid = Number(amount) > 0 && Number(amount) <= balanceDue;

	return (
		<div className="space-y-3">
			<div>
				<Label className="text-xs text-gray-600">Amount (NGN) *</Label>
				<Input
					type="number"
					step="0.01"
					min="0"
					max={balanceDue}
					placeholder={`Max: ${formatCurrency(balanceDue)}`}
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className="mt-1 h-9"
				/>
			</div>

			<div>
				<Label className="text-xs text-gray-600">Payment Method *</Label>
				<Select value={method} onValueChange={setMethod}>
					<SelectTrigger className="mt-1 h-9">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{PAYMENT_METHODS.map((m) => (
							<SelectItem key={m.value} value={m.value}>
								{m.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label className="text-xs text-gray-600">Reference</Label>
				<Input
					placeholder="e.g. TXN20250215001"
					value={reference}
					onChange={(e) => setReference(e.target.value)}
					className="mt-1 h-9"
				/>
			</div>

			<div>
				<Label className="text-xs text-gray-600">Notes</Label>
				<Input
					placeholder="Payment notes..."
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					className="mt-1 h-9"
				/>
			</div>

			<div className="flex gap-2 pt-1">
				<Button
					variant="outline"
					size="sm"
					className="flex-1"
					onClick={onCancel}
					disabled={isPending}
				>
					Cancel
				</Button>
				<Button
					size="sm"
					className="flex-1"
					disabled={!isValid || isPending}
					onClick={() => mutate()}
				>
					{isPending && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
					Record Payment
				</Button>
			</div>
		</div>
	);
}

function OrderDetailSheet({
	order,
	hotelName,
	onPaymentRecorded,
	onOrderUpdated,
}: {
	order: OrderItem;
	hotelName: string;
	onPaymentRecorded?: () => void;
	onOrderUpdated?: (updated: OrderItem) => void;
}) {
	const [showPaymentForm, setShowPaymentForm] = useState(false);
	const router = useRouter();
	const statusToVariant = {
		COMPLETED: "green",
		CANCELLED: "red",
		PENDING: "blue",
	} satisfies Record<string, BadgeVariant>;

	const isFullyPaid = (order.amountRemaining ?? order.totalAmount) <= 0;
	const hasBalance = !isFullyPaid;

	// Fetch checked-in bookings for booking selector
	const { data: checkedInBookings, isLoading: isLoadingBookings } = useQuery({
		queryKey: ["restaurant", "checked-in-bookings"],
		queryFn: async () => {
			const result = await getCheckedInBookingsForRestaurant();
			if (!result.success) return [];
			const data = result.data;
			return (Array.isArray(data) ? data : []) as Array<{ bookingId: string; customId: string; guestName: string; guestPhoneNumber: string; roomIdentifier: string }>;
		},
	});

	const { mutate: updateBooking, isPending: isUpdatingBooking } = useMutation({
		mutationKey: ["update-order-booking", order.id],
		mutationFn: async (bookingId: string) => {
			const response = await updateKitchenOrder(order.id, { bookingId });
			if (!response.success) throw new Error(response.error);
			return response.data;
		},
		onSuccess: (updatedOrder) => {
			toast.success("Booking updated successfully");
			onOrderUpdated?.(updatedOrder as OrderItem);
			revalidateRoute("/restaurant/orders");
			router.refresh();
		},
		onError: (error) => {
			toast.error("Failed to update booking", { description: error.message });
		},
	});

	return (
		<SheetContent>
			<SheetHeader>
				<SheetTitle>Order #{order.customId}</SheetTitle>
				<SheetDescription>
					Complete order information and items
				</SheetDescription>
			</SheetHeader>

			{/* Print Actions */}
			<div className="flex gap-2 px-4 pb-2 pt-1 border-b">
				<Button
					variant="outline"
					size="sm"
					className="flex-1 text-xs"
					onClick={() =>
						printCustomerReceipt({
							hotelName,
							orderId: order.customId,
							destination: order.destination,
							items: order.orderItems.map((item) => ({
								name: item.itemName,
								quantity: item.quantity,
								price: item.price,
								itemType: item.itemType,
							})),
							total: order.totalAmount,
							note: order.note,
							isPaid: (order.amountRemaining ?? order.totalAmount) <= 0,
							paymentMethod: order.paymentMethod ?? undefined,
							paymentReference: order.paymentReference ?? undefined,
							guestBookingId: order.bookingId ?? undefined,
							printedAt: new Date(),
						})
					}
				>
					<PrinterIcon className="h-3.5 w-3.5 mr-1.5" />
					Customer Receipt
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="flex-1 text-xs"
					onClick={() =>
						printKitchenTicket({
							hotelName,
							orderId: order.customId,
							destination: order.destination,
							items: order.orderItems.map((item) => ({
								name: item.itemName,
								quantity: item.quantity,
								price: item.price,
								itemType: item.itemType,
							})),
							total: order.totalAmount,
							note: order.note,
							isPaid: (order.amountRemaining ?? order.totalAmount) <= 0,
							printedAt: new Date(),
						})
					}
				>
					<PrinterIcon className="h-3.5 w-3.5 mr-1.5" />
					Kitchen Ticket
				</Button>
			</div>

			<ScrollArea className="h-[calc(100vh-160px)] px-4">
				<div className="space-y-4 pb-6">
					{/* Order Status */}
					<div className="bg-gray-50 rounded-lg p-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold text-gray-700">
								Order Status
							</h3>
							<Badge
								variant={
									statusToVariant[
									order.status as keyof typeof statusToVariant
									] || "blue"
								}
								className="capitalize"
							>
								{order.status.replaceAll("_", " ").toLowerCase()}
							</Badge>
						</div>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600">Order ID:</span>
								<span className="font-medium">{order.customId}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Date & Time:</span>
								<span className="font-medium">
									{format(
										new Date(order.createdAt),
										"MMM dd, yyyy 'at' hh:mm a",
									)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Destination:</span>
								<span className="font-medium">{order.destination}</span>
							</div>
							{order.note && (
								<div className="pt-2 border-t border-gray-200">
									<span className="text-gray-600 block mb-1">Order Note:</span>
									<p className="font-medium text-gray-900 bg-white rounded p-2 text-sm">
										{order.note}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Booking Assignment */}
					{order.status !== "CANCELLED" && (
						<div className="bg-gray-50 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-3">
								<LinkIcon className="h-4 w-4 text-gray-500" />
								<h3 className="text-sm font-semibold text-gray-700">
									Linked Booking
								</h3>
							</div>
							<Select
								value={order.bookingId || "__NONE__"}
								onValueChange={(value) => {
									updateBooking(value === "__NONE__" ? "" : value);
								}}
								disabled={isUpdatingBooking || isFullyPaid}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder={isLoadingBookings ? "Loading..." : "No booking linked"} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__NONE__">
										No booking (walk-in)
									</SelectItem>
									{checkedInBookings?.map((booking) => (
										<SelectItem key={booking.bookingId} value={booking.bookingId}>
											{booking.customId} - {booking.guestName}
											{booking.roomIdentifier ? ` (Room ${booking.roomIdentifier})` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{isFullyPaid && (
								<p className="text-xs text-muted-foreground mt-2">
									Cannot change booking for fully paid orders
								</p>
							)}
							{isUpdatingBooking && (
								<p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
									<Loader2Icon className="h-3 w-3 animate-spin" />
									Updating...
								</p>
							)}
						</div>
					)}

					{/* Payment Details */}
					<div className="bg-gray-50 rounded-lg p-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold text-gray-700">
								Payment Details
							</h3>
							<Badge
								variant={isFullyPaid ? "green" : "red"}
								className="capitalize"
							>
								{isFullyPaid ? "Paid" : "Unpaid"}
							</Badge>
						</div>
						<div className="space-y-2 text-sm">
							{order.paymentMethod && (
								<div className="flex justify-between">
									<span className="text-gray-600">Payment Method:</span>
									<span className="font-medium capitalize">
										{order.paymentMethod.replaceAll("_", " ").toLowerCase()}
									</span>
								</div>
							)}
							{order.paymentReference && (
								<div className="flex justify-between">
									<span className="text-gray-600">Reference:</span>
									<span className="font-medium">{order.paymentReference}</span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-gray-600">Amount Paid:</span>
								<span className="font-medium text-green-700">
									{formatCurrency(order.amountPaid ?? 0)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Balance Due:</span>
								<span className={`font-medium ${(order.amountRemaining ?? 0) > 0 ? "text-red-600" : "text-green-700"}`}>
									{formatCurrency(order.amountRemaining ?? 0)}
								</span>
							</div>
						</div>

						{hasBalance && !showPaymentForm && (
							<Button
								size="sm"
								className="w-full mt-3"
								onClick={() => setShowPaymentForm(true)}
							>
								<CreditCardIcon className="h-4 w-4 mr-2" />
								Record Payment
							</Button>
						)}

						{showPaymentForm && (
							<div className="mt-3 pt-3 border-t border-gray-200">
								<RecordPaymentForm
									order={order}
									onSuccess={() => {
										setShowPaymentForm(false);
										onPaymentRecorded?.();
									}}
									onCancel={() => setShowPaymentForm(false)}
								/>
							</div>
						)}
					</div>

					{/* Order Items */}
					<div>
						<h3 className="text-sm font-semibold text-gray-700 mb-3">
							Order Items
						</h3>
						<div className="space-y-3">
							{order.orderItems.map((item, index) => (
								<div
									key={`${item.itemName}-${index}`}
									className="bg-white border border-gray-200 rounded-lg p-4"
								>
									<div className="flex justify-between items-start mb-2">
										<div className="flex-1">
											<h4 className="font-semibold text-gray-900">
												{item.itemName}
											</h4>
											<p className="text-sm text-gray-500 mt-1">
												{formatCurrency(item.price)} × {item.quantity}
											</p>
										</div>
										<div className="text-right">
											<p className="text-xs text-gray-500">Subtotal</p>
											<p className="font-bold text-gray-900">
												{formatCurrency(item.total)}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Order Summary */}
					<div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
						<h3 className="text-sm font-semibold text-gray-700 mb-3">
							Order Summary
						</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600">Total Items:</span>
								<span className="font-medium">
									{order.orderItems.reduce(
										(sum, item) => sum + item.quantity,
										0,
									)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Number of Dishes:</span>
								<span className="font-medium">{order.orderItems.length}</span>
							</div>
							<div className="border-t border-gray-300 my-2 pt-2" />
							<div className="flex justify-between items-center">
								<span className="font-semibold text-gray-900 text-base">
									Total Amount:
								</span>
								<span className="font-bold text-lg text-primary">
									{formatCurrency(order.totalAmount)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</ScrollArea>
		</SheetContent>
	);
}

function Orders({
	orders,
	pagination,
	hotelName,
}: {
	orders: OrderItem[];
	pagination: Pagination;
	hotelName: string;
}) {
	const [localPagination, setLocalPagination] = useQueryState(
		"page",
		parseAsInteger.withDefault(1),
	);
	const [orderDetailState, setOrderDetailState] = useState<null | OrderItem>(
		null,
	);
	return (
		<div className="space-y-4">
			{orders.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{orders.map((order) => (
						<div key={order.id} className="col-span-1">
							<OrderCard
								order={order}
								onClick={() => setOrderDetailState(order)}
							/>
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
					<ClipboardListIcon className="size-10 mb-3 opacity-40" />
					<p className="font-medium text-gray-900">No orders found</p>
					<p className="text-sm mt-1">
						Orders will appear here once they are placed.
					</p>
				</div>
			)}
			<div className="w-full flex items-center justify-between">
				<span className="text-sm text-gray-500">
					Page {pagination.pageNumber} of {pagination.totalPages}
				</span>
				<DataTablePagination
					pageIndex={pagination.pageNumber - 1}
					pageCount={pagination.totalPages}
					canNextPage={!pagination.last}
					canPreviousPage={!pagination.first}
					nextPage={() => {
						setLocalPagination(localPagination + 1);
					}}
					previousPage={() => {
						setLocalPagination(localPagination - 1);
					}}
					setPageIndex={(pageIndex: number) => {
						setLocalPagination(pageIndex + 1);
					}}
				/>
			</div>
			{orderDetailState && (
				<Sheet
					open={!!orderDetailState}
					onOpenChange={(open) => {
						if (!open) setOrderDetailState(null);
					}}
				>
					<OrderDetailSheet
						order={orderDetailState}
						hotelName={hotelName}
						onPaymentRecorded={() => setOrderDetailState(null)}
						onOrderUpdated={(updated) => setOrderDetailState(updated)}
					/>
				</Sheet>
			)}
		</div>
	);
}
