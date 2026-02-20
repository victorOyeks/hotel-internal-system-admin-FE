"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLaundryOrder, getLaundryItems } from "@/lib/laundry-actions";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	Loader2Icon,
	PlusCircleIcon,
	TrashIcon,
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
});

type LaundryOrderFormData = z.infer<typeof laundryOrderSchema>;

type LaundryOrderDialogProps = {
	trigger?: React.ReactNode;
	onSuccess?: () => void;
};

export function LaundryOrderDialog({
	trigger,
	onSuccess,
}: LaundryOrderDialogProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<LaundryOrderFormData>({
		resolver: zodResolver(laundryOrderSchema),
		defaultValues: {
			customerName: "",
			customerPhone: "",
			customerEmail: "",
			roomIdentifier: "",
			bookingId: "",
			urgency: "STANDARD",
			items: [
				{
					laundryItemId: "",
					quantity: 1,
					serviceType: "",
					itemColor: "",
					brandOrLabel: "",
					conditionNotes: "",
					specialInstructions: "",
				},
			],
			specialInstructions: "",
			customerNotes: "",
		},
	});

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

	const mutation = useMutation({
		mutationFn: async (data: LaundryOrderFormData) => {
			const payload = {
				...data,
				customerPhone: data.customerPhone || undefined,
				customerEmail: data.customerEmail || undefined,
				roomIdentifier: data.roomIdentifier || undefined,
				bookingId: data.bookingId || undefined,
				specialInstructions: data.specialInstructions || undefined,
				customerNotes: data.customerNotes || undefined,
				items: data.items.map((item) => ({
					...item,
					itemColor: item.itemColor || undefined,
					brandOrLabel: item.brandOrLabel || undefined,
					conditionNotes: item.conditionNotes || undefined,
					specialInstructions: item.specialInstructions || undefined,
				})),
			};
			const result = await createLaundryOrder(payload);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: (response: any) => {
			toast.success("Laundry order created successfully", {
				description: `Order #${response.orderNumber}`,
			});
			queryClient.invalidateQueries({ queryKey: ["laundry", "orders"] });
			queryClient.invalidateQueries({
				queryKey: ["laundry", "dashboard-stats"],
			});
			setOpen(false);
			form.reset();
			onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to create laundry order");
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

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
						<PlusCircleIcon className="w-4 h-4 mr-2" />
						New Laundry Order
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-2xl">Create Laundry Order</DialogTitle>
					<DialogDescription>
						Process a new laundry order for a guest or walk-in customer
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
						className="space-y-6"
					>
						{/* Customer Information */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Customer Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="customerName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Customer Name *</FormLabel>
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
								</div>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="roomIdentifier"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Room Number</FormLabel>
												<FormControl>
													<Input
														placeholder="e.g. 305"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="bookingId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Booking ID</FormLabel>
												<FormControl>
													<Input
														placeholder="For hotel guests"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Urgency */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Service Urgency</CardTitle>
							</CardHeader>
							<CardContent>
								<FormField
									control={form.control}
									name="urgency"
									render={({ field }) => (
										<FormItem>
											<div className="grid grid-cols-4 gap-2">
												{URGENCY_LEVELS.map((level) => (
													<button
														key={level.value}
														type="button"
														onClick={() => field.onChange(level.value)}
														className={cn(
															"rounded-lg p-3 text-center border-2 transition-all",
															field.value === level.value
																? "border-primary bg-primary/5"
																: "border-transparent bg-muted/50 hover:bg-muted",
														)}
													>
														<Badge className={cn("text-xs mb-1", level.color)}>
															{level.label}
														</Badge>
														<p className="text-[10px] text-muted-foreground mt-1">
															{level.desc}
														</p>
													</button>
												))}
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Laundry Items */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Laundry Items</CardTitle>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											append({
												laundryItemId: "",
												quantity: 1,
												serviceType: "",
												itemColor: "",
												brandOrLabel: "",
												conditionNotes: "",
												specialInstructions: "",
											})
										}
									>
										<PlusCircleIcon className="w-4 h-4 mr-1" />
										Add Item
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
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
											className="border rounded-lg p-4 space-y-3"
										>
											<div className="flex gap-3 items-start">
												<div className="flex-1 grid grid-cols-[1fr_120px_80px] gap-3 items-start">
													<FormField
														control={form.control}
														name={`items.${index}.laundryItemId`}
														render={({ field }) => (
															<FormItem>
																<FormLabel>Item *</FormLabel>
																<Select
																	onValueChange={field.onChange}
																	value={field.value}
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

													<FormField
														control={form.control}
														name={`items.${index}.serviceType`}
														render={({ field }) => (
															<FormItem>
																<FormLabel>Service *</FormLabel>
																<Select
																	onValueChange={field.onChange}
																	value={field.value}
																>
																	<FormControl>
																		<SelectTrigger>
																			<SelectValue placeholder="Service" />
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
																<FormLabel>Qty *</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		min="1"
																		className="text-center"
																		{...field}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												{fields.length > 1 && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="mt-8 shrink-0"
														onClick={() => remove(index)}
													>
														<TrashIcon className="w-4 h-4 text-red-600" />
													</Button>
												)}
											</div>

											{/* Optional item details - collapsible row */}
											<div className="grid grid-cols-2 gap-3">
												<FormField
													control={form.control}
													name={`items.${index}.itemColor`}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-xs">Color</FormLabel>
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
															<FormLabel className="text-xs">Brand</FormLabel>
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
											</div>

											<FormField
												control={form.control}
												name={`items.${index}.conditionNotes`}
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">
															Condition Notes
														</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g. Small stain on left sleeve"
																className="h-8 text-sm"
																{...field}
															/>
														</FormControl>
													</FormItem>
												)}
											/>
										</div>
									);
								})}
							</CardContent>
						</Card>

						{/* Estimated Total */}
						{estimatedTotal > 0 && (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-blue-900">
											Estimated Total
										</p>
										{urgencyInfo && urgencyInfo.value !== "STANDARD" && (
											<p className="text-xs text-blue-700">
												Includes {urgencyInfo.label.toLowerCase()} surcharge
											</p>
										)}
									</div>
									<p className="text-2xl font-bold text-blue-900">
										{new Intl.NumberFormat("en-NG", {
											style: "currency",
											currency: "NGN",
											minimumFractionDigits: 0,
										}).format(estimatedTotal)}
									</p>
								</div>
							</div>
						)}

						{/* Additional Notes */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="specialInstructions"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Staff Instructions</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Internal notes..."
												className="min-h-[60px]"
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
										<FormLabel>Customer Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Notes from customer..."
												className="min-h-[60px]"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Separator />

						<div className="flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={mutation.isPending}
								className="bg-gradient-to-r from-blue-600 to-indigo-600"
							>
								{mutation.isPending && (
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
								)}
								Create Order
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
