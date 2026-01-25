"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { addPurchaseOrder } from "@/lib/inventory-actions";
import { toast } from "sonner";
import { TrashIcon, ChevronsUpDownIcon, CheckIcon } from "lucide-react";
import { revalidateRoute } from "@/lib/actions";
import type { InventoryProduct, InventorySuppliers } from "@/lib/fetch";
import {
	MultiSelect,
	MultiSelectTrigger,
	MultiSelectValue,
	MultiSelectContent,
	MultiSelectItem,
} from "@/components/ui/multi-select";
import { useQueryState, parseAsString } from "nuqs";
import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from "@/components/ui/command";

const purchaseOrderItemSchema = z.object({
	productId: z.string().min(1, "Product is required"),
	quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
	unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
	unit: z.string().min(1, "Unit is required"),
});

const purchaseOrderFormSchema = z.object({
	supplierId: z.string().min(1, "Supplier is required"),
	expectedDeliveryDate: z.string().min(1, "Expected delivery date is required"),
	paymentTerms: z.string().optional(),
	notes: z.string().optional(),
	items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
});

interface CreatePOFormProps {
	onClose: () => void;
	suppliers: InventorySuppliers[];
	products: InventoryProduct[];
}

function SupplierCombobox({
	value,
	onValueChange,
	suppliers,
}: {
	value: string;
	onValueChange: (value: string) => void;
	suppliers: InventorySuppliers[];
}) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useQueryState(
		"supplier-list:search",
		parseAsString.withDefault(""),
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					{value
						? suppliers.find((supplier) => supplier.id === value)?.name
						: "Select supplier..."}
					<ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search suppliers..."
						value={searchQuery}
						onValueChange={(value) => setSearchQuery(value)}
					/>
					<CommandList>
						<CommandEmpty>No supplier found.</CommandEmpty>
						<CommandGroup>
							{suppliers.map((supplier) => (
								<CommandItem
									key={supplier.id}
									value={supplier.id}
									onSelect={(currentValue) => {
										onValueChange(currentValue === value ? "" : currentValue);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === supplier.id ? "opacity-100" : "opacity-0",
										)}
									/>
									{supplier.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export function CreatePOForm({
	onClose,
	suppliers,
	products,
}: CreatePOFormProps) {
	const form = useForm({
		resolver: zodResolver(purchaseOrderFormSchema),
		defaultValues: {
			supplierId: "",
			expectedDeliveryDate: "",
			paymentTerms: "",
			notes: "",
			items: [],
		},
	});

	const { fields, append, remove, replace } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const [productSearch, setProductSearch] = useQueryState(
		"product-list:search",
		parseAsString.withDefault(""),
	);

	// Sync MultiSelect with FieldArray
	const selectedProductIds = fields.map((field) => field.productId);

	const handleProductSelectionChange = (newSelectedIds: string[]) => {
		const currentIds = new Set(selectedProductIds);
		const newIds = new Set(newSelectedIds);

		// Add new items
		newSelectedIds.forEach((id) => {
			if (!currentIds.has(id)) {
				const product = products.find((p) => p.id === id);
				append({
					productId: id,
					quantity: 1,
					unitPrice: product?.price || 0,
					unit: product?.unit || "pcs", // Default unit if not available
				});
			}
		});

		// Remove deselected items
		fields.forEach((field, index) => {
			if (!newIds.has(field.productId)) {
				remove(index);
			}
		});
	};

	const { mutateAsync, isPending } = useMutation({
		mutationFn: addPurchaseOrder,
		onSuccess: async (response) => {
			if (response.success) {
				toast.success("Purchase order created successfully");
				await revalidateRoute("/dashboard/inventory/purchase-orders");
				onClose();
			} else {
				toast.error(response.error || "Failed to create purchase order");
			}
		},
	});

	const onSubmit = async (data: z.infer<typeof purchaseOrderFormSchema>) => {
		const formattedData = {
			...data,
			expectedDeliveryDate: new Date(data.expectedDeliveryDate).toISOString(),
			items: data.items.map((item) => ({
				...item,
				itemId: crypto.randomUUID(),
			})),
		};
		await mutateAsync(formattedData);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="supplierId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Supplier *</FormLabel>
								<FormControl>
									<SupplierCombobox
										suppliers={suppliers}
										value={field.value}
										onValueChange={field.onChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="expectedDeliveryDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Expected Delivery Date *</FormLabel>
								<FormControl>
									<Input type="date" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="paymentTerms"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Payment Terms</FormLabel>
							<FormControl>
								<Input placeholder="e.g., Net 30" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="space-y-4">
					<div className="space-y-2">
						<FormLabel>Products *</FormLabel>
						<MultiSelect
							values={selectedProductIds}
							onValuesChange={handleProductSelectionChange}
						>
							<MultiSelectTrigger className="w-full">
								<MultiSelectValue placeholder="Select products" />
							</MultiSelectTrigger>
							<MultiSelectContent
								shouldFilter={false}
								searchValue={productSearch}
								onSearchValueChange={setProductSearch}
								search={{
									emptyMessage: "No products found.",
									placeholder: "Search products",
								}}
							>
								{products.map((product) => (
									<MultiSelectItem key={product.id} value={product.id}>
										{product.name}
									</MultiSelectItem>
								))}
							</MultiSelectContent>
						</MultiSelect>
						{form.formState.errors.items && (
							<p className="text-sm font-medium text-destructive">
								{form.formState.errors.items.message}
							</p>
						)}
					</div>

					{fields.length > 0 && (
						<div className="space-y-4 border rounded-md p-4">
							<h4 className="font-medium text-sm text-muted-foreground mb-2">
								Selected Items Details
							</h4>
							{fields.map((field, index) => {
								const product = products.find((p) => p.id === field.productId);
								return (
									<div
										key={field.id}
										className="grid grid-cols-12 gap-2 items-end border-b pb-4 last:border-0 last:pb-0"
									>
										<div className="col-span-4">
											<span className="text-sm font-medium">
												{product?.name || "Unknown Product"}
											</span>
										</div>
										<div className="col-span-3">
											<FormField
												control={form.control}
												name={`items.${index}.quantity`}
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">Quantity</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="1"
																className="h-8"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-2">
											<FormField
												control={form.control}
												name={`items.${index}.unit`}
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">Unit</FormLabel>
														<FormControl>
															<Input className="h-8" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="col-span-3">
											<FormField
												control={form.control}
												name={`items.${index}.unitPrice`}
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-xs">Unit Price</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="0"
																step="0.01"
																className="h-8"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Notes</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Additional notes..."
									className="resize-none"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={onClose} type="button">
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending ? "Creating..." : "Create Purchase Order"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
