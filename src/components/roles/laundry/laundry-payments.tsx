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

type LaundryOrderSummary = {
	id: string;
	orderNumber: string;
	customerName: string;
	roomIdentifier?: string;
	status: string;
	urgency: string;
	paymentStatus: string;
	totalItemsCount: number;
	totalAmount: number;
	amountPaid: number;
	balanceDue: number;
	expectedDeliveryTime?: string;
	createdAt: string;
	hasIssues: boolean;
};

type LaundryPaymentsPageProps = {
	orders: LaundryOrderSummary[];
	paginationMeta: Pagination;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const paymentStatusColors: Record<string, string> = {
	UNPAID: "bg-red-100 text-red-800 border-red-200",
	PARTIALLY_PAID: "bg-orange-100 text-orange-800 border-orange-200",
	PAID: "bg-green-100 text-green-800 border-green-200",
	CHARGED_TO_ROOM: "bg-sky-100 text-sky-800 border-sky-200",
	COMPLIMENTARY: "bg-purple-100 text-purple-800 border-purple-200",
	REFUNDED: "bg-violet-100 text-violet-800 border-violet-200",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function LaundryPaymentsPage({
	orders,
	paginationMeta,
	breadcrumbs,
}: LaundryPaymentsPageProps) {
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useQueryState("page", parseAsIndex.withDefault(0));

	const filtered = orders.filter(
		(o) =>
			o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
			o.customerName.toLowerCase().includes(search.toLowerCase()),
	);

	const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
	const totalPaid = orders.reduce((sum, o) => sum + o.amountPaid, 0);
	const totalOutstanding = orders.reduce((sum, o) => sum + o.balanceDue, 0);

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
							<p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
						</div>
					</div>
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-green-50 rounded-lg">
							<CheckCircle2Icon className="w-4 h-4 text-green-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Total Paid</p>
							<p className="text-lg font-bold text-green-600">
								{formatCurrency(totalPaid)}
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
								{formatCurrency(totalOutstanding)}
							</p>
						</div>
					</div>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">
								Order Payments ({paginationMeta.totalElements})
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
										<TableHead>Order</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead className="text-right">Total</TableHead>
										<TableHead className="text-right">Paid</TableHead>
										<TableHead className="text-right">Balance</TableHead>
										<TableHead>Payment Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-center py-12 text-muted-foreground"
											>
												<CreditCardIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
												<p className="font-medium">No payment records found</p>
											</TableCell>
										</TableRow>
									) : (
										filtered.map((order) => (
											<TableRow
												key={order.id}
												className="hover:bg-muted/50 cursor-pointer"
												onClick={() => {
													setSelectedOrderId(order.id);
													setIsDetailsOpen(true);
												}}
											>
												<TableCell>
													<span className="font-mono text-sm font-medium">
														{order.orderNumber}
													</span>
												</TableCell>
												<TableCell>
													<div className="flex flex-col">
														<span className="font-medium text-sm">
															{order.customerName}
														</span>
														{order.roomIdentifier && (
															<span className="text-xs text-muted-foreground">
																Room {order.roomIdentifier}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell className="text-right font-semibold">
													{formatCurrency(order.totalAmount)}
												</TableCell>
												<TableCell className="text-right text-green-600 font-medium">
													{formatCurrency(order.amountPaid)}
												</TableCell>
												<TableCell className="text-right">
													{order.balanceDue > 0 ? (
														<span className="text-orange-600 font-medium">
															{formatCurrency(order.balanceDue)}
														</span>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</TableCell>
												<TableCell>
													<Badge
														className={`text-xs ${
															paymentStatusColors[order.paymentStatus] ||
															"bg-gray-100 text-gray-800"
														}`}
													>
														{order.paymentStatus.replace(/_/g, " ")}
													</Badge>
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
