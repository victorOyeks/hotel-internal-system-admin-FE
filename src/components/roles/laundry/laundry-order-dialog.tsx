"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createLaundryOrder,
	updateLaundryOrder,
	getCheckedInBookingsForLaundry,
	getLaundryItems,
	recordLaundryPayment,
} from "@/lib/laundry-actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Loader2Icon,
	PlusCircleIcon,
	TrashIcon,
	ShirtIcon,
	ClockIcon,
	WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SERVICE_TYPES = [
	{ value: "WASH_ONLY", label: "Wash Only" },
	{ value: "WASH_AND_IRON", label: "Wash & Iron" },
	{ value: "WASH_AND_FOLD", label: "Wash & Fold" },
	{ value: "DRY_CLEAN", label: "Dry Clean" },
	{ value: "IRON_ONLY", label: "Iron Only" },
	{ value: "STEAM_PRESS", label: "Steam Press" },
	{ value: "STAIN_REMOVAL", label: "Stain Removal" },
	{ value: "HAND_WASH", label: "Hand Wash" },
	{ value: "WASH_IRON_AND_PACK", label: "Wash, Iron & Pack" },
] as const;

const URGENCY_LEVELS = [
	{ value: "STANDARD", label: "Standard", desc: "24-48 hours", color: "bg-green-100 text-green-800" },
	{ value: "EXPRESS", label: "Express", desc: "12-24 hours (1.5x)", color: "bg-amber-100 text-amber-800" },
	{ value: "SAME_DAY", label: "Same Day", desc: "6-12 hours (2x)", color: "bg-orange-100 text-orange-800" },
	{ value: "URGENT", label: "Urgent", desc: "3-6 hours (3x)", color: "bg-red-100 text-red-800" },
] as const;

const PAYMENT_METHODS = [
	{ value: "CASH", label: "Cash" },
	{ value: "CARD", label: "Card" },
	{ value: "BANK_TRANSFER", label: "Bank Transfer" },
	{ value: "MOBILE_MONEY", label: "Mobile Money" },
] as const;

const SERVICE_PRICE_MAP: Record<string, string> = {
	WASH_ONLY: "washOnlyPrice",
	WASH_AND_IRON: "washAndIronPrice",
	WASH_AND_FOLD: "washAndFoldPrice",
	DRY_CLEAN: "dryCleanPrice",
	IRON_ONLY: "ironOnlyPrice",
	STEAM_PRESS: "steamPressPrice",
	STAIN_REMOVAL: "stainRemovalPrice",
	HAND_WASH: "handWashPrice",
	WASH_IRON_AND_PACK: "washIronAndPackPrice",
};

const orderItemSchema = z.object({
	laundryItemId: z.string().min(1, "Please select an item"),
	quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
	serviceType: z.string().min(1, "Select a service type"),
	itemColor: z.string().optional(),
	brandOrLabel: z.string().optional(),
	conditionNotes: z.string().optional(),
	specialInstructions: z.string().optional(),
});

const laundryOrderSchema = z.object({
	bookingId: z.string().optional(),
	customerName: z.string().min(1, "Customer name is required"),
	customerPhone: z.string().optional(),
	customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
	roomIdentifier: z.string().optional(),
	urgency: z.string().min(1, "Select urgency level"),
	items: z.array(orderItemSchema).min(1, "At least one item is required"),
	specialInstructions: z.string().optional(),
	customerNotes: z.string().optional(),
	collectDeposit: z.boolean().optional(),
	depositAmount: z.coerce.number().min(0).optional(),
	depositMethod: z.string().optional(),
	depositReference: z.string().optional(),
});

type LaundryOrderFormData = z.infer<typeof laundryOrderSchema>;

type CheckedInBooking = {
	bookingId: string;
	customId: string;
	guestName: string;
	guestPhoneNumber?: string;
	roomIdentifier?: string;
};

type EditOrderData = {
	id: string;
	orderNumber: string;
	status: string;
	bookingId?: string;
	customerName: string;
	customerPhone?: string;
	customerEmail?: string;
	roomIdentifier?: string;
	urgency: string;
	specialInstructions?: string;
	customerNotes?: string;
	items: Array<{
		laundryItemId: string;
		quantity: number;
		serviceType: string;
		itemColor?: string;
		brandOrLabel?: string;
		conditionNotes?: string;
		specialInstructions?: string;
	}>;
};

type LaundryOrderDialogProps = {
	trigger?: React.ReactNode;
	onSuccess?: () => void;
	editOrder?: EditOrderData;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export function LaundryOrderDialog({
	trigger,
	onSuccess,
	editOrder,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
}: LaundryOrderDialogProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;
	const setOpen = controlledOnOpenChange ?? setInternalOpen;
	const isEditMode = !!editOrder;
	const isPickedUp = editOrder?.status === "PICKED_UP";
	const queryClient = useQueryClient();
	const router = useRouter();

	const defaultItem = {
		laundryItemId: "",
		quantity: 1,
		serviceType: "",
		itemColor: "",
		brandOrLabel: "",
		conditionNotes: "",
		specialInstructions: "",
	};

	const form = useForm<LaundryOrderFormData>({
		resolver: zodResolver(laundryOrderSchema),
		defaultValues: {
			customerName: editOrder?.customerName ?? "",
			customerPhone: editOrder?.customerPhone ?? "",
			customerEmail: editOrder?.customerEmail ?? "",
			roomIdentifier: editOrder?.roomIdentifier ?? "",
			bookingId: editOrder?.bookingId ?? "",
			urgency: editOrder?.urgency ?? "STANDARD",
			items: editOrder?.items?.length
				? editOrder.items.map((item) => ({
						laundryItemId: item.laundryItemId,
						quantity: item.quantity,
						serviceType: item.serviceType,
						itemColor: item.itemColor ?? "",
						brandOrLabel: item.brandOrLabel ?? "",
						conditionNotes: item.conditionNotes ?? "",
						specialInstructions: item.specialInstructions ?? "",
					}))
				: [defaultItem],
			specialInstructions: editOrder?.specialInstructions ?? "",
			customerNotes: editOrder?.customerNotes ?? "",
			collectDeposit: false,
			depositAmount: 0,
			depositMethod: "CASH",
			depositReference: "",
		},
	});

	// Reset form when editOrder changes (e.g. opening edit for a different order)
	useEffect(() => {
		if (editOrder && open) {
			form.reset({
				customerName: editOrder.customerName ?? "",
				customerPhone: editOrder.customerPhone ?? "",
				customerEmail: editOrder.customerEmail ?? "",
				roomIdentifier: editOrder.roomIdentifier ?? "",
				bookingId: editOrder.bookingId ?? "",
				urgency: editOrder.urgency ?? "STANDARD",
				items: editOrder.items?.length
					? editOrder.items.map((item) => ({
							laundryItemId: item.laundryItemId,
							quantity: item.quantity,
							serviceType: item.serviceType,
							itemColor: item.itemColor ?? "",
							brandOrLabel: item.brandOrLabel ?? "",
							conditionNotes: item.conditionNotes ?? "",
							specialInstructions: item.specialInstructions ?? "",
						}))
					: [defaultItem],
				specialInstructions: editOrder.specialInstructions ?? "",
				customerNotes: editOrder.customerNotes ?? "",
				collectDeposit: false,
				depositAmount: 0,
				depositMethod: "CASH",
				depositReference: "",
			});
		}
	}, [editOrder, open]);

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const { data: laundryItems } = useQuery({
		queryKey: ["laundry", "items", "active"],
		queryFn: async () => {
			const result = await getLaundryItems(true);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: open,
	});

	const { data: checkedInBookings, isLoading: isLoadingBookings } = useQuery({
		queryKey: ["laundry", "checked-in-bookings"],
		queryFn: async () => {
			const result = await getCheckedInBookingsForLaundry();
			if (!result.success) throw new Error(result.error);
			const data = result.data;
			return (Array.isArray(data) ? data : []) as CheckedInBooking[];
		},
		enabled: open,
	});

	const selectedBookingId = form.watch("bookingId");
	const isWalkIn = !selectedBookingId;
	const collectDeposit = form.watch("collectDeposit");

	// Auto-fill customer info when booking is selected
	useEffect(() => {
		if (!selectedBookingId || !checkedInBookings?.length) return;
		const selected = checkedInBookings.find(
			(b) => b.bookingId === selectedBookingId,
		);
		if (!selected) return;

		form.setValue("customerName", selected.guestName || "");
		form.setValue("customerPhone", selected.guestPhoneNumber || "");
		form.setValue("roomIdentifier", selected.roomIdentifier || "");
	}, [selectedBookingId, checkedInBookings, form]);

	const mutation = useMutation({
		mutationFn: async (data: LaundryOrderFormData) => {
			const payload = {
				customerName: data.customerName,
				customerPhone: data.customerPhone || undefined,
				customerEmail: data.customerEmail || undefined,
				roomIdentifier: data.roomIdentifier || undefined,
				urgency: data.urgency,
				specialInstructions: data.specialInstructions || undefined,
				customerNotes: data.customerNotes || undefined,
				items: data.items.map((item) => ({
					...item,
					itemColor: item.itemColor || undefined,
					brandOrLabel: item.brandOrLabel || undefined,
					conditionNotes: item.conditionNotes || undefined,
					specialInstructions: item.specialInstructions || undefined,
				})),
				bookingId: data.bookingId || "",
			};

			if (isEditMode) {
				const result = await updateLaundryOrder(editOrder!.id, payload);
				if (!result.success) throw new Error(result.error);
				return result.data;
			}

			const result = await createLaundryOrder(payload);
			if (!result.success) throw new Error(result.error);

			// If deposit requested, record payment after order creation
			if (
				data.collectDeposit &&
				data.depositAmount &&
				data.depositAmount > 0
			) {
				const paymentResult = await recordLaundryPayment({
					laundryOrderId: result.data.id,
					amount: data.depositAmount,
					method: data.depositMethod || "CASH",
					type: "DEPOSIT",
					reference: data.depositReference || undefined,
					notes: "Deposit collected at order creation",
				});
				if (!paymentResult.success) {
					toast.warning("Order created but deposit recording failed", {
						description: paymentResult.error,
					});
				}
			}

			return result.data;
		},
		onSuccess: (response: any) => {
			toast.success(
				isEditMode
					? "Laundry order updated successfully"
					: "Laundry order created successfully",
				{ description: `Order #${response.orderNumber}` },
			);
			const bookingId = response.bookingId || selectedBookingId;
			if (bookingId) {
				queryClient.invalidateQueries({ queryKey: ["folio", bookingId] });
			}
			queryClient.invalidateQueries({ queryKey: ["laundry", "orders"] });
			queryClient.invalidateQueries({
				queryKey: ["laundry", "dashboard-stats"],
			});
			if (isEditMode) {
				queryClient.invalidateQueries({
					queryKey: ["laundry", "orders", editOrder!.id],
				});
			}
			router.refresh();
			setOpen(false);
			if (!isEditMode) form.reset();
			onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(
				error.message ||
					(isEditMode
						? "Failed to update laundry order"
						: "Failed to create laundry order"),
			);
		},
	});

	const selectedUrgency = form.watch("urgency");
	const urgencyInfo = URGENCY_LEVELS.find((u) => u.value === selectedUrgency);

	// Calculate estimated total
	const watchedItems = form.watch("items");
	const estimatedTotal = watchedItems.reduce((total, item) => {
		const laundryItem = laundryItems?.find(
			(li: any) => li.id === item.laundryItemId,
		);
		if (!laundryItem || !item.serviceType) return total;
		const priceKey = SERVICE_PRICE_MAP[item.serviceType];
		const basePrice = laundryItem[priceKey] || 0;
		const urgencyMultiplier =
			selectedUrgency === "EXPRESS"
				? laundryItem.expressMultiplier || 1.5
				: selectedUrgency === "SAME_DAY"
					? laundryItem.sameDayMultiplier || 2.0
					: selectedUrgency === "URGENT"
						? laundryItem.urgentMultiplier || 3.0
						: 1;
		return total + basePrice * (item.quantity || 1) * urgencyMultiplier;
	}, 0);

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat("en-NG", {
			style: "currency",
			currency: "NGN",
			minimumFractionDigits: 0,
		}).format(amount);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{!isEditMode && (
				<DialogTrigger asChild>
					{trigger || (
						<Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
							<PlusCircleIcon className="w-4 h-4 mr-2" />
							New Laundry Order
						</Button>
					)}
				</DialogTrigger>
			)}
			<DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden max-w-2xl p-0">
				{/* Header */}
				<div className="sticky top-0 z-10 bg-background border-b px-6 pt-6 pb-4">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold flex items-center gap-2">
							<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
								<ShirtIcon className="w-4 h-4" />
							</div>
							{isEditMode
								? `Edit Order #${editOrder.orderNumber}`
								: "New Laundry Order"}
						</DialogTitle>
						<DialogDescription>
							{isEditMode
								? isPickedUp
									? "This order has been picked up — only customer info and notes can be changed"
									: "Edit the order details below"
								: "Process a new laundry order for a guest or walk-in customer"}
						</DialogDescription>
					</DialogHeader>
				</div>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
						className="px-6 pb-6"
					>
						{/* Customer Information */}
						<div className="space-y-4 py-5">
							<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
								Customer Information
							</h3>

							{/* Booking Selector */}
							<FormField
								control={form.control}
								name="bookingId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Link to Booking</FormLabel>
										<Select
											value={field.value || "__WALK_IN__"}
											onValueChange={(value) => {
												field.onChange(
													value === "__WALK_IN__" ? "" : value,
												);
											}}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select checked-in guest" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="__WALK_IN__">
													Walk-in customer (no booking)
												</SelectItem>
												{checkedInBookings?.map((booking) => (
													<SelectItem
														key={booking.bookingId}
														value={booking.bookingId}
													>
														{booking.customId} - {booking.guestName}
														{booking.roomIdentifier
															? ` (Room ${booking.roomIdentifier})`
															: ""}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											{isLoadingBookings
												? "Loading checked-in guests..."
												: isEditMode
													? "Change or remove the linked booking"
													: "Select a checked-in guest to auto-fill details, or leave as walk-in"}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-x-4 gap-y-3">
								<FormField
									control={form.control}
									name="customerName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Customer Name <span className="text-destructive">*</span>
											</FormLabel>
											<FormControl>
												<Input placeholder="John Doe" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="customerPhone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone Number</FormLabel>
											<FormControl>
												<Input placeholder="+234..." {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="roomIdentifier"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Room Number</FormLabel>
											<FormControl>
												<Input placeholder="e.g. 305" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="customerEmail"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="customer@email.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<Separator />

						{/* Urgency */}
						<div className="space-y-3 py-5">
							<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
								<ClockIcon className="w-3.5 h-3.5" />
								Service Urgency
							</h3>
							<FormField
								control={form.control}
								name="urgency"
								render={({ field }) => (
									<FormItem>
										<div className="grid grid-cols-4 gap-3">
											{URGENCY_LEVELS.map((level) => {
												const isSelected = field.value === level.value;
												return (
													<button
														key={level.value}
														type="button"
														disabled={isPickedUp}
														onClick={() => field.onChange(level.value)}
														className={cn(
															"relative rounded-xl p-3 text-center transition-all duration-150",
															"border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
															isSelected
																? "border-primary bg-primary/5 shadow-sm"
																: "border-muted hover:border-muted-foreground/25 hover:bg-muted/60",
														)}
													>
														<Badge
															variant="secondary"
															className={cn(
																"text-xs font-semibold px-2.5 py-0.5",
																level.color,
															)}
														>
															{level.label}
														</Badge>
														<p className="text-[11px] text-muted-foreground mt-2 leading-tight">
															{level.desc}
														</p>
														{isSelected && (
															<div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
														)}
													</button>
												);
											})}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Separator />

						{/* Laundry Items */}
						<div className="space-y-3 py-5">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
									Laundry Items
								</h3>
								{!isPickedUp && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-8 text-xs"
										onClick={() =>
											append(defaultItem)
										}
									>
										<PlusCircleIcon className="w-3.5 h-3.5 mr-1" />
										Add Item
									</Button>
								)}
							</div>

							<div className="space-y-3">
								{fields.map((field, index) => {
									const selectedItemId = form.watch(
										`items.${index}.laundryItemId`,
									);
									const selectedItem = laundryItems?.find(
										(item: any) => item.id === selectedItemId,
									);

									return (
										<div
											key={field.id}
											className="rounded-xl border bg-muted/30 p-4 space-y-3"
										>
											{/* Row 1: Item selector + delete button */}
											<div className="flex gap-3 items-start">
												<FormField
													control={form.control}
													name={`items.${index}.laundryItemId`}
													render={({ field }) => (
														<FormItem className="flex-1">
															<FormLabel className="text-xs">
																Item <span className="text-destructive">*</span>
															</FormLabel>
															<Select
																onValueChange={field.onChange}
																value={field.value}
																disabled={isPickedUp}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select item" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{laundryItems?.map((item: any) => (
																		<SelectItem
																			key={item.id}
																			value={item.id}
																		>
																			{item.name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>

												{fields.length > 1 && !isPickedUp && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="mt-6 shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
														onClick={() => remove(index)}
													>
														<TrashIcon className="w-4 h-4" />
													</Button>
												)}
											</div>

											{/* Row 2: Service type + Quantity */}
											<div className="grid grid-cols-[1fr_80px] gap-3">
												<FormField
													control={form.control}
													name={`items.${index}.serviceType`}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-xs">
																Service <span className="text-destructive">*</span>
															</FormLabel>
															<Select
																onValueChange={field.onChange}
																value={field.value}
																disabled={isPickedUp}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select service type" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{SERVICE_TYPES.filter((st) => {
																		if (!selectedItem) return true;
																		const priceKey =
																			SERVICE_PRICE_MAP[st.value];
																		return (
																			selectedItem[priceKey] != null &&
																			selectedItem[priceKey] > 0
																		);
																	}).map((st) => (
																		<SelectItem
																			key={st.value}
																			value={st.value}
																		>
																			{st.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`items.${index}.quantity`}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-xs">Qty</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	min="1"
																	className="text-center"
																	disabled={isPickedUp}
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											{/* Optional details */}
											<div className="grid grid-cols-3 gap-3">
												<FormField
													control={form.control}
													name={`items.${index}.itemColor`}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-xs text-muted-foreground">
																Color
															</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g. White"
																	className="h-8 text-sm"
																	{...field}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name={`items.${index}.brandOrLabel`}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-xs text-muted-foreground">
																Brand / Label
															</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g. Calvin Klein"
																	className="h-8 text-sm"
																	{...field}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name={`items.${index}.conditionNotes`}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-xs text-muted-foreground">
																Condition
															</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g. Stain on sleeve"
																	className="h-8 text-sm"
																	{...field}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Estimated Total */}
						{estimatedTotal > 0 && (
							<div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 p-4 mb-5">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-semibold text-blue-900">
											Estimated Total
										</p>
										{urgencyInfo && urgencyInfo.value !== "STANDARD" && (
											<p className="text-xs text-blue-600 mt-0.5">
												Includes {urgencyInfo.label.toLowerCase()} surcharge
											</p>
										)}
									</div>
									<p className="text-2xl font-bold text-blue-900 tabular-nums">
										{formatCurrency(estimatedTotal)}
									</p>
								</div>
							</div>
						)}

						<Separator />

						{/* Deposit / Payment — only for walk-in customers, not in edit mode */}
						{isWalkIn && !isEditMode && (
							<>
								<div className="space-y-3 py-5">
									<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
										<WalletIcon className="w-3.5 h-3.5" />
										Payment
									</h3>

									<FormField
										control={form.control}
										name="collectDeposit"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel className="font-medium">
														Collect deposit now
													</FormLabel>
													<FormDescription>
														Record an upfront payment for this walk-in order
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>

									{collectDeposit && (
										<div className="grid grid-cols-[1fr_1fr] gap-3 pl-7">
											<FormField
												control={form.control}
												name="depositAmount"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															Amount <span className="text-destructive">*</span>
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="0"
																placeholder="0"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="depositMethod"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															Payment Method
														</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{PAYMENT_METHODS.map((m) => (
																	<SelectItem key={m.value} value={m.value}>
																		{m.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="depositReference"
												render={({ field }) => (
													<FormItem className="col-span-2">
														<FormLabel className="text-xs">
															Reference / Receipt No.
														</FormLabel>
														<FormControl>
															<Input
																placeholder="Optional reference"
																{...field}
															/>
														</FormControl>
													</FormItem>
												)}
											/>
										</div>
									)}
								</div>

								<Separator />
							</>
						)}

						{/* Additional Notes */}
						<div className="space-y-3 py-5">
							<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
								Additional Notes
							</h3>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="specialInstructions"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">Staff Instructions</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Internal notes for staff..."
													className="min-h-[70px] text-sm resize-none"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="customerNotes"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">Customer Notes</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Notes from customer..."
													className="min-h-[70px] text-sm resize-none"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Footer */}
						<div className="flex justify-end gap-3 pt-2 border-t mt-1">
							<Button
								type="button"
								variant="ghost"
								onClick={() => setOpen(false)}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={mutation.isPending}
								className="bg-gradient-to-r from-blue-600 to-indigo-600 min-w-[140px]"
							>
								{mutation.isPending ? (
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<ShirtIcon className="w-4 h-4 mr-2" />
								)}
								{isEditMode ? "Update Order" : "Create Order"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
