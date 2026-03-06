"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

const rentalItemSchema = z.object({
	name: z.string().min(1, "Item name is required"),
	description: z.string().optional(),
	category: z.enum([
		"BICYCLES",
		"BEACH_EQUIPMENT",
		"SPORTS_EQUIPMENT",
		"BABY_EQUIPMENT",
		"CONFERENCE_EQUIPMENT",
		"ENTERTAINMENT",
		"MOBILITY_AIDS",
		"WATER_SPORTS",
		"WINTER_SPORTS",
		"ELECTRONICS",
		"VEHICLES",
		"PARTY_SUPPLIES",
		"CAMPING_GEAR",
		"KITCHEN_APPLIANCES",
		"OTHERS",
	]),
	condition: z.enum([
		"EXCELLENT",
		"GOOD",
		"FAIR",
		"POOR",
		"DAMAGED",
		"OUT_OF_SERVICE",
	]),
	pricingType: z.enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "FLAT_RATE"]),
	brand: z.string().optional(),
	model: z.string().optional(),
	serialNumber: z.string().optional(),
	hourlyRate: z.number().min(0).optional(),
	dailyRate: z.number().min(0).optional(),
	weeklyRate: z.number().min(0).optional(),
	monthlyRate: z.number().min(0).optional(),
	flatRate: z.number().min(0).optional(),
	depositAmount: z.number().min(0).optional(),
	totalQuantity: z.number().min(0, "Quantity cannot be negative"),
	replacementValue: z.number().min(0).optional(),
	lateReturnPenaltyPerHour: z.number().min(0).optional(),
	lateReturnPenaltyPerDay: z.number().min(0).optional(),
	size: z.string().optional(),
	color: z.string().optional(),
	specifications: z.string().optional(),
	usageInstructions: z.string().optional(),
	safetyInstructions: z.string().optional(),
	maintenanceNotes: z.string().optional(),
	requiresDeposit: z.boolean(),
	requiresIdentification: z.boolean(),
	requiresSignedAgreement: z.boolean(),
	minimumAge: z.number().min(0).optional(),
});

type RentalItemFormData = z.infer<typeof rentalItemSchema>;

type RentalItemDialogProps = {
	trigger?: React.ReactNode;
	item?: RentalItemFormData & { id: string };
	onSuccess?: () => void;
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

const conditionLabels: Record<string, string> = {
	EXCELLENT: "Excellent - Like new",
	GOOD: "Good - Minor wear",
	FAIR: "Fair - Visible wear",
	POOR: "Poor - Limited functionality",
	DAMAGED: "Damaged - Needs repair",
	OUT_OF_SERVICE: "Out of Service",
};

const pricingTypeLabels: Record<string, string> = {
	HOURLY: "Hourly",
	DAILY: "Daily",
	WEEKLY: "Weekly",
	MONTHLY: "Monthly",
	FLAT_RATE: "Flat Rate",
};

export function RentalItemDialog({
	trigger,
	item,
	onSuccess,
}: RentalItemDialogProps) {
	const [open, setOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("basic");
	const queryClient = useQueryClient();
	const router = useRouter();
	const isEditing = !!item;

	const form = useForm<RentalItemFormData>({
		resolver: zodResolver(rentalItemSchema),
		defaultValues: item || {
			name: "",
			description: "",
			category: "OTHERS",
			condition: "EXCELLENT",
			pricingType: "DAILY",
			brand: "",
			model: "",
			serialNumber: "",
			hourlyRate: undefined,
			dailyRate: undefined,
			weeklyRate: undefined,
			monthlyRate: undefined,
			flatRate: undefined,
			depositAmount: undefined,
			totalQuantity: 1,
			replacementValue: undefined,
			lateReturnPenaltyPerHour: undefined,
			lateReturnPenaltyPerDay: undefined,
			size: "",
			color: "",
			specifications: "",
			usageInstructions: "",
			safetyInstructions: "",
			maintenanceNotes: "",
			requiresDeposit: true,
			requiresIdentification: false,
			requiresSignedAgreement: false,
			minimumAge: undefined,
		},
	});

	const mutation = useMutation({
		mutationFn: async (data: RentalItemFormData) => {
			if (isEditing) {
				return await $fetch("@put/api/hotels/rentals/items/:itemId", {
					params: { itemId: item.id },
					body: data,
					throw: true,
				});
			} else {
				return await $fetch("@post/api/hotels/rentals/items", {
					body: data,
					throw: true,
				});
			}
		},
		onSuccess: () => {
			toast.success(
				isEditing
					? "Rental item updated successfully"
					: "Rental item created successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["rentals", "items"] });
			queryClient.invalidateQueries({
				queryKey: ["rentals", "dashboard-stats"],
			});
			router.refresh();
			setOpen(false);
			form.reset();
			onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to save rental item");
		},
	});

	const onSubmit = (data: RentalItemFormData) => {
		mutation.mutate(data);
	};

	const tabOrder = ["basic", "pricing", "details", "requirements"] as const;
	const fieldsByTab: Record<(typeof tabOrder)[number], Array<keyof RentalItemFormData>> =
		{
			basic: [
				"name",
				"description",
				"category",
				"condition",
				"brand",
				"model",
				"serialNumber",
				"totalQuantity",
				"depositAmount",
			],
			pricing: [
				"pricingType",
				"hourlyRate",
				"dailyRate",
				"weeklyRate",
				"monthlyRate",
				"flatRate",
				"replacementValue",
				"lateReturnPenaltyPerHour",
				"lateReturnPenaltyPerDay",
			],
			details: ["size", "color", "specifications", "usageInstructions", "safetyInstructions", "maintenanceNotes"],
			requirements: [
				"requiresDeposit",
				"requiresIdentification",
				"requiresSignedAgreement",
				"minimumAge",
			],
		};

	const handlePrimaryAction = async () => {
		if (!isEditing && activeTab !== "requirements") {
			const isValid = await form.trigger(fieldsByTab[activeTab], {
				shouldFocus: true,
			});
			if (!isValid) return;
			const currentIndex = tabOrder.indexOf(activeTab);
			const nextTab = tabOrder[currentIndex + 1];
			if (nextTab) setActiveTab(nextTab);
			return;
		}
		await form.handleSubmit(onSubmit)();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				if (nextOpen) setActiveTab("basic");
			}}
		>
			<DialogTrigger asChild>
				{trigger || (
					<Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
						<PackageIcon className="w-4 h-4 mr-2" />
						Add Rental Item
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">
						{isEditing ? "Edit Rental Item" : "Add New Rental Item"}
					</DialogTitle>
					<DialogDescription>
						Configure rental item details, pricing, and availability
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<Tabs
							value={activeTab}
							onValueChange={(value) => setActiveTab(value)}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="basic">Basic Info</TabsTrigger>
								<TabsTrigger value="pricing">Pricing</TabsTrigger>
								<TabsTrigger value="details">Details</TabsTrigger>
								<TabsTrigger value="requirements">Requirements</TabsTrigger>
							</TabsList>

							{/* Basic Information Tab */}
							<TabsContent value="basic" className="space-y-4 mt-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Item Name *</FormLabel>
											<FormControl>
												<Input placeholder="e.g., Mountain Bike" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="category"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Category *</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select category" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{Object.entries(categoryLabels).map(
															([value, label]) => (
																<SelectItem key={value} value={value}>
																	{label}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="condition"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Condition *</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select condition" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{Object.entries(conditionLabels).map(
															([value, label]) => (
																<SelectItem key={value} value={value}>
																	{label}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Describe the rental item..."
													className="min-h-[100px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="brand"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Brand</FormLabel>
												<FormControl>
													<Input placeholder="e.g., Trek" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="model"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Model</FormLabel>
												<FormControl>
													<Input placeholder="e.g., X-Cal 8" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="serialNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Serial Number</FormLabel>
												<FormControl>
													<Input placeholder="Optional" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="totalQuantity"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Total Quantity *</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														placeholder="1"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseInt(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormDescription>
													Units available to rent
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="depositAmount"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Security Deposit</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseFloat(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormDescription>
													Refundable deposit amount (NGN)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</TabsContent>

							{/* Pricing Tab */}
							<TabsContent value="pricing" className="space-y-4 mt-4">
								<FormField
									control={form.control}
									name="pricingType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Pricing Type *</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select pricing type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{Object.entries(pricingTypeLabels).map(
														([value, label]) => (
															<SelectItem key={value} value={value}>
																{label}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<FormDescription>
												Primary pricing model for this item
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
									<p className="text-sm text-blue-800">
										Set different rates for various rental durations. The system
										automatically selects the best rate based on rental length.
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="hourlyRate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Hourly Rate (NGN)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseFloat(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="dailyRate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Daily Rate (NGN)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseFloat(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="weeklyRate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Weekly Rate (NGN)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseFloat(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="monthlyRate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Monthly Rate (NGN)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseFloat(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="flatRate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Flat Rate (NGN)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseFloat(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormDescription>Fixed rate per rental</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="replacementValue"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Replacement Value (NGN)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseFloat(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormDescription>
													Cost if item is lost
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="lateReturnPenaltyPerHour"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Late Penalty / Hour (NGN)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseFloat(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="lateReturnPenaltyPerDay"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Late Penalty / Day (NGN)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseFloat(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</TabsContent>

							{/* Details Tab */}
							<TabsContent value="details" className="space-y-4 mt-4">
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="size"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Size</FormLabel>
												<FormControl>
													<Input placeholder="e.g., Large, 26 inch" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="color"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Color</FormLabel>
												<FormControl>
													<Input placeholder="e.g., Red" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="specifications"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Specifications</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Technical specifications..."
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
									name="usageInstructions"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Usage Instructions</FormLabel>
											<FormControl>
												<Textarea
													placeholder="How to use this item..."
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
									name="safetyInstructions"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Safety Instructions</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Safety guidelines and precautions..."
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
									name="maintenanceNotes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Maintenance Notes</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Maintenance schedule, care instructions..."
													className="min-h-[80px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</TabsContent>

							{/* Requirements Tab */}
							<TabsContent value="requirements" className="space-y-4 mt-4">
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="requiresDeposit"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Requires Security Deposit</FormLabel>
													<FormDescription>
														Deposit must be paid before rental
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="requiresIdentification"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Requires Identification</FormLabel>
													<FormDescription>
														Customer must provide valid ID
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="requiresSignedAgreement"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>Requires Signed Agreement</FormLabel>
													<FormDescription>
														Customer must sign rental agreement
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="minimumAge"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Minimum Age</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														placeholder="0"
														{...field}
														value={field.value ?? ""}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? parseInt(e.target.value)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormDescription>
													Minimum age requirement (0 = no restriction)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</TabsContent>
						</Tabs>

						<div className="flex justify-end gap-3 pt-4 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="button"
								onClick={handlePrimaryAction}
								disabled={mutation.isPending}
								className="bg-gradient-to-r from-blue-600 to-indigo-600"
							>
								{mutation.isPending && (
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
								)}
								{isEditing
									? "Update Item"
									: activeTab === "requirements"
										? "Create Item"
										: "Next"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
