"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
	CalendarIcon,
	CheckIcon,
	ChevronsUpDownIcon,
	Loader2Icon,
	PlusIcon,
	TrashIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { addPurchaseOrder } from "@/lib/inventory-actions";
import { revalidateRoute } from "@/lib/actions";
import type { InventoryProductResponse, InventorySuppliers } from "@/lib/fetch";
import { DialogClose } from "@/components/ui/dialog";

// --- Schema Definition ---

const purchaseOrderItemSchema = z.object({
	productId: z.string().nonempty("Product is required"),
	productName: z.string().optional(),
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
	expectedDeliveryDate: z.date({ error: "Expected delivery date is required" }),
	paymentTerms: z.string().max(200).optional(),
	notes: z.string().max(2000).optional(),
	items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),

	// New Fields based on API Schema
	supplierContactPerson: z.string().max(200).optional(),
	supplierContactPhone: z.string().max(100).optional(),
	supplierContactEmail: z.string().max(200).email().optional().or(z.literal("")),
	deliveryLocationId: z.string().optional(),
	deliveryAddress: z.string().max(500).optional(),
	orderDate: z.date().optional(), // Usually set by backend or current date
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
	onClose?: () => void;
}

// --- Components ---

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
		"supplier-search",
		parseAsString.withDefault(""),
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between h-8 text-xs truncate"
				>
					{value
						? suppliers.find((supplier) => supplier.id === value)?.name || value
						: "Select supplier..."}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search supplier..."
						value={searchQuery}
						onValueChange={setSearchQuery}
						className="h-8 text-xs"
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
									className="text-xs"
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

function ProductCombobox({
	value,
	onSelectRaw,
	selectedName,
	products,
}: {
	value: string;
	onSelectRaw: (value: InventoryProductResponse) => void;
	selectedName?: string;
	products: InventoryProductResponse[];
}) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between h-7 text-xs truncate"
				>
					{value
						? products.find((product) => product.id === value)?.name ||
						selectedName ||
						value
						: "Select product..."}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command>
					<CommandInput
						placeholder="Search product..."
						value={searchQuery}
						onValueChange={setSearchQuery}
						className="h-8 text-xs"
					/>
					<CommandList>
						<CommandEmpty>No product found.</CommandEmpty>
						<CommandGroup>
							{products.map((product) => (
								<CommandItem
									key={product.id}
									value={product.id}
									onSelect={() => {
										onSelectRaw(product);
										setOpen(false);
									}}
									className="text-xs"
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === product.id ? "opacity-100" : "opacity-0",
										)}
									/>
									{product.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

// --- Component ---

export function CreatePOForm({
	suppliers,
	products,
	onClose,
}: CreatePOFormProps) {
	const form = useForm({
		resolver: zodResolver(purchaseOrderFormSchema),
		defaultValues: {
			supplierId: "",
			expectedDeliveryDate: new Date(),
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
			paymentMethod: "Bank Transfer",
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

	const { mutateAsync, isPending } = useMutation({
		mutationFn: addPurchaseOrder,
		onSuccess: async (response) => {
			if (response.success) {
				toast.success("Purchase order created successfully");
				await revalidateRoute("/dashboard/inventory/purchase-orders");
				onClose?.();
			} else {
				toast.error(response.error || "Failed to create purchase order");
			}
		},
	});

	const onSubmit = async (data: z.infer<typeof purchaseOrderFormSchema>) => {
		const formattedData = {
			...data,
			expectedDeliveryDate: data.expectedDeliveryDate.toISOString(),
			items: data.items.map((item) => ({
				...item,
				itemId: crypto.randomUUID(),
				productDescription:
					products.find((p) => p.id === item.productId)?.description || "",
			})),
			orderDate: new Date().toISOString(),
		};
		//@ts-expect-error
		await mutateAsync(formattedData);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-4"
			>
				{/* Header Section */}
				<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
					<FormField
						control={form.control}
						name="supplierId"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Supplier *</FormLabel>
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
							<FormItem className="flex flex-col">
								<FormLabel className="text-xs">Expected Delivery *</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={"outline"}
												className={cn(
													"h-8 text-xs pl-3 text-left font-normal",
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
												date < new Date("1900-01-01")
											}
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
						name="requisitionNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Requisition No.</FormLabel>
								<FormControl>
									<Input placeholder="REQ-001" {...field} className="h-8 text-xs" />
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
								<FormLabel className="text-xs">Quotation No.</FormLabel>
								<FormControl>
									<Input placeholder="QUO-001" {...field} className="h-8 text-xs" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="paymentTerms"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Payment Terms</FormLabel>
								<FormControl>
									<Input placeholder="e.g. Net 30" {...field} className="h-8 text-xs" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="paymentMethod"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Payment Method</FormLabel>
								<FormControl>
									<Input placeholder="e.g. Transfer" {...field} className="h-8 text-xs" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<Separator />

				{/* Items Section */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">Items</h3>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={() =>
								append({
									productId: "",
									productName: "",
									quantityOrdered: 1,
									unit: "PCS",
									unitPrice: 0,
									discountPercent: 0,
									taxRate: 0,
									notes: "",
									specifications: "",
								})
							}
						>
							<PlusIcon className="w-3 h-3 mr-1" /> Add Item
						</Button>
					</div>

					<div className="border rounded-md overflow-x-auto">
						<Table className="min-w-[900px]">
							<TableHeader>
								<TableRow className="h-8">
									<TableHead className="h-8 text-xs w-[220px] min-w-[220px]">Product</TableHead>
									<TableHead className="h-8 text-xs w-[70px] min-w-[70px]">Qty</TableHead>
									<TableHead className="h-8 text-xs w-[80px] min-w-[80px]">Unit</TableHead>
									<TableHead className="h-8 text-xs w-[110px] min-w-[110px]">Price</TableHead>
									<TableHead className="h-8 text-xs w-[75px] min-w-[75px]">Disc %</TableHead>
									<TableHead className="h-8 text-xs w-[75px] min-w-[75px]">Tax %</TableHead>
									<TableHead className="h-8 text-xs min-w-[180px]">Specs/Notes</TableHead>
									<TableHead className="h-8 text-xs w-[50px]"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{fields.map((field, index) => (
									<TableRow key={field.id} className="h-10">
										<TableCell className="p-2">
											<FormField
												control={form.control}
												name={`items.${index}.productId`}
												render={({ field }) => (
													<ProductCombobox
														products={products}
														value={field.value}
														selectedName={form.watch(`items.${index}.productName`)}
														onSelectRaw={(product) => {
															form.setValue(`items.${index}.productName`, product.name);
															form.setValue(`items.${index}.unit`, product.baseUnit || "PCS");
															form.setValue(`items.${index}.unitPrice`, product.sellingPrice || 0); // Default to cost price
															field.onChange(product.id);
														}}
													/>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<FormField
												control={form.control}
												name={`items.${index}.quantityOrdered`}
												render={() => (
													<Input
														type="number"
														min="1"
														{...form.register(`items.${index}.quantityOrdered`, {
															valueAsNumber: true,
														})}
														className="h-7 text-xs min-w-[60px]"
													/>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<FormField
												control={form.control}
												name={`items.${index}.unit`}
												render={() => (
													<Input
														{...form.register(`items.${index}.unit`)}
														className="h-7 text-xs min-w-[70px]"
													/>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<FormField
												control={form.control}
												name={`items.${index}.unitPrice`}
												render={() => (
													<Input
														type="number"
														min="0"
														step="0.01"
														{...form.register(`items.${index}.unitPrice`, {
															valueAsNumber: true,
														})}
														className="h-7 text-xs min-w-[90px]"
													/>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<FormField
												control={form.control}
												name={`items.${index}.discountPercent`}
												render={() => (
													<Input
														type="number"
														min="0"
														max="100"
														{...form.register(`items.${index}.discountPercent`, {
															valueAsNumber: true,
														})}
														className="h-7 text-xs min-w-[65px]"
													/>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<FormField
												control={form.control}
												name={`items.${index}.taxRate`}
												render={() => (
													<Input
														type="number"
														min="0"
														max="100"
														{...form.register(`items.${index}.taxRate`, {
															valueAsNumber: true,
														})}
														className="h-7 text-xs min-w-[65px]"
													/>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<div className="flex gap-1">
												<FormField
													control={form.control}
													name={`items.${index}.specifications`}
													render={() => (
														<Input
															placeholder="Specs"
															{...form.register(`items.${index}.specifications`)}
															className="h-7 text-xs min-w-[90px]"
														/>
													)}
												/>
												<FormField
													control={form.control}
													name={`items.${index}.notes`}
													render={() => (
														<Input
															placeholder="Notes"
															{...form.register(`items.${index}.notes`)}
															className="h-7 text-xs min-w-[80px]"
														/>
													)}
												/>
											</div>
										</TableCell>
										<TableCell className="p-2 text-center">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-7 w-7 text-destructive hover:text-destructive/90"
												onClick={() => remove(index)}
											>
												<TrashIcon className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
								{fields.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={8}
											className="h-24 text-center text-xs text-muted-foreground"
										>
											No products added. Click "Add Item" to start.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					{form.formState.errors.items && (
						<p className="text-xs font-medium text-destructive">
							{form.formState.errors.items.message}
						</p>
					)}
				</div>

				<Separator />

				{/* Financials & Additional Info */}
				<div className="space-y-4">
					<h3 className="text-sm font-semibold">Financials & Logistics</h3>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
						<FormField
							control={form.control}
							name="currency"
							render={() => (
								<FormItem>
									<FormLabel className="text-xs">Currency</FormLabel>
									<FormControl>
										<Input placeholder="NGN" {...form.register(`currency`)} className="h-8 text-xs" />
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
									<FormLabel className="text-xs">Shipping Cost</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="0"
											step="0.01"
											{...form.register(`shippingCost`, { valueAsNumber: true })}
											className="h-8 text-xs"
										/>
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
									<FormLabel className="text-xs">Other Charges</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="0"
											step="0.01"
											{...form.register(`otherCharges`, { valueAsNumber: true })}
											className="h-8 text-xs"
										/>
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
									<FormLabel className="text-xs">Global Disc %</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="0"
											max="100"
											step="0.1"
											{...form.register(`discountPercent`, { valueAsNumber: true })}
											className="h-8 text-xs"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<FormField
							control={form.control}
							name="deliveryAddress"
							render={() => (
								<FormItem>
									<FormLabel className="text-xs">Delivery Address</FormLabel>
									<FormControl>
										<Input placeholder="Full address" {...form.register(`deliveryAddress`)} className="h-8 text-xs" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="deliveryInstructions"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">Delivery Instructions</FormLabel>
									<FormControl>
										<Input placeholder="Instructions..." {...field} className="h-8 text-xs" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
						<FormField
							control={form.control}
							name="termsAndConditions"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs">Terms & Conditions</FormLabel>
									<FormControl>
										<Textarea placeholder="Terms..." className="resize-none h-16 text-xs" {...field} />
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
									<FormLabel className="text-xs">External Notes</FormLabel>
									<FormControl>
										<Textarea placeholder="For supplier..." className="resize-none h-16 text-xs" {...field} />
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
									<FormLabel className="text-xs">Internal Notes</FormLabel>
									<FormControl>
										<Textarea placeholder="Internal use only..." className="resize-none h-16 text-xs" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-4 border-t sticky -bottom-0 bg-background pb-2">
					<DialogClose asChild>
						<Button variant="outline" type="button" className="h-8 text-xs" onClick={onClose}>
							Cancel
						</Button>
					</DialogClose>
					<Button type="submit" disabled={isPending} className="h-8 text-xs">
						{isPending ? <Loader2Icon className="animate-spin mr-2 h-4 w-4" /> : null}
						Create Purchase Order
					</Button>
				</div>
			</form>
		</Form>
	);
}
