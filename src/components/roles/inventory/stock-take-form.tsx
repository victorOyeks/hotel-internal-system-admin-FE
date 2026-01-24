"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import type { InventoryLocationListResponse, InventoryProduct } from "@/lib/fetch";
import { MultiSelect, MultiSelectTrigger, MultiSelectValue, MultiSelectContent, MultiSelectItem } from "@/components/ui/multi-select";
import { useQueryState, parseAsString } from "nuqs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ChevronsUpDownIcon, CheckIcon } from "lucide-react";

const stockTakeFormSchema = z.object({
	locationId: z.string().min(1, "Location is required"),
	stockTakeType: z.string().min(1, "Type is required"),
	scheduledDate: z.string().min(1, "Scheduled date is required"),
	supervisorId: z.string().min(1, "Supervisor ID is required"),
	supervisorName: z.string().min(1, "Supervisor Name is required"),
	countedBy: z.string().min(1, "Counted By is required"),
	acceptableVariancePercent: z.coerce
		.number()
		.min(0)
		.max(100, "Must be between 0 and 100"),
	stockFrozen: z.boolean().default(false),
	productIds: z.array(z.string()).default([]),
	notes: z.string().optional(),
});

function ProductCombobox({
	products,
	search,
	setSearch,
	onValueChange,
}: {
	products: InventoryProduct[];
	search: string;
	setSearch: (search: string) => void;
	onValueChange: (id: string) => void;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="w-full justify-between"
				>
					{search
						? products.find((item) => item.id === search)?.name
						: "Select item..."}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full flex-1 p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search items..."
						value={products.find((item) => item.id === search)?.name}
						onValueChange={(value) => setSearch(value)}
					/>
					<CommandList>
						<CommandEmpty>No item found.</CommandEmpty>
						<CommandGroup>
							{products.map((item) => (
								<CommandItem
									key={item.id}
									value={item.id}
									onSelect={(currentValue) => {
										setSearch("");
										onValueChange(currentValue);
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											search === item.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div>
										<div>{item.name}</div>
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

type StockTakeFormValues = z.infer<typeof stockTakeFormSchema>;

interface CreateStockTakeFormProps {
	onClose: () => void;
	inventoryLocations: InventoryLocationListResponse[]
	products: InventoryProduct[]
}

export function CreateStockTakeForm({ onClose, inventoryLocations, products }: CreateStockTakeFormProps) {
	const form = useForm({
		resolver: zodResolver(stockTakeFormSchema),
		defaultValues: {
			locationId: "",
			stockTakeType: "FULL",
			scheduledDate: new Date().toISOString().split("T")[0],
			supervisorId: "",
			supervisorName: "",
			countedBy: "",
			acceptableVariancePercent: 100,
			stockFrozen: true,
			productIds: [],
		},
	});

	const [search, setSearch] = useQueryState(
		"product-list:search",
		parseAsString.withDefault(""),
	);


	const [locationSearch, setLocationSearch] = useQueryState(
		"location-list:search",
		parseAsString.withDefault(""),
	);

	const handleSubmit = (data: StockTakeFormValues) => {
		console.log("Creating stock take:", data);
		// API call would go here
		alert(
			"Stock take created successfully! Payload logged to console.",
		);
		onClose();
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<div className="grid grid-cols-2 gap-2">
					<FormField
						control={form.control}
						name="locationId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Storage Location *</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select location" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{inventoryLocations.map((location) => (
											<SelectItem key={location.id} value={location.id}>
												{location.locationName} ({location.locationCode})
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
						name="scheduledDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Scheduled Date *</FormLabel>
								<FormControl>
									<Input type="date" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="stockTakeType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Stock Take Type *</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent className="w-full">
										<SelectItem value="FULL">Full Count</SelectItem>
										<SelectItem value="PARTIAL">Partial Count</SelectItem>
										<SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="supervisorName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Supervisor Name *</FormLabel>
								<FormControl>
									<Input placeholder="Enter supervisor name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="supervisorId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Supervisor ID *</FormLabel>
								<FormControl>
									<Input placeholder="Enter supervisor ID" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="countedBy"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Counted By *</FormLabel>
								<FormControl>
									<Input placeholder="Enter counter name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="acceptableVariancePercent"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Acceptable Variance % *</FormLabel>
								<FormControl>
									<Input
										type="number"
										min="0"
										max="100"
										step="0.1"
										{...field}
										value={field.value as number}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="productIds"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Products</FormLabel>
								<FormControl>
									<ProductCombobox
										products={products}
										search={search}
										setSearch={setSearch}
										onValueChange={field.onChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="stockFrozen"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Freeze Stock</FormLabel>
								<FormDescription>
									Prevent stock movements during the count.
								</FormDescription>
							</div>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Notes</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Additional notes or instructions..."
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
					<Button type="submit">Create Stock Take</Button>
				</div>
			</form>
		</Form>
	);
}
