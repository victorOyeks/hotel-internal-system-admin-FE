"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, PlusIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { mockSuppliers, mockStorageLocations } from "./grn-mock";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// --- Schema Definition ---

const itemSchema = z.object({
	productId: z.string().min(1, "Product is required"),
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

// --- Component ---

export function CreateGRNForm({ onClose }: { onClose: () => void }) {
	const form = useForm({
		resolver: zodResolver(grnSchema),
		defaultValues: {
			receiptDate: new Date(),
			inspectionRequired: true,
			items: [],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const { mutateAsync } = useMutation({
		mutationKey: ["grn-form"],
		mutationFn: async (payload: z.infer<typeof grnSchema>) => {},
		onSuccess() {
			toast.success("");
			onClose();
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
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue placeholder="Select supplier" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{mockSuppliers.map((s) => (
											<SelectItem key={s.id} value={s.id} className="text-xs">
												{s.name}
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
						name="purchaseOrderId"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs">PO Number</FormLabel>
								<FormControl>
									<Input
										{...field}
										className="h-8 text-xs"
										placeholder="PO-..."
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
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue placeholder="Select location" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{mockStorageLocations.map((l) => (
											<SelectItem key={l.id} value={l.id} className="text-xs">
												{l.name}
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
									<TableHead className="h-8 text-xs w-[100px]">Batch</TableHead>
									<TableHead className="h-8 text-xs w-[100px]">
										Expiry
									</TableHead>
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
													<Input
														{...field}
														className="h-7 text-xs"
														placeholder="Prod ID"
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
											<FormField
												control={form.control}
												name={`items.${index}.batchNumber`}
												render={({ field }) => (
													<Input {...field} className="h-7 text-xs" />
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<FormField
												control={form.control}
												name={`items.${index}.expiryDate`}
												render={({ field }) => (
													<Popover>
														<PopoverTrigger asChild>
															<Button
																variant={"outline"}
																className={cn(
																	"h-7 w-full text-xs px-2 text-left font-normal",
																	!field.value && "text-muted-foreground",
																)}
															>
																{field.value ? (
																	format(field.value, "MM/dd/yy")
																) : (
																	<span>Pick</span>
																)}
															</Button>
														</PopoverTrigger>
														<PopoverContent
															className="w-auto p-0"
															align="start"
														>
															<Calendar
																mode="single"
																selected={field.value}
																onSelect={field.onChange}
																initialFocus
															/>
														</PopoverContent>
													</Popover>
												)}
											/>
										</TableCell>
										<TableCell className="p-2">
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 text-destructive"
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
					<Button variant="outline" onClick={onClose} size="sm">
						Cancel
					</Button>
					<Button type="submit" size="sm">
						Create GRN
					</Button>
				</div>
			</form>
		</Form>
	);
}
