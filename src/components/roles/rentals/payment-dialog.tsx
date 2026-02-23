"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordPayment } from "@/lib/rental-actions";
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
import { DollarSignIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

const paymentSchema = z.object({
	rentalOrderId: z.string().min(1, "Order ID is required"),
	amount: z.number().min(0.01, "Amount must be greater than 0"),
	type: z.enum([
		"DEPOSIT",
		"INSTALLMENT",
		"RENTAL_FEE",
		"FULL_PAYMENT",
		"FINAL",
		"DAMAGE_FEE",
		"LATE_PENALTY",
		"EXTENSION_FEE",
		"DEPOSIT_REFUND",
		"REFUND",
		"OTHER",
	]),
	method: z.enum([
		"CASH",
		"CARD",
		"CREDIT_CARD",
		"DEBIT_CARD",
		"BANK_TRANSFER",
		"MOBILE_MONEY",
		"CHEQUE",
		"ONLINE_PAYMENT",
		"PAYPAL",
		"CRYPTOCURRENCY",
		"DIRECT_DEBIT",
		"PETTY_CASH",
		"OTHERS",
	]),
	reference: z.string().optional(),
	currency: z.string().optional(),
	notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

type PaymentDialogProps = {
	trigger?: React.ReactNode;
	orderId?: string;
	onSuccess?: () => void;
};

export function PaymentDialog({
	trigger,
	orderId,
	onSuccess,
}: PaymentDialogProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const router = useRouter();

	const form = useForm<PaymentFormData>({
		resolver: zodResolver(paymentSchema),
		defaultValues: {
			rentalOrderId: orderId || "",
			amount: 0,
			type: "RENTAL_FEE",
			method: "CASH",
			reference: "",
			currency: "NGN",
			notes: "",
		},
	});

	const mutation = useMutation({
		mutationFn: async (data: PaymentFormData) => {
			const result = await recordPayment(data);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			toast.success("Payment recorded successfully");
			queryClient.invalidateQueries({ queryKey: ["rentals", "payments"] });
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
			toast.error(error.message || "Failed to record payment");
		},
	});

	const onSubmit = (data: PaymentFormData) => {
		mutation.mutate(data);
	};

	const paymentTypeLabels: Record<string, string> = {
		DEPOSIT: "Security Deposit",
		INSTALLMENT: "Installment",
		RENTAL_FEE: "Rental Fee",
		FULL_PAYMENT: "Full Payment",
		FINAL: "Final Payment",
		DAMAGE_FEE: "Damage Fee",
		LATE_PENALTY: "Late Penalty",
		EXTENSION_FEE: "Extension Fee",
		DEPOSIT_REFUND: "Deposit Refund",
		REFUND: "Refund",
		OTHER: "Other",
	};

	const paymentMethodLabels: Record<string, string> = {
		CASH: "Cash",
		CARD: "Card",
		CREDIT_CARD: "Credit Card",
		DEBIT_CARD: "Debit Card",
		BANK_TRANSFER: "Bank Transfer",
		MOBILE_MONEY: "Mobile Money",
		CHEQUE: "Cheque",
		ONLINE_PAYMENT: "Online Payment",
		PAYPAL: "PayPal",
		CRYPTOCURRENCY: "Cryptocurrency",
		DIRECT_DEBIT: "Direct Debit",
		PETTY_CASH: "Petty Cash",
		OTHERS: "Other",
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline">
						<DollarSignIcon className="w-4 h-4 mr-2" />
						Record Payment
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="text-2xl">Record Payment</DialogTitle>
					<DialogDescription>
						Record a payment for a rental order
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{!orderId && (
							<FormField
								control={form.control}
								name="rentalOrderId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Order ID *</FormLabel>
										<FormControl>
											<Input placeholder="Order ID" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<FormField
							control={form.control}
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Amount *</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="0"
											step="0.01"
											placeholder="0.00"
											{...field}
											onChange={(e) =>
												field.onChange(parseFloat(e.target.value))
											}
										/>
									</FormControl>
									<FormDescription>Enter amount in NGN</FormDescription>
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
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.entries(paymentTypeLabels).map(
												([value, label]) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="method"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Payment Method *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select method" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.entries(paymentMethodLabels).map(
												([value, label]) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="reference"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reference Number</FormLabel>
									<FormControl>
										<Input placeholder="Transaction reference" {...field} />
									</FormControl>
									<FormDescription>
										Card transaction or receipt number
									</FormDescription>
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
											placeholder="Additional notes..."
											className="min-h-[60px]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-3 pt-4">
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
								className="bg-gradient-to-r from-green-600 to-emerald-600"
							>
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
