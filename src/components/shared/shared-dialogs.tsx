"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { Button } from "../ui/button";
import z from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { formatDate } from "date-fns";
import { Calendar } from "../ui/calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { useCallback, useState } from "react";

export function SuccessDialog({
	open,
	setOpen,
	message = "Changes saved.",
}: {
	open: boolean;
	message?: string;
	setOpen: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={setOpen} modal>
			<DialogContent className="gap-0 !max-w-sm" showCloseButton={false}>
				<CheckCircle2Icon
					className="size-16 mx-auto text-green-600"
					strokeWidth={1}
				/>
				<DialogTitle className="text-center text-2xl">Success!</DialogTitle>
				<DialogDescription className="text-center text-lg">
					{message}
				</DialogDescription>
			</DialogContent>
		</Dialog>
	);
}

const exportSchema = z.object({
	from_date: z.date({ error: "Please select a valid starting date" }),
	to_date: z.date({ error: "Please select a valid ending date" }),
	export_type: z
		.string()
		.nonempty({ message: "Please select an export type" })
		.refine((val) => ["pdf", "csv"].includes(val)),
	destination: z.email({ message: "Please enter a valid email address" }),
});

export type ExportData = z.infer<typeof exportSchema>;

export function ExportDialog({
	onSubmit,
	open,
	setOpen,
}: {
	onSubmit: (data: ExportData) => void | Promise<void>;
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const [pending, setPending] = useState(false);
	const form = useForm({
		resolver: zodResolver(exportSchema),
		defaultValues: {
			from_date: undefined,
			to_date: undefined,
			export_type: "",
			destination: "",
		},
	});

	const handleSubmit = useCallback(
		async (data: ExportData) => {
			try {
				setPending(true);
				await onSubmit(data);
				form.reset();
			} catch (error) {
				console.error("Export failed:", error);
				// Handle error, e.g., show a toast notification
			} finally {
				setPending(false);
			}
		},
		[onSubmit, form.reset],
	);

	return (
		<Dialog open={open} onOpenChange={setOpen} modal>
			<DialogTrigger asChild>
				<Button size={"sm"} className="rounded-md md:rounded-xl">
					Export
				</Button>
			</DialogTrigger>
			<DialogContent className="md:w-sm md:p-4 rounded-3xl">
				<DialogTitle>Export file</DialogTitle>
				<DialogDescription className="sr-only">
					Export your data
				</DialogDescription>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<div className="grid grid-cols-2 gap-x-2">
							<FormField
								control={form.control}
								name="from_date"
								render={({ field }) => (
									<FormItem className="flex flex-col col-span-1 space-y-1">
										<FormLabel className="font-semibold">From</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant={"outline"}
														className={cn(
															"w-full pl-3 text-left font-normal",
															!field.value && "text-muted-foreground",
														)}
													>
														{field.value ? (
															formatDate(field.value, "PPP")
														) : (
															<span>Pick a date</span>
														)}
														<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent
												className="w-auto p-0"
												align="center"
												side="right"
											>
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													disabled={(date) =>
														date > new Date() || date < new Date("1900-01-01")
													}
													captionLayout="dropdown"
												/>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="to_date"
								render={({ field }) => (
									<FormItem className="flex flex-col col-span-1 space-y-1">
										<FormLabel className="font-semibold">To</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant={"outline"}
														className={cn(
															"w-full pl-3 text-left font-normal",
															!field.value && "text-muted-foreground",
														)}
													>
														{field.value ? (
															formatDate(field.value, "PPP")
														) : (
															<span>Pick a date</span>
														)}
														<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent
												className="w-auto p-0"
												align="center"
												side="left"
											>
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													disabled={(date) =>
														date > new Date() || date < new Date("1900-01-01")
													}
													captionLayout="dropdown"
												/>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="export_type"
							render={({ field }) => (
								<FormItem className="flex flex-col w-full space-y-1">
									<FormLabel className="font-semibold">Export Type</FormLabel>
									<FormControl>
										<Select
											{...field}
											value={field.value}
											onValueChange={field.onChange}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select export type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="pdf">PDF</SelectItem>
												<SelectItem value="csv">CSV</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="destination"
							render={({ field }) => (
								<FormItem className="flex flex-col w-full space-y-1">
									<FormLabel className="font-semibold">Email</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="email"
											placeholder="m@example.com"
											className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							className="w-full rounded-2xl"
							type="submit"
							disabled={pending}
						>
							{pending ? (
								<>
									<Loader2Icon className="animate-spin" />
									Exporting...
								</>
							) : (
								"Export"
							)}
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
