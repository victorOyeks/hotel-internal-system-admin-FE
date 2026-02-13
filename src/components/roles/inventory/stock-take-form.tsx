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
import { useMutation } from "@tanstack/react-query";
import { addStockTake } from "@/lib/inventory-actions";
import { toast } from "sonner";
import type { InventoryLocationListResponse } from "@/lib/fetch";
import { useQueryState, parseAsString } from "nuqs";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ChevronsUpDownIcon, CheckIcon, CalendarIcon } from "lucide-react";
import { revalidateRoute } from "@/lib/actions";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

function LocationCombobox({
	value,
	onValueChange,
	locations,
}: {
	value: string;
	onValueChange: (value: string) => void;
	locations: InventoryLocationListResponse[];
}) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useQueryState(
		"location-list:search",
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
						? locations.find((location) => location.id === value)?.locationName
						: "Select location..."}
					<ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search locations..."
						value={searchQuery}
						onValueChange={(value) => setSearchQuery(value)}
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
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === location.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div>
										<div className="font-medium">{location.locationCode}</div>
										<div className="text-sm text-gray-500">
											{location.locationName}
										</div>
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

const stockTakeFormSchema = z.object({
	locationId: z.string().nonempty("Location is required"),
	stockTakeType: z.string().nonempty("Type is required"),
	scheduledDate: z.string().nonempty("Scheduled date is required"),
	supervisorName: z.string().nonempty("Supervisor Name is required"),
	countedBy: z.string().nonempty("Counted By is required"),
	acceptableVariancePercent: z.coerce
		.number()
		.min(0)
		.max(100, "Must be between 0 and 100"),
	stockFrozen: z.boolean().default(false),
	notes: z.string().optional(),
});

interface CreateStockTakeFormProps {
	onClose: () => void;
	inventoryLocations: InventoryLocationListResponse[]
}
export function CreateStockTakeForm({ onClose, inventoryLocations }: CreateStockTakeFormProps) {
	const form = useForm({
		resolver: zodResolver(stockTakeFormSchema),
		defaultValues: {
			locationId: "",
			stockTakeType: "FULL",
			scheduledDate: new Date().toISOString().split("T")[0],
			supervisorName: "",
			countedBy: "",
			acceptableVariancePercent: 100,
			stockFrozen: true,
		},
	});

	const { mutateAsync, isPending } = useMutation({
		mutationFn: addStockTake,
		onSuccess: async (response) => {
			if (response.success) {
				toast.success("Stock take created successfully");
				await revalidateRoute("/dashboard/stock-takes")
				onClose();
			} else {
				toast.error(response.error || "Failed to create stock take");
			}
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit((data) => mutateAsync({ ...data, productIds: [] }))} className="space-y-6">
				<div className="grid grid-cols-2 gap-2">
					<FormField
						control={form.control}
						name="locationId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Storage Location *</FormLabel>

								<FormControl>
									<LocationCombobox
										locations={inventoryLocations}
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
						name="scheduledDate"
						render={({ field }) => (
							<FormItem className="flex flex-col">
								<FormLabel className="text-xs">Scheduled Date *</FormLabel>
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
											selected={new Date(field.value)}
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
					<Button type="submit" disabled={isPending}>
						{isPending ? "Creating..." : "Create Stock Take"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
