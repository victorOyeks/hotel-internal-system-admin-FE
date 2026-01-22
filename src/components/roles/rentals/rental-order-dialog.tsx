"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $fetch } from "@/lib/fetch";
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
import { Badge } from "@/components/ui/badge";
import {
	ClipboardListIcon,
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
	notes: z.string().optional(),
});

const rentalOrderSchema = z.object({
	bookingId: z.string().optional(),
	customerName: z.string().min(1, "Customer name is required"),
	customerPhone: z.string().min(1, "Phone number is required"),
	customerIdType: z
		.enum(["PASSPORT", "DRIVERS_LICENSE", "NATIONAL_ID", "OTHER"])
		.optional(),
	customerIdNumber: z.string().optional(),
	roomIdentifier: z.string().optional(),
	rentalStartDate: z.date({
		error: "Start date is required",
	}),
	rentalEndDate: z.date({
		error: "End date is required",
	}),
	orderItems: z.array(orderItemSchema).min(1, "At least one item is required"),
	notes: z.string().optional(),
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
			roomIdentifier: "",
			orderItems: [{ rentalItemId: "", quantity: 1, notes: "" }],
			notes: "",
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "orderItems",
	});

	// Fetch available rental items
	const { data: availableItems } = useQuery({
		queryKey: ["rentals", "items", "available"],
		queryFn: async () => {
			const response = await $fetch("@get/api/hotels/rentals/items/available", {
				throw: true,
			});
			return response.data;
		},
	});

	const mutation = useMutation({
		mutationFn: async (data: RentalOrderFormData) => {
			// Transform dates to ISO strings for API
			const payload = {
				...data,
				rentalStartDate: data.rentalStartDate.toISOString(),
				rentalEndDate: data.rentalEndDate.toISOString(),
			};
			return await $fetch("@post/api/hotels/rentals/orders", {
				input: payload,
				throw: true,
			});
		},
		onSuccess: (response) => {
			toast.success("Rental order created successfully", {
				description: `Order #${response.data.orderNumber}`,
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
		// Validation: End date must be after start date
		if (data.rentalEndDate <= data.rentalStartDate) {
			toast.error("End date must be after start date");
			return;
		}
		mutation.mutate(data);
	};

	const calculateDuration = () => {
		const start = form.watch("rentalStartDate");
		const end = form.watch("rentalEndDate");
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
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
													<Input placeholder="+1234567890" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="customerIdType"
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
										name="customerIdNumber"
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

									<FormField
										control={form.control}
										name="roomIdentifier"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Room Number</FormLabel>
												<FormControl>
													<Input placeholder="Optional" {...field} />
												</FormControl>
												<FormDescription className="text-xs">
													For hotel guests only
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
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
										name="rentalStartDate"
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
										name="rentalEndDate"
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
																(form.watch("rentalStartDate") || new Date())
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
											append({ rentalItemId: "", quantity: 1, notes: "" })
										}
									>
										<PlusCircleIcon className="w-4 h-4 mr-1" />
										Add Item
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{fields.map((field, index) => (
									<div key={field.id} className="flex gap-3 items-start">
										<div className="flex-1 grid grid-cols-3 gap-3">
											<FormField
												control={form.control}
												name={`orderItems.${index}.rentalItemId`}
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
																{availableItems?.map((item: any) => (
																	<SelectItem key={item.id} value={item.id}>
																		{item.name} ({item.availableQuantity}{" "}
																		available)
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
												name={`orderItems.${index}.quantity`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Quantity *</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="1"
																{...field}
																onChange={(e) =>
																	field.onChange(parseInt(e.target.value))
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`orderItems.${index}.notes`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Notes</FormLabel>
														<FormControl>
															<Input placeholder="Optional notes" {...field} />
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
								))}
							</CardContent>
						</Card>

						{/* Additional Notes */}
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Order Notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Any special instructions or notes..."
											className="min-h-[80px]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

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
