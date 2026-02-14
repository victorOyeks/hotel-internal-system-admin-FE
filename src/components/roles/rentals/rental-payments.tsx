"use client";

import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DollarSignIcon, SearchIcon, DownloadIcon, Loader2Icon } from "lucide-react";
import type { Pagination } from "@/lib/fetch";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { $fetch } from "@/lib/fetch";
import { toast } from "sonner";

type RentalPayment = {
	id: string;
	orderId: string;
	orderNumber: string;
	customerName: string;
	customerPhone: string;
	amount: number;
	currency: string;
	method: string;
	reference: string;
	status: string;
	type: string;
	paymentDate: string;
	createdAt: string;
	notes: string;
	processedBy: string;
	orderTotal: number;
	totalPaid: number;
	remainingBalance: number;
};

type RentalPaymentsPageProps = {
	payments: RentalPayment[];
	paginationMeta: Pagination;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const paymentTypeColors: Record<string, string> = {
	DEPOSIT: "bg-blue-100 text-blue-800 border-blue-200",
	INSTALLMENT: "bg-indigo-100 text-indigo-800 border-indigo-200",
	RENTAL_FEE: "bg-green-100 text-green-800 border-green-200",
	FULL_PAYMENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
	FINAL: "bg-teal-100 text-teal-800 border-teal-200",
	DAMAGE_FEE: "bg-red-100 text-red-800 border-red-200",
	LATE_PENALTY: "bg-orange-100 text-orange-800 border-orange-200",
	EXTENSION_FEE: "bg-amber-100 text-amber-800 border-amber-200",
	DEPOSIT_REFUND: "bg-purple-100 text-purple-800 border-purple-200",
	REFUND: "bg-violet-100 text-violet-800 border-violet-200",
	OTHER: "bg-gray-100 text-gray-800 border-gray-200",
};

const paymentMethodLabels: Record<string, string> = {
	CASH: "Cash",
	CARD: "Card",
	CREDIT_CARD: "Credit Card",
	DEBIT_CARD: "Debit Card",
	BANK_TRANSFER: "Bank Transfer",
	MOBILE_MONEY: "Mobile Money",
	CHEQUE: "Cheque",
	ONLINE_PAYMENT: "Online",
	PAYPAL: "PayPal",
	CRYPTOCURRENCY: "Crypto",
	DIRECT_DEBIT: "Direct Debit",
	PETTY_CASH: "Petty Cash",
	OTHERS: "Other",
};

const statusColors: Record<string, string> = {
	SUCCESS: "bg-green-100 text-green-800 border-green-200",
	PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
	FAILED: "bg-red-100 text-red-800 border-red-200",
	CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
	REFUNDED: "bg-purple-100 text-purple-800 border-purple-200",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function RentalPaymentsPage({
	payments,
	paginationMeta,
	breadcrumbs,
}: RentalPaymentsPageProps) {
	const [search, setSearch] = useState("");

	const exportMutation = useMutation({
		mutationFn: async () => {
			const response = await $fetch(
				"@get/api/hotels/rentals/payments/history/export",
				{
					throw: true,
				},
			);
			return response.data;
		},
		onSuccess: (data: any[]) => {
			const headers = [
				"Date",
				"Order #",
				"Customer",
				"Phone",
				"Type",
				"Method",
				"Status",
				"Amount",
				"Order Total",
				"Total Paid",
				"Remaining",
			];
			const rows = data.map((p: any) => [
				new Date(p.paymentDate).toLocaleDateString(),
				p.orderNumber,
				p.customerName,
				p.customerPhone,
				p.type,
				p.method,
				p.status,
				p.amount,
				p.orderTotal,
				p.totalPaid,
				p.remainingBalance,
			]);
			const csv = [headers, ...rows]
				.map((row) =>
					row
						.map((cell: any) =>
							typeof cell === "string" && cell.includes(",")
								? `"${cell}"`
								: cell,
						)
						.join(","),
				)
				.join("\n");
			const blob = new Blob([csv], { type: "text/csv" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `rental-payments-${new Date().toISOString().split("T")[0]}.csv`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success("Payment history exported");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to export payments");
		},
	});

	const filtered = payments.filter(
		(p) =>
			p.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
			p.customerName.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Payment History</h1>
						<p className="text-muted-foreground mt-1">
							View all rental payments and transactions
						</p>
					</div>
					<Button
						variant="outline"
						onClick={() => exportMutation.mutate()}
						disabled={exportMutation.isPending}
					>
						{exportMutation.isPending ? (
							<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<DownloadIcon className="w-4 h-4 mr-2" />
						)}
						Export CSV
					</Button>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<DollarSignIcon className="w-5 h-5 text-green-600" />
								<CardTitle className="text-lg">
									All Payments ({paginationMeta.totalElements})
								</CardTitle>
							</div>
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search by order or customer..."
									className="pl-10 w-64"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date & Time</TableHead>
										<TableHead>Order</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Method</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Amount</TableHead>
										<TableHead className="text-right">Balance</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={8}
												className="text-center py-8 text-muted-foreground"
											>
												No payments found
											</TableCell>
										</TableRow>
									) : (
										filtered.map((payment) => (
											<TableRow
												key={payment.id}
												className="hover:bg-muted/50"
											>
												<TableCell>
													<div className="flex flex-col text-xs">
														<span className="font-medium">
															{new Date(
																payment.paymentDate,
															).toLocaleDateString()}
														</span>
														<span className="text-muted-foreground">
															{new Date(
																payment.paymentDate,
															).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})}
														</span>
													</div>
												</TableCell>
												<TableCell className="font-medium">
													{payment.orderNumber}
												</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span className="text-sm">
															{payment.customerName}
														</span>
														{payment.customerPhone && (
															<span className="text-xs text-muted-foreground">
																{payment.customerPhone}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell>
													<Badge
														className={
															paymentTypeColors[payment.type] ||
															"bg-gray-100 text-gray-800"
														}
													>
														{payment.type.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{paymentMethodLabels[payment.method] ||
															payment.method.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														className={
															statusColors[payment.status] ||
															"bg-gray-100 text-gray-800"
														}
													>
														{payment.status}
													</Badge>
												</TableCell>
												<TableCell className="text-right font-semibold text-green-600">
													{formatCurrency(payment.amount)}
												</TableCell>
												<TableCell className="text-right">
													{payment.remainingBalance > 0 ? (
														<span className="text-orange-600 font-medium text-sm">
															{formatCurrency(payment.remainingBalance)}
														</span>
													) : (
														<span className="text-green-600 text-sm">
															Settled
														</span>
													)}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</BreadCrumbWrapper>
	);
}
