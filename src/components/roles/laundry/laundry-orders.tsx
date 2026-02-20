"use client";

import { useState } from "react";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { LaundryOrderDetailsDialog } from "./laundry-order-details-dialog";
import { LaundryOrderDialog } from "./laundry-order-dialog";
import { LaundryPaymentDialog } from "./laundry-payment-dialog";
import {
	SearchIcon,
	CreditCardIcon,
	AlertCircleIcon,
} from "lucide-react";
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

type LaundryOrdersPageProps = {
	orders: LaundryOrderSummary[];
	paginationMeta: Pagination;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const statusColors: Record<string, string> = {
	PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
	PICKED_UP: "bg-cyan-100 text-cyan-800 border-cyan-200",
	IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
	WASHING: "bg-sky-100 text-sky-800 border-sky-200",
	DRYING: "bg-indigo-100 text-indigo-800 border-indigo-200",
	IRONING: "bg-violet-100 text-violet-800 border-violet-200",
	QUALITY_CHECK: "bg-purple-100 text-purple-800 border-purple-200",
	READY: "bg-teal-100 text-teal-800 border-teal-200",
	OUT_FOR_DELIVERY: "bg-emerald-100 text-emerald-800 border-emerald-200",
	DELIVERED: "bg-green-100 text-green-800 border-green-200",
	CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
	ON_HOLD: "bg-orange-100 text-orange-800 border-orange-200",
};

const urgencyColors: Record<string, string> = {
	STANDARD: "bg-green-50 text-green-700 border-green-200",
	EXPRESS: "bg-amber-50 text-amber-700 border-amber-200",
	SAME_DAY: "bg-orange-50 text-orange-700 border-orange-200",
	URGENT: "bg-red-50 text-red-700 border-red-200",
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

export function LaundryOrdersPage({
	orders,
	paginationMeta,
	breadcrumbs,
}: LaundryOrdersPageProps) {
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [search, setSearch] = useState("");

	const filtered = orders.filter(
		(o) =>
			o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
			o.customerName.toLowerCase().includes(search.toLowerCase()) ||
			o.roomIdentifier?.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							Laundry Orders
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Manage all laundry orders and track their progress
						</p>
					</div>
					<LaundryOrderDialog />
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
									placeholder="Search by order, name or room..."
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
										<TableHead className="text-center">Items</TableHead>
										<TableHead>Urgency</TableHead>
										<TableHead className="text-right">Amount</TableHead>
										<TableHead className="text-right">Balance</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Payment</TableHead>
										<TableHead className="text-center">Actions</TableHead>
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
													: "No laundry orders found"}
											</TableCell>
										</TableRow>
									) : (
										filtered.map((order) => (
											<TableRow
												key={order.id}
												className={`hover:bg-muted/50 cursor-pointer ${order.hasIssues ? "bg-red-50/40" : ""}`}
												onClick={() => {
													setSelectedOrderId(order.id);
													setIsDetailsOpen(true);
												}}
											>
												<TableCell>
													<span className="font-mono text-sm font-medium">
														{order.orderNumber}
													</span>
													<p className="text-[10px] text-muted-foreground">
														{new Date(order.createdAt).toLocaleDateString(
															"en-NG",
															{
																day: "numeric",
																month: "short",
																hour: "2-digit",
																minute: "2-digit",
															},
														)}
													</p>
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
												<TableCell className="text-center">
													<Badge variant="outline" className="text-xs">
														{order.totalItemsCount}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														className={
															urgencyColors[order.urgency] ||
															"bg-gray-100 text-gray-800"
														}
													>
														{order.urgency}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<span className="font-semibold text-sm">
														{formatCurrency(order.totalAmount)}
													</span>
												</TableCell>
												<TableCell className="text-right">
													{order.balanceDue > 0 ? (
														<span className="text-sm text-orange-600 font-medium">
															{formatCurrency(order.balanceDue)}
														</span>
													) : (
														<span className="text-sm text-muted-foreground">
															—
														</span>
													)}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1.5">
														{order.hasIssues && (
															<AlertCircleIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
														)}
														<Badge
															className={
																statusColors[order.status] ||
																"bg-gray-100 text-gray-800"
															}
														>
															{order.status.replace(/_/g, " ")}
														</Badge>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={`text-xs ${
															paymentStatusColors[order.paymentStatus] ||
															"bg-gray-100 text-gray-800"
														}`}
													>
														{order.paymentStatus.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													<div
														className="flex items-center justify-center gap-1"
														onClick={(e) => e.stopPropagation()}
													>
														<TooltipProvider delayDuration={300}>
															<Tooltip>
																<TooltipTrigger asChild>
																	<div>
																		{order.balanceDue > 0 ? (
																			<LaundryPaymentDialog
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
																<TooltipContent>Record Payment</TooltipContent>
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
