"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
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
import { ChevronsUpDownIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { revalidateRoute } from "@/lib/actions";
import type { InventoryProductResponse, InventorySuppliers } from "@/lib/fetch";
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
import { Separator } from "@/components/ui/separator";

const purchaseOrderItemSchema = z.object({
	productId: z.string().nonempty("Product is required"),
	quantityOrdered: z.coerce.number().min(1, "Quantity must be at least 1"),
	unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
	unit: z.string().nonempty("Unit is required"),
	discountPercent: z.coerce.number().min(0).max(100).default(0),
	taxRate: z.coerce.number().min(0).max(100).default(0),
	notes: z.string().max(1000).optional(),
	specifications: z.string().max(500).optional(),
});

const purchaseOrderFormSchema = z.object({
	supplierId: z.string().nonempty("Supplier is required"),
	expectedDeliveryDate: z.string().nonempty("Expected delivery date is required"),
	paymentTerms: z.string().max(200).optional(),
	notes: z.string().max(2000).optional(),
	items: z.array(purchaseOrderItemSchema).nonempty("At least one item is required"),

	// New Fields based on API Schema
	supplierContactPerson: z.string().max(200).optional(),
	supplierContactPhone: z.string().max(100).optional(),
	supplierContactEmail: z.string().max(200).email().optional().or(z.literal("")),
	deliveryLocationId: z.string().optional(),
	deliveryAddress: z.string().max(500).optional(),
	orderDate: z.string().optional(), // Usually set by backend or current date
	taxRate: z.coerce.number().min(0).optional(),
	shippingCost: z.coerce.number().min(0).optional(),
	otherCharges: z.coerce.number().min(0).optional(),
	discountPercent: z.coerce.number().min(0).max(100).optional(),
	currency: z.string().max(10).optional(),
	exchangeRate: z.coerce.number().min(0).optional(),
	paymentDueDays: z.coerce.number().int().min(0).optional(),
	paymentMethod: z.string().max(100).optional(),
	termsAndConditions: z.string().max(1000).optional(),
	deliveryInstructions: z.string().max(1000).optional(),
	internalNotes: z.string().max(1000).optional(),
	requisitionNumber: z.string().max(100).optional(),
	quotationNumber: z.string().max(100).optional(),
});

interface CreatePOFormProps {
	suppliers: Pick<InventorySuppliers, "id" | "name" | "email" | "phone">[];
	products: InventoryProductResponse[];
}

function SupplierCombobox({
	value,
	onValueChange,
	suppliers,
}: {
	value: string;
	onValueChange: (value: string) => void;
	suppliers: CreatePOFormProps["suppliers"];
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
			supplierContactPerson: "",
			supplierContactPhone: "",
			supplierContactEmail: "",
			deliveryLocationId: "",
			deliveryAddress: "",
			taxRate: 0,
			shippingCost: 0,
			otherCharges: 0,
			discountPercent: 0,
			currency: "NGN",
			exchangeRate: 1,
			paymentDueDays: 30,
			paymentMethod: "",
			termsAndConditions: "",
			deliveryInstructions: "",
			internalNotes: "",
			requisitionNumber: "",
			quotationNumber: "",
		},
	});

	const { fields, append, remove } = useFieldArray({
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
					quantityOrdered: 1,
					unitPrice: product?.sellingPrice || 0,
					unit: product?.baseUnit || "PCS",
					discountPercent: 0,
					taxRate: 0,
					notes: "",
					specifications: "",
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
				productDescription: products.find(p => p.id === item.productId)?.description || "",
			})),
			orderDate: new Date().toISOString(),
		};
		//@ts-expect-error
		await mutateAsync(formattedData);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-[80vh] overflow-y-auto pr-2">
				{/* Basic Details */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Basic Details</h3>
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

						<FormField
							control={form.control}
							name="requisitionNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Requisition No.</FormLabel>
									<FormControl>
										<Input placeholder="REQ-001" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="quotationNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Quotation No.</FormLabel>
									<FormControl>
										<Input placeholder="QUO-001" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<Separator />

				{/* Supplier Contact Info (Optional) */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Supplier Contact (Optional)</h3>
					<div className="grid grid-cols-3 gap-4">
						<FormField
							control={form.control}
							name="supplierContactPerson"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Contact Person</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="supplierContactPhone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="supplierContactEmail"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input type="email" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<Separator />

				{/* Products Section */}
				<div className="space-y-4">
					<div className="space-y-2">
						<FormLabel className="text-lg font-semibold block">Products *</FormLabel>
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
										className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b pb-4 last:border-0 last:pb-0 mb-4"
									>
										<div className="col-span-full font-medium text-sm border-l-4 pl-2 border-primary">
											{product?.name || "Unknown Product"}
										</div>

										<FormField
											control={form.control}
											name={`items.${index}.quantityOrdered`}
											render={() => (
												<FormItem>
													<FormLabel className="text-xs">Quantity</FormLabel>
													<FormControl>
														<Input type="number" min="1" className="h-8" {...form.register(`items.${index}.quantityOrdered`, { valueAsNumber: true })} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`items.${index}.unit`}
											render={() => (
												<FormItem>
													<FormLabel className="text-xs">Unit</FormLabel>
													<FormControl>
														<Input className="h-8" {...form.register(`items.${index}.unit`)} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`items.${index}.unitPrice`}
											render={() => (
												<FormItem>
													<FormLabel className="text-xs">Unit Price</FormLabel>
													<FormControl>
														<Input type="number" min="0" step="0.01" className="h-8" {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`items.${index}.discountPercent`}
											render={() => (
												<FormItem>
													<FormLabel className="text-xs">Discount %</FormLabel>
													<FormControl>
														<Input type="number" min="0" max="100" className="h-8" {...form.register(`items.${index}.discountPercent`, { valueAsNumber: true })} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`items.${index}.specifications`}
											render={() => (
												<FormItem className="col-span-2">
													<FormLabel className="text-xs">Specs</FormLabel>
													<FormControl>
														<Input className="h-8" placeholder="Specifications..." {...form.register(`items.${index}.specifications`)} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`items.${index}.notes`}
											render={() => (
												<FormItem className="col-span-2">
													<FormLabel className="text-xs">Item Notes</FormLabel>
													<FormControl>
														<Input className="h-8" placeholder="Notes..." {...form.register(`items.${index}.notes`)} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<Separator />

				{/* Financials & Delivery */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Financials & Delivery</h3>
					<div className="grid grid-cols-3 gap-4">
						<FormField
							control={form.control}
							name="currency"
							render={() => (
								<FormItem>
									<FormLabel>Currency</FormLabel>
									<FormControl>
										<Input placeholder="NGN" {...form.register(`currency`)} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="paymentTerms"
							render={() => (
								<FormItem>
									<FormLabel>Payment Terms</FormLabel>
									<FormControl>
										<Input placeholder="e.g. Net 30" {...form.register(`paymentTerms`)} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="paymentMethod"
							render={() => (
								<FormItem>
									<FormLabel>Payment Method</FormLabel>
									<FormControl>
										<Input placeholder="e.g. Bank Transfer" {...form.register(`paymentMethod`)} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="shippingCost"
							render={() => (
								<FormItem>
									<FormLabel>Shipping Cost</FormLabel>
									<FormControl>
										<Input type="number" min="0" step="0.01" {...form.register(`shippingCost`, { valueAsNumber: true })} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="otherCharges"
							render={() => (
								<FormItem>
									<FormLabel>Other Charges</FormLabel>
									<FormControl>
										<Input type="number" min="0" step="0.01" {...form.register(`otherCharges`, { valueAsNumber: true })} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="discountPercent"
							render={() => (
								<FormItem>
									<FormLabel>Global Discount %</FormLabel>
									<FormControl>
										<Input type="number" min="0" max="100" step="0.1" {...form.register(`discountPercent`, { valueAsNumber: true })} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="col-span-3">
							<FormField
								control={form.control}
								name="deliveryAddress"
								render={() => (
									<FormItem>
										<FormLabel>Delivery Address</FormLabel>
										<FormControl>
											<Input placeholder="Full delivery address" {...form.register(`deliveryAddress`)} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="col-span-3">
							<FormField
								control={form.control}
								name="deliveryInstructions"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Delivery Instructions</FormLabel>
										<FormControl>
											<Textarea placeholder="Instructions for delivery..." className="resize-none h-20" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				</div>

				<Separator />

				{/* Terms & Notes */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Terms & Notes</h3>
					<div className="grid grid-cols-1 gap-4">
						<FormField
							control={form.control}
							name="termsAndConditions"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Terms & Conditions</FormLabel>
									<FormControl>
										<Textarea placeholder="Terms..." className="resize-none h-20" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>External Notes</FormLabel>
									<FormControl>
										<Textarea placeholder="Notes for supplier..." className="resize-none h-20" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="internalNotes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Internal Notes</FormLabel>
									<FormControl>
										<Textarea placeholder="Internal use only..." className="resize-none h-20" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background pb-2">
					<DialogClose asChild>
						<Button variant="outline" type="button">
							Cancel
						</Button>
					</DialogClose>
					<Button type="submit" disabled={isPending}>
						{isPending ? <Loader2Icon className="animate-spin mr-2 h-4 w-4" /> : null}
						Create Purchase Order
					</Button>
				</div>
			</form>
		</Form>
	);
}
