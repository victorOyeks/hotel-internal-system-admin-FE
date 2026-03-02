"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordLaundryPayment } from "@/lib/laundry-actions";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, CreditCardIcon } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS = [
	{ value: "CASH", label: "Cash" },
	{ value: "CARD", label: "Card" },
	{ value: "MOBILE_MONEY", label: "Mobile Money" },
	{ value: "BANK_TRANSFER", label: "Bank Transfer" },
	{ value: "WALLET", label: "Wallet" },
] as const;

const PAYMENT_TYPES = [
	{ value: "FULL_PAYMENT", label: "Full Payment" },
	{ value: "DEPOSIT", label: "Deposit" },
	{ value: "INSTALLMENT", label: "Installment" },
	{ value: "FINAL", label: "Final Payment" },
	{ value: "OTHER", label: "Other" },
] as const;

const paymentSchema = z.object({
	amount: z.coerce.number().positive("Amount must be greater than 0"),
	method: z.string().min(1, "Payment method is required"),
	type: z.string().min(1, "Payment type is required"),
	reference: z.string().optional(),
	notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

type LaundryPaymentDialogProps = {
	orderId: string;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export function LaundryPaymentDialog({
	orderId,
	trigger,
	onSuccess,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
}: LaundryPaymentDialogProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;
	const setOpen = controlledOnOpenChange ?? setInternalOpen;
	const queryClient = useQueryClient();

	const form = useForm<PaymentFormData>({
		resolver: zodResolver(paymentSchema),
		defaultValues: {
			amount: undefined,
			method: "CASH",
			type: "FULL_PAYMENT",
			reference: "",
			notes: "",
		},
	});

	const mutation = useMutation({
		mutationFn: async (data: PaymentFormData) => {
			const payload = {
				laundryOrderId: orderId,
				amount: data.amount,
				currency: "NGN",
				method: data.method,
				type: data.type,
				reference: data.reference || undefined,
				notes: data.notes || undefined,
			};
			const result = await recordLaundryPayment(payload);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success("Payment recorded successfully");
			queryClient.invalidateQueries({ queryKey: ["laundry", "orders"] });
			queryClient.invalidateQueries({
				queryKey: ["laundry", "dashboard-stats"],
			});
			setOpen(false);
			form.reset();
			onSuccess?.();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to record payment");
		},
	});

	const isControlled = controlledOpen !== undefined;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{!isControlled && (
				<DialogTrigger asChild>
					{trigger || (
						<Button variant="outline" size="sm">
							<CreditCardIcon className="w-4 h-4 mr-2" />
							Record Payment
						</Button>
					)}
				</DialogTrigger>
			)}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Record Payment</DialogTitle>
					<DialogDescription>
						Record a payment for this laundry order
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Amount (NGN) *</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.01"
											min="0"
											placeholder="0.00"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="method"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Payment Method *</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select method" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{PAYMENT_METHODS.map((m) => (
													<SelectItem key={m.value} value={m.value}>
														{m.label}
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
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Payment Type *</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{PAYMENT_TYPES.map((t) => (
													<SelectItem key={t.value} value={t.value}>
														{t.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="reference"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Transaction Reference</FormLabel>
									<FormControl>
										<Input placeholder="e.g. TXN20250215001" {...field} />
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
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Payment notes..."
											className="min-h-[60px]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Separator />

						<div className="flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending && (
									<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
								)}
								Record Payment
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
