"use client";

import { useState, useCallback } from "react";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
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
import {
	SearchIcon,
	CreditCardIcon,
	DollarSignIcon,
	CheckCircle2Icon,
	ClockIcon,
} from "lucide-react";
import type { APIOutput } from "@/lib/action-utils";
import type { Pagination } from "@/lib/fetch";
import { DataTablePagination } from "@/components/shared/pagination";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { type ExportData, ExportDialog } from "@/components/shared/shared-dialogs";
import { exportRestaurantPayments } from "@/lib/restaurant-actions";
import { toast } from "sonner";

type Payment =
	APIOutput<"@get/api/restaurants/payments">["data"]["content"][number];

type RestaurantPaymentsPageProps = {
	payments: Payment[];
	paginationMeta: Pagination;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const statusColors: Record<string, string> = {
	SUCCESS: "bg-green-100 text-green-800 border-green-200",
	FULLY_PAID: "bg-green-100 text-green-800 border-green-200",
	PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
	PARTLY_PAID: "bg-orange-100 text-orange-800 border-orange-200",
	FAILED: "bg-red-100 text-red-800 border-red-200",
	CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
	REFUNDED: "bg-violet-100 text-violet-800 border-violet-200",
};

const methodLabels: Record<string, string> = {
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

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function RestaurantPaymentsPage({
	payments,
	paginationMeta,
	breadcrumbs,
}: RestaurantPaymentsPageProps) {
	const [search, setSearch] = useState("");
	const [pagination, setPagination] = usePaginationSearchParams();
	const [exportDialogOpen, setExportDialogOpen] = useState(false);

	const filtered = payments.filter(
		(p) =>
			p.orderCustomId.toLowerCase().includes(search.toLowerCase()) ||
			(p.reference ?? "").toLowerCase().includes(search.toLowerCase()) ||
			(p.destination ?? "").toLowerCase().includes(search.toLowerCase()),
	);

	const totalBilled = payments.reduce((sum, p) => sum + p.orderTotal, 0);
	const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
	const totalOutstanding = payments.reduce(
		(sum, p) => sum + p.remainingBalance,
		0,
	);

	const pageIndex = pagination.pageIndex;
	const pageCount = paginationMeta.totalPages;

	const handleExport = useCallback(
		async (data: ExportData) => {
			try {
				const result = await exportRestaurantPayments({
					format: data.export_type.toUpperCase() as "CSV" | "PDF" | "EXCEL",
					search: search || undefined,
					startDate: data.from_date?.toISOString(),
					endDate: data.to_date?.toISOString(),
				});

				if (result.success && result.data) {
					const byteCharacters = atob(result.data.base64);
					const byteNumbers = new Array(byteCharacters.length);
					for (let i = 0; i < byteCharacters.length; i++) {
						byteNumbers[i] = byteCharacters.charCodeAt(i);
					}
					const byteArray = new Uint8Array(byteNumbers);
					const mimeType =
						data.export_type === "csv"
							? "text/csv"
							: data.export_type === "pdf"
								? "application/pdf"
								: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
					const blob = new Blob([byteArray], { type: mimeType });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = result.data.filename;
					document.body.appendChild(a);
					a.click();
					window.URL.revokeObjectURL(url);
					document.body.removeChild(a);
					setExportDialogOpen(false);
					toast.success("Payments exported successfully!");
				} else {
					toast.error(result.error || "Failed to export payments");
				}
			} catch {
				toast.error("An error occurred during export");
			}
		},
		[search],
	);

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							F&B Payments
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Track payments across all F&B orders
						</p>
					</div>
					<ExportDialog
						open={exportDialogOpen}
						setOpenAction={setExportDialogOpen}
						onSubmitAction={handleExport}
					/>
				</div>

				{/* Payment Summary */}
				<div className="grid grid-cols-3 gap-3">
					<div className="bg-white border rounded-xl p-3 flex items-center gap-3">
						<div className="p-2 bg-blue-50 rounded-lg">
							<DollarSignIcon className="w-4 h-4 text-blue-600" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Total Billed</p>
							<p className="text-lg font-bold">{formatCurrency(totalBilled)}</p>
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

				{/* Payments Table */}
				<div className="rounded-md border bg-card">
					<div className="flex items-center justify-between p-4 border-b">
						<h2 className="text-lg font-semibold">
							Payment Records ({paginationMeta.totalElements})
						</h2>
						<div className="relative">
							<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
							<Input
								placeholder="Search by order # or reference..."
								className="pl-10 w-72"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Order #</TableHead>
								<TableHead>Destination</TableHead>
								<TableHead className="text-right pr-5">Amount</TableHead>
								<TableHead className="pl-5">Method</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Balance</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="text-center py-12 text-muted-foreground"
									>
										<CreditCardIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
										<p className="font-medium">No payment records found</p>
									</TableCell>
								</TableRow>
							) : (
								filtered.map((payment) => (
									<TableRow key={payment.id}>
										<TableCell className="text-sm text-muted-foreground whitespace-nowrap">
											{new Date(payment.createdAt).toLocaleDateString(
												"en-US",
												{
													month: "short",
													day: "numeric",
													year: "numeric",
												},
											)}
										</TableCell>
										<TableCell>
											<span className="font-mono text-sm font-medium">
												{payment.orderCustomId}
											</span>
										</TableCell>
										<TableCell className="text-sm">
											{payment.destination || "—"}
										</TableCell>
										<TableCell className="text-right font-semibold tabular-nums pr-5">
											{formatCurrency(payment.amount)}
										</TableCell>
										<TableCell className="text-sm pl-5">
											{methodLabels[payment.method] || payment.method}
										</TableCell>
										<TableCell>
											<span className="text-xs text-muted-foreground uppercase">
												{(payment.type ?? "").replace(/_/g, " ")}
											</span>
										</TableCell>
										<TableCell>
											<Badge
												className={`text-xs ${
													statusColors[payment.status] ||
													"bg-gray-100 text-gray-800"
												}`}
											>
												{payment.status.replace(/_/g, " ")}
											</Badge>
										</TableCell>
										<TableCell className="tabular-nums">
											{payment.remainingBalance > 0 ? (
												<span className="text-orange-600 font-medium">
													{formatCurrency(payment.remainingBalance)}
												</span>
											) : (
												<span className="text-muted-foreground">—</span>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{paginationMeta.totalPages > 1 && (
					<DataTablePagination
						pageIndex={pageIndex}
						pageCount={pageCount}
						canPreviousPage={pageIndex > 0}
						canNextPage={pageIndex < pageCount - 1}
						previousPage={() =>
							setPagination((prev) => ({
								...prev,
								pageIndex: Math.max(0, prev.pageIndex - 1),
							}))
						}
						nextPage={() =>
							setPagination((prev) => ({
								...prev,
								pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
							}))
						}
						setPageIndex={(idx) =>
							setPagination((prev) => ({ ...prev, pageIndex: idx }))
						}
					/>
				)}
			</div>
		</BreadCrumbWrapper>
	);
}
