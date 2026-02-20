"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { extendRentalOrder } from "@/lib/rental-actions";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon, Loader2Icon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const extensionSchema = z.object({
	newEndTime: z.date({
		error: "New end date is required",
	}),
	notes: z.string().optional(),
});

type ExtensionFormData = z.infer<typeof extensionSchema>;

type ExtensionDialogProps = {
	trigger?: React.ReactNode;
	orderId: string;
	currentReturnDate?: Date;
	onSuccess?: () => void;
};

export function ExtensionDialog({
	trigger,
	orderId,
	currentReturnDate,
	onSuccess,
}: ExtensionDialogProps) {
	const [open, setOpen] = useState(false);
	const [calendarOpen, setCalendarOpen] = useState(false);
	const queryClient = useQueryClient();
	const router = useRouter();

	const form = useForm<ExtensionFormData>({
		resolver: zodResolver(extensionSchema),
		defaultValues: {
			notes: "",
		},
	});

	const mutation = useMutation({
		mutationFn: async (data: ExtensionFormData) => {
			const result = await extendRentalOrder(orderId, {
				newEndTime: data.newEndTime.toISOString(),
				notes: data.notes,
			});
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success("Rental extended successfully", {
				description: `New end date: ${format(form.watch("newEndTime"), "PPP")}`,
			});
			queryClient.invalidateQueries({ queryKey: ["rentals", "orders"] });
			queryClient.invalidateQueries({
				queryKey: ["rentals", "dashboard-stats"],
			});
			router.refresh();
			setOpen(false);
			form.reset();
			onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to extend rental");
		},
	});

	const onSubmit = (data: ExtensionFormData) => {
		if (currentReturnDate && data.newEndTime <= currentReturnDate) {
			toast.error("New end date must be after current return date");
			return;
		}
		mutation.mutate(data);
	};

	const calculateExtension = () => {
		const newDate = form.watch("newEndTime");
		if (currentReturnDate && newDate) {
			const hours = Math.ceil(
				(newDate.getTime() - currentReturnDate.getTime()) / (1000 * 60 * 60),
			);
			const days = Math.ceil(hours / 24);
			return { hours, days };
		}
		return null;
	};

	const extension = calculateExtension();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline">
						<ClockIcon className="w-4 h-4 mr-2" />
						Extend Rental
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Extend Rental Period</DialogTitle>
					<DialogDescription>
						Extend the rental period for this order
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
						{currentReturnDate && (
							<Card className="bg-gray-50">
								<CardContent className="py-3">
									<div className="text-sm">
										<p className="text-muted-foreground">
											Current Return Date:
										</p>
										<p className="font-semibold mt-0.5">
											{format(currentReturnDate, "PPP")}
										</p>
									</div>
								</CardContent>
							</Card>
						)}

						<FormField
							control={form.control}
							name="newEndTime"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>New End Date *</FormLabel>
									<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn(
														"pl-3 text-left font-normal",
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
												onSelect={(date) => {
													field.onChange(date);
													setCalendarOpen(false);
												}}
												disabled={(date) =>
													date < (currentReturnDate || new Date())
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
									<FormDescription>
										Must be after the current return date
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{extension && (
							<Card className="bg-blue-50 border-blue-200">
								<CardContent className="py-3">
									<div className="space-y-0.5">
										<p className="text-sm font-semibold text-blue-900">
											Extension Details:
										</p>
										<p className="text-sm text-blue-800">
											Additional {extension.days} day
											{extension.days !== 1 ? "s" : ""} ({extension.hours}{" "}
											hours)
										</p>
										<p className="text-xs text-blue-700 mt-2">
											Extension fees will be calculated based on the rental
											rates
										</p>
									</div>
								</CardContent>
							</Card>
						)}

						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Reason for extension or additional notes..."
											className="min-h-[60px]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={mutation.isPending}
								className="bg-gradient-to-r from-blue-600 to-indigo-600"
							>
								{mutation.isPending && (
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
								)}
								Extend Rental
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
