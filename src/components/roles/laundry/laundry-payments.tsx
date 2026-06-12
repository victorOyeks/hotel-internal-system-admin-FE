"use client";

import { useState } from "react";
import { useQueryState, parseAsIndex } from "nuqs";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { SearchIcon, CreditCardIcon, DollarSignIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";
import { LaundryOrderDetailsDialog } from "./laundry-order-details-dialog";
import { DataTablePagination } from "@/components/shared/pagination";
import type { Pagination } from "@/lib/fetch";

type LaundryPayment = {
	id: string;
	laundryOrderId: string;
	orderNumber: string;
	customerName: string;
	roomIdentifier?: string;
	amount: number;
	currency?: string;
	method?: string;
	reference?: string;
	status?: string;
	type?: string;
	paymentDate?: string;
	notes?: string;
	processedBy?: string;
	createdAt?: string;
};

type LaundryPaymentStats = {
	totalBilled: number;
	totalRevenue: number;
	outstandingAmount: number;
};

type LaundryPaymentsPageProps = {
	payments: LaundryPayment[];
	paginationMeta: Pagination;
	stats: LaundryPaymentStats;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const methodColors: Record<string, string> = {
	CASH: "bg-green-100 text-green-800 border-green-200",
	CARD: "bg-blue-100 text-blue-800 border-blue-200",
	BANK_TRANSFER: "bg-purple-100 text-purple-800 border-purple-200",
	POS: "bg-sky-100 text-sky-800 border-sky-200",
	MOBILE_MONEY: "bg-orange-100 text-orange-800 border-orange-200",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

function formatDate(dt?: string) {
	if (!dt) return "—";
	return new Date(dt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function LaundryPaymentsPage({
	payments,
	paginationMeta,
	stats,
	breadcrumbs,
}: LaundryPaymentsPageProps) {
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useQueryState("page", parseAsIndex.withDefault(0));

	const filtered = payments.filter(
		(p) =>
			p.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
			p.customerName.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Laundry Payments
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Track payments across all laundry orders
					</p>
				</div>

				{/* Payment Summary */}
				<div className="grid grid-cols-3 gap-3">
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-blue-50 rounded-lg">
							<DollarSignIcon className="w-4 h-4 text-blue-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Total Billed</p>
							<p className="text-lg font-bold">{formatCurrency(stats.totalBilled)}</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-green-50 rounded-lg">
							<CheckCircle2Icon className="w-4 h-4 text-green-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Total Collected</p>
							<p className="text-lg font-bold text-green-600">
								{formatCurrency(stats.totalRevenue)}
							</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-orange-50 rounded-lg">
							<ClockIcon className="w-4 h-4 text-orange-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Outstanding</p>
							<p className="text-lg font-bold text-orange-600">
								{formatCurrency(stats.outstandingAmount)}
							</p>
						</div>
					</div>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">
								Payment Transactions ({paginationMeta.totalElements})
							</CardTitle>
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search by order or customer..."
									className="pl-10 w-72"
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
										<TableHead>Date</TableHead>
										<TableHead>Order</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Method</TableHead>
										<TableHead className="text-right">Amount</TableHead>
										<TableHead>Reference</TableHead>
										<TableHead>Processed By</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={7}
												className="text-center py-12 text-muted-foreground"
											>
												<CreditCardIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
												<p className="font-medium">No payment records found</p>
											</TableCell>
										</TableRow>
									) : (
										filtered.map((payment) => (
											<TableRow
												key={payment.id}
												className="hover:bg-muted/50 cursor-pointer"
												onClick={() => {
													setSelectedOrderId(payment.laundryOrderId);
													setIsDetailsOpen(true);
												}}
											>
												<TableCell className="text-sm text-muted-foreground whitespace-nowrap">
													{formatDate(payment.paymentDate ?? payment.createdAt)}
												</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span className="font-mono text-sm font-medium">
															{payment.orderNumber}
														</span>
														{payment.roomIdentifier && (
															<span className="text-xs text-muted-foreground">
																Room {payment.roomIdentifier}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell className="font-medium text-sm">
													{payment.customerName}
												</TableCell>
												<TableCell>
													{payment.method ? (
														<Badge
															className={`text-xs ${
																methodColors[payment.method] ??
																"bg-gray-100 text-gray-800"
															}`}
														>
															{payment.method.replace(/_/g, " ")}
														</Badge>
													) : (
														<span className="text-muted-foreground text-sm">—</span>
													)}
												</TableCell>
												<TableCell className="text-right font-semibold text-green-600">
													{formatCurrency(payment.amount)}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground font-mono">
													{payment.reference ?? "—"}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{payment.processedBy ?? "—"}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
						{paginationMeta.totalPages > 1 && (
							<div className="flex items-center justify-between pt-4 border-t mt-4">
								<span className="text-sm text-muted-foreground">
									Page {pageIndex + 1} of {paginationMeta.totalPages} ({paginationMeta.totalElements} total)
								</span>
								<DataTablePagination
									pageIndex={pageIndex}
									pageCount={paginationMeta.totalPages}
									canPreviousPage={!paginationMeta.first}
									canNextPage={!paginationMeta.last}
									previousPage={() => setPageIndex(pageIndex - 1)}
									nextPage={() => setPageIndex(pageIndex + 1)}
									setPageIndex={setPageIndex}
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<LaundryOrderDetailsDialog
				orderId={selectedOrderId}
				open={isDetailsOpen}
				onOpenChange={setIsDetailsOpen}
			/>
		</BreadCrumbWrapper>
	);
}
