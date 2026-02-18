"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { RentalOrderDetailsDialog } from "./rental-order-details-dialog";
import { RentalOrderDialog } from "./rental-order-dialog";
import { PaymentDialog } from "./payment-dialog";
import { ExtensionDialog } from "./extension-dialog";
import { ReturnDialog } from "./return-dialog";
import {
	SearchIcon,
	ClockIcon,
	CreditCardIcon,
	PackageCheckIcon,
	AlertCircleIcon,
} from "lucide-react";
import type { Pagination } from "@/lib/fetch";

type RentalOrder = {
	id: string;
	orderNumber: string;
	customerName: string;
	customerPhone?: string;
	status: string;
	paymentStatus: string;
	totalItemsCount: number;
	totalAmount: number;
	amountPaid: number;
	balanceDue: number;
	depositPaid: number;
	rentalStartTime: string;
	rentalEndTime: string;
	isOverdue: boolean;
	createdAt: string;
	hasIssues: boolean;
};

type RentalOrdersPageProps = {
	orders: RentalOrder[];
	paginationMeta: Pagination;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const statusColors: Record<string, string> = {
	PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
	CONFIRMED: "bg-indigo-100 text-indigo-800 border-indigo-200",
	PICKED_UP: "bg-cyan-100 text-cyan-800 border-cyan-200",
	ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
	OVERDUE: "bg-red-100 text-red-800 border-red-200",
	RETURNED: "bg-teal-100 text-teal-800 border-teal-200",
	COMPLETED: "bg-green-100 text-green-800 border-green-200",
	CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
	LOST: "bg-red-200 text-red-900 border-red-300",
	DAMAGED: "bg-orange-100 text-orange-800 border-orange-200",
};

const paymentStatusColors: Record<string, string> = {
	UNPAID: "bg-red-100 text-red-800 border-red-200",
	DEPOSIT_PARTIALLY_PAID: "bg-amber-100 text-amber-800 border-amber-200",
	DEPOSIT_PAID: "bg-blue-100 text-blue-800 border-blue-200",
	PARTIALLY_PAID: "bg-orange-100 text-orange-800 border-orange-200",
	PAID: "bg-green-100 text-green-800 border-green-200",
	PARTIALLY_REFUNDED: "bg-purple-100 text-purple-800 border-purple-200",
	FULLY_REFUNDED: "bg-violet-100 text-violet-800 border-violet-200",
	CHARGED_TO_ROOM: "bg-sky-100 text-sky-800 border-sky-200",
	PENDING_DAMAGE_ASSESSMENT:
		"bg-yellow-100 text-yellow-800 border-yellow-200",
	OVERDUE_CHARGES_PENDING: "bg-red-100 text-red-800 border-red-200",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function RentalOrdersPage({
	orders,
	paginationMeta,
	breadcrumbs,
}: RentalOrdersPageProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const currentPage = Math.max(
		1,
		Number(searchParams.get("page") || paginationMeta.pageNumber + 1 || 1),
	);
	const currentSize = Math.max(1, Number(searchParams.get("size") || 20));
	const totalPages = Math.max(1, paginationMeta.totalPages || 1);

	const goToPage = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", String(page));
		params.set("size", String(currentSize));
		router.push(`${pathname}?${params.toString()}`);
	};

	const filtered = orders.filter(
		(o) =>
			o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
			o.customerName.toLowerCase().includes(search.toLowerCase()) ||
			o.customerPhone?.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							Rental Orders
						</h1>
						<p className="text-muted-foreground mt-1">
							Manage all rental orders and returns
						</p>
					</div>
					<RentalOrderDialog />
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg">
								All Orders ({paginationMeta.totalElements})
							</CardTitle>
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search by order, name or phone..."
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
										<TableHead>Order Number</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead className="text-center">
											Items
										</TableHead>
										<TableHead>Period</TableHead>
										<TableHead className="text-right">
											Amount
										</TableHead>
										<TableHead className="text-right">
											Balance Due
										</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Payment</TableHead>
										<TableHead className="text-center">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={9}
												className="text-center py-12 text-muted-foreground"
											>
												{search
													? "No orders match your search"
													: "No rental orders found"}
											</TableCell>
										</TableRow>
									) : (
										filtered.map((order) => (
											<TableRow
												key={order.id}
												className={`hover:bg-muted/50 cursor-pointer ${order.isOverdue ? "bg-red-50/40" : ""}`}
												onClick={() => {
													setSelectedOrderId(
														order.id,
													);
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
														{order.customerPhone && (
															<span className="text-xs text-muted-foreground">
																{
																	order.customerPhone
																}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell className="text-center">
													<Badge
														variant="outline"
														className="text-xs"
													>
														{order.totalItemsCount}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex flex-col text-xs">
														<span>
															{new Date(
																order.rentalStartTime,
															).toLocaleDateString(
																"en-NG",
																{
																	day: "numeric",
																	month: "short",
																},
															)}
														</span>
														<span className="text-muted-foreground">
															to{" "}
															{new Date(
																order.rentalEndTime,
															).toLocaleDateString(
																"en-NG",
																{
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																},
															)}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<span className="font-semibold text-sm">
														{formatCurrency(
															order.totalAmount,
														)}
													</span>
												</TableCell>
												<TableCell className="text-right">
													{order.balanceDue > 0 ? (
														<span className="text-sm text-orange-600 font-medium">
															{formatCurrency(
																order.balanceDue,
															)}
														</span>
													) : (
														<span className="text-sm text-muted-foreground">
															—
														</span>
													)}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1.5">
														{order.isOverdue && (
															<AlertCircleIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
														)}
														<Badge
															className={
																statusColors[
																	order.status
																] ||
																"bg-gray-100 text-gray-800"
															}
														>
															{order.status.replace(
																/_/g,
																" ",
															)}
														</Badge>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={`text-xs ${
															paymentStatusColors[
																order
																	.paymentStatus
															] ||
															"bg-gray-100 text-gray-800"
														}`}
													>
														{order.paymentStatus.replace(
															/_/g,
															" ",
														)}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													{/* biome-ignore lint/a11y/noStaticElementInteractions: container blocks row click when action buttons are used */}
													{/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard interaction is handled by inner action buttons */}
													<div
														className="flex items-center justify-center gap-1"
														onClick={(e) =>
															e.stopPropagation()
														}
													>
														<TooltipProvider
															delayDuration={300}
														>
															{/* Extend Rental */}
															<Tooltip>
																<TooltipTrigger asChild>
																	<div>
																		{order.status === "ACTIVE" || order.status === "PICKED_UP" ? (
																			<ExtensionDialog
																				orderId={order.id}
																				currentReturnDate={new Date(order.rentalEndTime)}
																				trigger={
																					<Button
																						variant="ghost"
																						size="icon"
																						className="h-8 w-8 text-muted-foreground hover:text-blue-600"
																					>
																						<ClockIcon className="w-4 h-4" />
																					</Button>
																				}
																			/>
																		) : (
																			<Button
																				variant="ghost"
																				size="icon"
																				className="h-8 w-8 text-muted-foreground/25"
																				disabled
																			>
																				<ClockIcon className="w-4 h-4" />
																			</Button>
																		)}
																	</div>
																</TooltipTrigger>
																<TooltipContent>
																	Extend Rental
																</TooltipContent>
															</Tooltip>

															{/* Process Return */}
															<Tooltip>
																<TooltipTrigger asChild>
																	<div>
																		{order.status === "ACTIVE" || order.status === "PICKED_UP" || order.status === "OVERDUE" ? (
																			<ReturnDialog
																				orderId={order.id}
																				trigger={
																					<Button
																						variant="ghost"
																						size="icon"
																						className="h-8 w-8 text-muted-foreground hover:text-green-600"
																					>
																						<PackageCheckIcon className="w-4 h-4" />
																					</Button>
																				}
																			/>
																		) : (
																			<Button
																				variant="ghost"
																				size="icon"
																				className="h-8 w-8 text-muted-foreground/25"
																				disabled
																			>
																				<PackageCheckIcon className="w-4 h-4" />
																			</Button>
																		)}
																	</div>
																</TooltipTrigger>
																<TooltipContent>
																	Process Return
																</TooltipContent>
															</Tooltip>

															{/* Record Payment */}
															<Tooltip>
																<TooltipTrigger asChild>
																	<div>
																		{order.balanceDue > 0 ? (
																			<PaymentDialog
																				orderId={order.id}
																				trigger={
																					<Button
																						variant="ghost"
																						size="icon"
																						className="h-8 w-8 text-muted-foreground hover:text-purple-600"
																					>
																						<CreditCardIcon className="w-4 h-4" />
																					</Button>
																				}
																			/>
																		) : (
																			<Button
																				variant="ghost"
																				size="icon"
																				className="h-8 w-8 text-muted-foreground/25"
																				disabled
																			>
																				<CreditCardIcon className="w-4 h-4" />
																			</Button>
																		)}
																	</div>
																</TooltipTrigger>
																<TooltipContent>
																	Record Payment
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
						{paginationMeta.totalElements > 20 && (
							<div className="flex items-center justify-between border-t pt-4 mt-4">
								<p className="text-xs text-muted-foreground">
									Page {currentPage} of {totalPages}
								</p>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => goToPage(Math.max(1, currentPage - 1))}
										disabled={currentPage <= 1}
									>
										Previous
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											goToPage(Math.min(totalPages, currentPage + 1))
										}
										disabled={currentPage >= totalPages}
									>
										Next
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<RentalOrderDetailsDialog
				orderId={selectedOrderId}
				open={isDetailsOpen}
				onOpenChange={setIsDetailsOpen}
			/>
		</BreadCrumbWrapper>
	);
}
