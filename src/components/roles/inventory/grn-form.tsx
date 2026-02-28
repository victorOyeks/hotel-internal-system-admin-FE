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
import { addGRNItem } from "@/lib/inventory-actions";
import { revalidateRoute } from "@/lib/actions";
import type {
	InventoryGRNResponse,
	InventoryLocationResponse,
	InventoryProduct,
	InventorySupplierMini,
	PurchaseOrderListItem,
} from "@/lib/fetch";
import { editGRN } from "@/lib/inventory-actions";

// --- Schema Definition ---

const itemSchema = z.object({
	productId: z.string().min(1, "Product is required"),
	productName: z.string().optional(),
	purchaseOrderItemId: z.string().optional(),
	quantityReceived: z.coerce.number().min(0),
	quantityAccepted: z.coerce.number().min(0),
	quantityRejected: z.coerce.number().min(0),
	unit: z.string().default("KG"),
	unitPrice: z.coerce.number().min(0),
	taxRate: z.coerce.number().min(0).default(0),
	batchNumber: z.string().optional(),
	serialNumber: z.string().optional(),
	manufactureDate: z.date().optional(),
	expiryDate: z.date().optional(),
	qualityStatus: z.string().optional(),
	qualityNotes: z.string().optional(),
	rejectionReason: z.string().optional(),
	damageDetails: z.string().optional(),
	packagingCondition: z.string().optional(),
	damaged: z.boolean().default(false),
	expired: z.boolean().default(false),
	notes: z.string().optional(),
	storageLocation: z.string().optional(),
});

const grnSchema = z.object({
	purchaseOrderId: z.string().optional(),
	supplierId: z.string().min(1, "Supplier is required"),
	supplierInvoiceNumber: z.string().optional(),
	supplierInvoiceDate: z.date().optional(),
	supplierDeliveryNote: z.string().optional(),
	storageLocationId: z.string().min(1, "Storage location is required"),
	receiptDate: z.date({ error: "Receipt date is required" }),
	receiptTime: z.string().optional(), // Keeping as string for time input
	deliveredBy: z.string().optional(),
	vehicleNumber: z.string().optional(),
	inspectionRequired: z.boolean().default(true),
	items: z.array(itemSchema).default([]),
	notes: z.string().optional(),
	discrepancies: z.string().optional(),
	packagingCondition: z.string().optional(),
});

type GrnFormValues = z.infer<typeof grnSchema>;



// --- Components ---

function SupplierCombobox({
	value,
	onValueChange,
	suppliers,
}: {
	value: string;
	onValueChange: (value: string) => void;
	suppliers: InventorySupplierMini[];
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

function LocationCombobox({
	value,
	onValueChange,
	locations,
}: {
	value: string;
	onValueChange: (value: string) => void;
	locations: InventoryLocationResponse[];
}) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useQueryState(
		"location-search",
		parseAsString.withDefault(""),
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between h-8 text-xs"
				>
					{value
						? locations.find((location) => location.id === value)
							?.locationName || value
						: "Select location..."}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search location..."
						value={searchQuery}
						onValueChange={setSearchQuery}
						className="h-8 text-xs"
					/>
					<CommandList>
						<CommandEmpty>No location found.</CommandEmpty>
						<CommandGroup>
							{locations.map((location) => (
								<CommandItem
									key={location.id}
									value={location.id}
									onSelect={(currentValue) => {
										onValueChange(currentValue === value ? "" : currentValue);
										setOpen(false);
									}}
									className="text-xs"
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === location.id ? "opacity-100" : "opacity-0",
										)}
									/>
									{location.locationName}
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
	onSelectRaw: (value: InventoryProduct) => void;
	selectedName?: string;
	products: InventoryProduct[];
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

function PurchaseOrderCombobox({
	value,
	onValueChange,
	purchaseOrders,
}: {
	value: string;
	onValueChange: (value: string) => void;
	purchaseOrders: PurchaseOrderListItem[];
}) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useQueryState(
		"po-search",
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
						? purchaseOrders.find((po) => po.id === value)?.poNumber || value
						: "Select PO..."}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search PO..."
						value={searchQuery}
						onValueChange={setSearchQuery}
						className="h-8 text-xs"
					/>
					<CommandList>
						<CommandEmpty>No PO found.</CommandEmpty>
						<CommandGroup>
							{purchaseOrders.map((po) => (
								<CommandItem
									key={po.id}
									value={po.poNumber}
									onSelect={(currentValue) => {
										onValueChange(currentValue === value ? "" : currentValue);
										setOpen(false);
									}}
									className="text-xs"
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === po.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div className="flex flex-col">
										<span>{po.poNumber}</span>
										<span className="text-[10px] text-muted-foreground">
											{po.supplierName}
										</span>
									</div>
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

export function CreateGRNForm({
	onClose,
	grnLocations,
	suppliers,
	products,
	initialData,
	purchaseOrders,
}: {
	grnLocations: InventoryLocationResponse[];
	suppliers: InventorySupplierMini[];
	products: InventoryProduct[];
	purchaseOrders: PurchaseOrderListItem[];
	onClose: () => void;
	initialData?: InventoryGRNResponse;
}) {
	const form = useForm({
		resolver: zodResolver(grnSchema),
		defaultValues: {
			purchaseOrderId: initialData?.purchaseOrderId || "",
			supplierId: initialData?.supplierId || "",
			supplierInvoiceNumber: initialData?.supplierInvoiceNumber || "",
			supplierInvoiceDate: initialData?.supplierInvoiceDate
				? new Date(initialData.supplierInvoiceDate)
				: undefined,
			supplierDeliveryNote: initialData?.supplierDeliveryNote || "",
			storageLocationId: initialData?.storageLocationId || "",
			receiptDate: initialData?.receiptDate
				? new Date(initialData.receiptDate)
				: new Date(),
			receiptTime: initialData?.receiptTime || "",
			deliveredBy: initialData?.deliveredBy || "",
			vehicleNumber: initialData?.vehicleNumber || "",
			inspectionRequired: initialData?.inspectionRequired ?? true,
			items: initialData?.items?.map((item) => ({
				productId: item.productId,
				productName: item.productName || item.productSku || "",
				quantityReceived: item.quantityReceived,
				quantityAccepted: item.quantityAccepted,
				quantityRejected: item.quantityRejected,
				unit: item.unit,
				unitPrice: item.unitPrice,
				taxRate: item.taxRate,
				batchNumber: item.batchNumber || "",
				serialNumber: item.serialNumber || "",
				manufactureDate: item.manufactureDate
					? new Date(item.manufactureDate)
					: undefined,
				expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
				qualityStatus: item.qualityStatus || "",
				qualityNotes: item.qualityNotes || "",
				rejectionReason: item.rejectionReason || "",
				damageDetails: item.damageDetails || "",
				packagingCondition: item.packagingCondition || "",
				damaged: item.damaged || false,
				expired: item.expired || false,
				notes: item.notes || "",
				storageLocation: item.storageLocation || "",
			})) || [],
			notes: initialData?.notes || "",
			discrepancies: initialData?.discrepancies || "",
			packagingCondition: initialData?.packagingCondition || "",
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const { mutateAsync } = useMutation({
		mutationKey: ["grn-form"],
		mutationFn: async (payload: GrnFormValues) => {
			if (initialData) {
				//@ts-expect-error 
				const response = await editGRN(initialData.id, payload);
				if (!response.success) {
					throw Error(response.error);
				}
				return response.data;
			}
			const response = await addGRNItem(payload);

			if (!response.success) {
				throw Error(response.error);
			}

			return response.data!;
		},
		async onSuccess(message) {
			toast.success(initialData ? "GRN updated successfully" : "GRN added succesfully", {
				description: typeof message === "string" ? message : undefined,
			});
			await revalidateRoute("/dashboard/grn");
			onClose();
		},
		onError(error) {
			toast.error("Something went wrong!", {
				description: error.message,
			});
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((data) => mutateAsync(data))}
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
						name="purchaseOrderId"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">PO Number</FormLabel>
								<FormControl>
									<PurchaseOrderCombobox
										purchaseOrders={purchaseOrders}
										value={field.value || ""}
										onValueChange={field.onChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="storageLocationId"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Storage Loc *</FormLabel>
								<FormControl>
									<LocationCombobox
										locations={grnLocations}
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
						name="receiptDate"
						render={({ field }) => (
							<FormItem className="flex flex-col">
								<FormLabel className="text-xs">Receipt Date *</FormLabel>
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
												date > new Date() || date < new Date("1900-01-01")
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
						name="supplierInvoiceNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Invoice No.</FormLabel>
								<FormControl>
									<Input {...field} className="h-8 text-xs" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="supplierDeliveryNote"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Delivery Note</FormLabel>
								<FormControl>
									<Input {...field} className="h-8 text-xs" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="deliveredBy"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Delivered By</FormLabel>
								<FormControl>
									<Input {...field} className="h-8 text-xs" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="vehicleNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Vehicle No.</FormLabel>
								<FormControl>
									<Input {...field} className="h-8 text-xs" />
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
									quantityReceived: 0,
									quantityAccepted: 0,
									quantityRejected: 0,
									unit: "KG",
									unitPrice: 0,
									taxRate: 0,
									damaged: false,
									expired: false,
								})
							}
						>
							<PlusIcon className="w-3 h-3 mr-1" /> Add Item
						</Button>
					</div>

					<div className="border rounded-md overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="h-8">
									<TableHead className="h-8 text-xs w-[150px]">
										Product
									</TableHead>
									<TableHead className="h-8 text-xs w-[80px]">
										Qty Rec
									</TableHead>
									<TableHead className="h-8 text-xs w-[80px]">
										Qty Acc
									</TableHead>
									<TableHead className="h-8 text-xs w-[80px]">Price</TableHead>
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
															field.onChange(product.id);
														}}
													/>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<FormField
												control={form.control}
												name={`items.${index}.quantityReceived`}
												render={() => (
													<Input
														type="number"
														{...form.register(
															`items.${index}.quantityReceived`,
															{
																valueAsNumber: true,
															},
														)}
														className="h-7 text-xs"
													/>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<FormField
												control={form.control}
												name={`items.${index}.quantityAccepted`}
												render={() => (
													<Input
														type="number"
														{...form.register(
															`items.${index}.quantityAccepted`,
															{
																valueAsNumber: true,
															},
														)}
														className="h-7 text-xs"
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
														{...form.register(`items.${index}.unitPrice`, {
															valueAsNumber: true,
														})}
														className="h-7 text-xs"
													/>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<Button
												variant="destructive"
												size="icon"
												className="h-7 w-7"
												onClick={() => remove(index)}
											>
												<TrashIcon className="w-4 h-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						{fields.length === 0 && (
							<div className="p-4 text-center text-xs text-muted-foreground">
								No items added.
							</div>
						)}
					</div>
				</div>

				<Separator />

				{/* Footer Section */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<FormField
						control={form.control}
						name="notes"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Notes</FormLabel>
								<FormControl>
									<Textarea {...field} className="min-h-[60px] text-xs" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="discrepancies"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">Discrepancies</FormLabel>
								<FormControl>
									<Textarea {...field} className="min-h-[60px] text-xs" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<Button
						variant="outline"
						disabled={form.formState.isSubmitting}
						onClick={onClose}
						size="sm"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={form.formState.isSubmitting}
						size="sm"
					>
						{form.formState.isSubmitting ? (
							<>
								<Loader2Icon className="animate-spin" />
								Creating...
							</>
						) : (
							initialData ? "Update GRN" : "Create GRN"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
