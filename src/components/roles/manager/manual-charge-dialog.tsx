"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addManualCharge } from "@/lib/corporate-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const manualChargeSchema = z.object({
	description: z.string().min(1, "Description is required"),
	amount: z.coerce.number().positive("Amount must be greater than 0"),
});

export function ManualChargeDialog({
	bookingId,
	guestName,
	trigger,
}: {
	bookingId: string;
	guestName: string;
	trigger?: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm({
		resolver: zodResolver(manualChargeSchema),
		defaultValues: {
			description: "",
			amount: 0,
		},
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof manualChargeSchema>) => {
			const response = await addManualCharge({
				bookingId,
				...data,
			});
			if (!response.success) {
				throw new Error(response.error);
			}
			return response.data;
		},
		onSuccess: () => {
			setOpen(false);
			form.reset();
			toast.success("Manual charge added successfully");
			queryClient.invalidateQueries({ queryKey: ["organization-guests"] });
			queryClient.invalidateQueries({ queryKey: ["organization-transactions"] });
		},
		onError: (e) => {
			toast.error("Failed to add manual charge", {
				description: e.message,
			});
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? (
					<Button size="sm" variant="outline">
						<PlusIcon className="size-4" />
						Add Charge
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="p-4 rounded-2xl">
				<DialogTitle>Add Manual Charge</DialogTitle>
				<DialogDescription>
					Add a manual charge for <strong>{guestName}</strong>
				</DialogDescription>

				<Form {...form}>
					<form
						className="space-y-4"
						onSubmit={form.handleSubmit((data) => mutate(data))}
					>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											className="resize-none"
											placeholder="e.g. Room service, Laundry, Mini-bar"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="amount"
							render={({ field: { value, onChange, ...field } }) => (
								<FormItem>
									<FormLabel>Amount</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.01"
											min="0"
											placeholder="0.00"
											value={String(value ?? "")}
											onChange={(e) => onChange(e.target.valueAsNumber || 0)}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							className="w-full font-semibold"
							disabled={isPending}
						>
							{isPending ? (
								<>
									<Loader2Icon className="animate-spin" />
									<span>Adding charge...</span>
								</>
							) : (
								"Add Charge"
							)}
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
