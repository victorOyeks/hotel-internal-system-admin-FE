"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRentalOrder, getAvailableItems } from "@/lib/rental-actions";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Loader2Icon,
	PlusCircleIcon,
	TrashIcon,
	CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const orderItemSchema = z.object({
	rentalItemId: z.string().min(1, "Please select an item"),
	quantity: z.number().min(1, "Quantity must be at least 1"),
	specialInstructions: z.string().optional(),
});

const rentalOrderSchema = z.object({
	bookingId: z.string().optional(),
	customerName: z.string().min(1, "Customer name is required"),
	customerPhone: z.string().min(1, "Phone number is required"),
	customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
	identificationType: z
		.enum(["PASSPORT", "DRIVERS_LICENSE", "NATIONAL_ID", "OTHER"])
		.optional(),
	identificationNumber: z.string().optional(),
	rentalStartTime: z.date({
		error: "Start date is required",
	}),
	rentalEndTime: z.date({
		error: "End date is required",
	}),
	items: z.array(orderItemSchema).min(1, "At least one item is required"),
	specialInstructions: z.string().optional(),
	customerNotes: z.string().optional(),
	chargeOverduePenalty: z.boolean(),
	sendOverdueNotice: z.boolean(),
	sendReminders: z.boolean(),
	requireDeposit: z.boolean(),
	requireAgreement: z.boolean(),
});

type RentalOrderFormData = z.infer<typeof rentalOrderSchema>;

type RentalOrderDialogProps = {
	trigger?: React.ReactNode;
	onSuccess?: () => void;
};

export function RentalOrderDialog({
	trigger,
	onSuccess,
}: RentalOrderDialogProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<RentalOrderFormData>({
		resolver: zodResolver(rentalOrderSchema),
		defaultValues: {
			customerName: "",
			customerPhone: "",
			customerEmail: "",
			identificationNumber: "",
			items: [{ rentalItemId: "", quantity: 1, specialInstructions: "" }],
			specialInstructions: "",
			customerNotes: "",
			chargeOverduePenalty: true,
			sendOverdueNotice: true,
			sendReminders: true,
			requireDeposit: true,
			requireAgreement: false,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const { data: availableItems } = useQuery({
		queryKey: ["rentals", "items", "available"],
		queryFn: async () => {
			const result = await getAvailableItems();
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		enabled: open,
	});

	const mutation = useMutation({
		mutationFn: async (data: RentalOrderFormData) => {
			const payload = {
				...data,
				rentalStartTime: data.rentalStartTime.toISOString(),
				rentalEndTime: data.rentalEndTime.toISOString(),
				customerEmail: data.customerEmail || undefined,
			};
			const result = await createRentalOrder(payload);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: (response) => {
			toast.success("Rental order created successfully", {
				description: `Order #${response.orderNumber}`,
			});
			queryClient.invalidateQueries({ queryKey: ["rentals", "orders"] });
			queryClient.invalidateQueries({
				queryKey: ["rentals", "dashboard-stats"],
			});
			setOpen(false);
			form.reset();
			onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to create rental order");
		},
	});

	const onSubmit = (data: RentalOrderFormData) => {
		if (data.rentalEndTime <= data.rentalStartTime) {
			toast.error("End date must be after start date");
			return;
		}

		// Validate quantities against available stock
		for (const item of data.items) {
			const availableItem = availableItems?.find(
				(ai: any) => ai.id === item.rentalItemId,
			);
			if (availableItem && item.quantity > availableItem.availableQuantity) {
				toast.error(
					`"${availableItem.name}" only has ${availableItem.availableQuantity} available, but you requested ${item.quantity}`,
				);
				return;
			}
		}

		mutation.mutate(data);
	};

	const calculateDuration = () => {
		const start = form.watch("rentalStartTime");
		const end = form.watch("rentalEndTime");
		if (start && end) {
			const hours = Math.ceil(
				(end.getTime() - start.getTime()) / (1000 * 60 * 60),
			);
			const days = Math.ceil(hours / 24);
			return { hours, days };
		}
		return null;
	};

	const duration = calculateDuration();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
						<PlusCircleIcon className="w-4 h-4 mr-2" />
						New Rental Order
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">Create Rental Order</DialogTitle>
					<DialogDescription>
						Process a new rental for a guest or walk-in customer
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Customer Information Section */}
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
												<FormLabel>Phone Number *</FormLabel>
												<FormControl>
													<Input placeholder="+234..." {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="customerEmail"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email Address</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="customer@example.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="identificationType"
										render={({ field }) => (
											<FormItem>
												<FormLabel>ID Type</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select ID type" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="PASSPORT">Passport</SelectItem>
														<SelectItem value="DRIVERS_LICENSE">
															Driver's License
														</SelectItem>
														<SelectItem value="NATIONAL_ID">
															National ID
														</SelectItem>
														<SelectItem value="OTHER">Other</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="identificationNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>ID Number</FormLabel>
												<FormControl>
													<Input placeholder="ID number" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="bookingId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Booking ID</FormLabel>
											<FormControl>
												<Input
													placeholder="Optional - for hotel guests only"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Rental Period Section */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Rental Period</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="rentalStartTime"
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<FormLabel>Start Date & Time *</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																className={cn(
																	"pl-3 text-left font-normal",
																	!field.value && "text-muted-foreground",
																)}
															>
																{field.value ? (
																	format(field.value, "PPP")
																) : (
																	<span>Pick a date</span>
																)}
																<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={field.value}
															onSelect={field.onChange}
															disabled={(date) => date < new Date()}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="rentalEndTime"
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<FormLabel>End Date & Time *</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																className={cn(
																	"pl-3 text-left font-normal",
																	!field.value && "text-muted-foreground",
																)}
															>
																{field.value ? (
																	format(field.value, "PPP")
																) : (
																	<span>Pick a date</span>
																)}
																<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={field.value}
															onSelect={field.onChange}
															disabled={(date) =>
																date <
																(form.watch("rentalStartTime") || new Date())
															}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{duration && (
									<div className="bg-blue-50 p-3 rounded-lg">
										<p className="text-sm text-blue-800">
											<span className="font-semibold">Duration:</span>{" "}
											{duration.days} day
											{duration.days !== 1 ? "s" : ""} ({duration.hours} hours)
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Rental Items Section */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Rental Items</CardTitle>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											append({
												rentalItemId: "",
												quantity: 1,
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
										`items.${index}.rentalItemId`,
									);
									const selectedItem = availableItems?.find(
										(item: any) => item.id === selectedItemId,
									);
									const maxQty = selectedItem?.availableQuantity ?? 999;

									return (
										<div
											key={field.id}
											className="flex gap-3 items-start border rounded-lg p-3"
										>
											<div className="flex-1 grid grid-cols-[2fr_1fr_1.5fr] gap-4">
												<FormField
													control={form.control}
													name={`items.${index}.rentalItemId`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Item *</FormLabel>
															<Select
																onValueChange={(value) => {
																	field.onChange(value);
																	const item = availableItems?.find(
																		(i: any) => i.id === value,
																	);
																	if (item) {
																		const currentQty = form.getValues(
																			`items.${index}.quantity`,
																		);
																		if (
																			currentQty > item.availableQuantity
																		) {
																			form.setValue(
																				`items.${index}.quantity`,
																				item.availableQuantity,
																			);
																		}
																	}
																}}
																value={field.value}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select item" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{availableItems?.map((item: any) => (
																		<SelectItem
																			key={item.id}
																			value={item.id}
																			disabled={
																				item.availableQuantity === 0
																			}
																		>
																			{item.name} (
																			{item.availableQuantity} avail.)
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
																	min={1}
																	max={maxQty}
																	{...field}
																	onChange={(e) => {
																		const val =
																			parseInt(e.target.value) || 1;
																		if (val > maxQty) {
																			field.onChange(maxQty);
																			toast.error(
																				`Only ${maxQty} available for this item`,
																			);
																		} else {
																			field.onChange(Math.max(1, val));
																		}
																	}}
																/>
															</FormControl>
															{selectedItem && (
																<FormDescription className="text-xs">
																	Max: {maxQty}
																</FormDescription>
															)}
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`items.${index}.specialInstructions`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Notes</FormLabel>
															<FormControl>
																<Input
																	placeholder="Optional"
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
													className="mt-8"
													onClick={() => remove(index)}
												>
													<TrashIcon className="w-4 h-4 text-red-600" />
												</Button>
											)}
										</div>
									);
								})}
							</CardContent>
						</Card>

						{/* Order Options */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Order Options</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="requireDeposit"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Require Deposit</FormLabel>
													<FormDescription className="text-xs">
														Collect security deposit before rental
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="requireAgreement"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Require Agreement</FormLabel>
													<FormDescription className="text-xs">
														Customer must sign rental agreement
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="chargeOverduePenalty"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Charge Late Penalty</FormLabel>
													<FormDescription className="text-xs">
														Apply penalty for late returns
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="sendReminders"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Send Reminders</FormLabel>
													<FormDescription className="text-xs">
														Send return date reminders
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Additional Notes */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="specialInstructions"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Special Instructions</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Internal staff instructions..."
												className="min-h-[80px]"
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
												className="min-h-[80px]"
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
