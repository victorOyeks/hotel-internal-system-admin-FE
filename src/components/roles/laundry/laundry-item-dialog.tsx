"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLaundryItem, updateLaundryItem } from "@/lib/laundry-actions";
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
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, PlusCircleIcon } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
	{ value: "CLOTHING", label: "Clothing" },
	{ value: "BEDDING", label: "Bedding" },
	{ value: "TOWELS", label: "Towels" },
	{ value: "CURTAINS", label: "Curtains" },
	{ value: "UNIFORMS", label: "Uniforms" },
	{ value: "TABLE_LINEN", label: "Table Linen" },
	{ value: "DELICATES", label: "Delicates" },
	{ value: "ACCESSORIES", label: "Accessories" },
	{ value: "OUTERWEAR", label: "Outerwear" },
	{ value: "OTHERS", label: "Others" },
] as const;

const laundryItemSchema = z.object({
	name: z.string().min(1, "Item name is required").max(255),
	description: z.string().max(500).optional(),
	category: z.string().min(1, "Category is required"),
	washOnlyPrice: z.coerce.number().min(0).optional(),
	washAndIronPrice: z.coerce.number().min(0).optional(),
	washAndFoldPrice: z.coerce.number().min(0).optional(),
	dryCleanPrice: z.coerce.number().min(0).optional(),
	ironOnlyPrice: z.coerce.number().min(0).optional(),
	steamPressPrice: z.coerce.number().min(0).optional(),
	stainRemovalPrice: z.coerce.number().min(0).optional(),
	handWashPrice: z.coerce.number().min(0).optional(),
	washIronAndPackPrice: z.coerce.number().min(0).optional(),
	expressMultiplier: z.coerce.number().min(1).optional(),
	sameDayMultiplier: z.coerce.number().min(1).optional(),
	urgentMultiplier: z.coerce.number().min(1).optional(),
	specialInstructions: z.string().max(500).optional(),
});

type LaundryItemFormData = z.infer<typeof laundryItemSchema>;

type LaundryItemDialogProps = {
	trigger?: React.ReactNode;
	editItem?: any;
	onSuccess?: () => void;
};

const SERVICE_PRICE_FIELDS = [
	{ name: "washOnlyPrice" as const, label: "Wash Only" },
	{ name: "washAndIronPrice" as const, label: "Wash & Iron" },
	{ name: "washAndFoldPrice" as const, label: "Wash & Fold" },
	{ name: "dryCleanPrice" as const, label: "Dry Clean" },
	{ name: "ironOnlyPrice" as const, label: "Iron Only" },
	{ name: "steamPressPrice" as const, label: "Steam Press" },
	{ name: "stainRemovalPrice" as const, label: "Stain Removal" },
	{ name: "handWashPrice" as const, label: "Hand Wash" },
	{ name: "washIronAndPackPrice" as const, label: "Wash, Iron & Pack" },
] as const;

export function LaundryItemDialog({
	trigger,
	editItem,
	onSuccess,
}: LaundryItemDialogProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const isEditing = !!editItem;

	const form = useForm<LaundryItemFormData>({
		resolver: zodResolver(laundryItemSchema),
		defaultValues: editItem
			? {
					name: editItem.name,
					description: editItem.description || "",
					category: editItem.category,
					washOnlyPrice: editItem.washOnlyPrice || undefined,
					washAndIronPrice: editItem.washAndIronPrice || undefined,
					washAndFoldPrice: editItem.washAndFoldPrice || undefined,
					dryCleanPrice: editItem.dryCleanPrice || undefined,
					ironOnlyPrice: editItem.ironOnlyPrice || undefined,
					steamPressPrice: editItem.steamPressPrice || undefined,
					stainRemovalPrice: editItem.stainRemovalPrice || undefined,
					handWashPrice: editItem.handWashPrice || undefined,
					washIronAndPackPrice: editItem.washIronAndPackPrice || undefined,
					expressMultiplier: editItem.expressMultiplier || 1.5,
					sameDayMultiplier: editItem.sameDayMultiplier || 2.0,
					urgentMultiplier: editItem.urgentMultiplier || 3.0,
					specialInstructions: editItem.specialInstructions || "",
				}
			: {
					name: "",
					description: "",
					category: "",
					expressMultiplier: 1.5,
					sameDayMultiplier: 2.0,
					urgentMultiplier: 3.0,
					specialInstructions: "",
				},
	});

	const mutation = useMutation({
		mutationFn: async (data: LaundryItemFormData) => {
			const payload = {
				...data,
				description: data.description || undefined,
				specialInstructions: data.specialInstructions || undefined,
			};
			const result = isEditing
				? await updateLaundryItem(editItem.id, payload)
				: await createLaundryItem(payload);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success(
				isEditing
					? "Laundry item updated successfully"
					: "Laundry item created successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["laundry", "items"] });
			queryClient.invalidateQueries({
				queryKey: ["laundry", "dashboard-stats"],
			});
			setOpen(false);
			form.reset();
			onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to save laundry item");
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button>
						<PlusCircleIcon className="w-4 h-4 mr-2" />
						Add Item
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-2xl">
						{isEditing ? "Edit Laundry Item" : "Add Laundry Item"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the laundry service item details and pricing"
							: "Add a new laundry service item with pricing"}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
						className="space-y-6"
					>
						{/* Basic Info */}
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Item Name *</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Men's Dress Shirt" {...field} />
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
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select category" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{CATEGORIES.map((cat) => (
														<SelectItem key={cat.value} value={cat.value}>
															{cat.label}
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
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Input
													placeholder="Brief description..."
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

						{/* Service Prices */}
						<div>
							<h3 className="text-sm font-semibold mb-3">
								Service Pricing (NGN)
							</h3>
							<p className="text-xs text-muted-foreground mb-4">
								Set prices for each service type. Leave empty for services not
								offered.
							</p>
							<div className="grid grid-cols-3 gap-3">
								{SERVICE_PRICE_FIELDS.map((field) => (
									<FormField
										key={field.name}
										control={form.control}
										name={field.name}
										render={({ field: formField }) => (
											<FormItem>
												<FormLabel className="text-xs">
													{field.label}
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														min="0"
														placeholder="0.00"
														{...formField}
														value={formField.value ?? ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								))}
							</div>
						</div>

						<Separator />

						{/* Urgency Multipliers */}
						<div>
							<h3 className="text-sm font-semibold mb-3">
								Urgency Multipliers
							</h3>
							<p className="text-xs text-muted-foreground mb-4">
								Price multipliers applied for expedited service
							</p>
							<div className="grid grid-cols-3 gap-3">
								<FormField
									control={form.control}
									name="expressMultiplier"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">
												Express (12-24h)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													min="1"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="sameDayMultiplier"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">
												Same Day (6-12h)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													min="1"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="urgentMultiplier"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">
												Urgent (3-6h)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													min="1"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<FormField
							control={form.control}
							name="specialInstructions"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Special Instructions</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Default handling instructions for this item..."
											className="min-h-[60px]"
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
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending && (
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
								)}
								{isEditing ? "Update Item" : "Create Item"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
