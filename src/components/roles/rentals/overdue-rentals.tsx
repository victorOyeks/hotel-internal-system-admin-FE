"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { AlertCircleIcon, PhoneIcon } from "lucide-react";
import { ReturnDialog } from "./return-dialog";
import { PaymentDialog } from "./payment-dialog";
import type { Pagination } from "@/lib/fetch";

type OverdueOrder = {
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

type OverdueRentalsPageProps = {
	orders: OverdueOrder[];
	paginationMeta: Pagination;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

function getDaysOverdue(endTime: string): number {
	const end = new Date(endTime);
	const now = new Date();
	const diffMs = now.getTime() - end.getTime();
	return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function OverdueRentalsPage({
	orders,
	paginationMeta,
	breadcrumbs,
}: OverdueRentalsPageProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
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

	const overdueOrders = orders.filter((order) => {
		if (order.isOverdue) return true;
		return new Date(order.rentalEndTime).getTime() < Date.now();
	});

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-red-600">Overdue Rentals</h1>
						<p className="text-muted-foreground mt-1">
							{overdueOrders.length} rental
							{overdueOrders.length !== 1 ? "s" : ""} past due date
						</p>
					</div>
				</div>

				<Card className="border-t-4 border-t-red-500">
					<CardHeader>
						<div className="flex items-center gap-2">
							<AlertCircleIcon className="w-5 h-5 text-red-600" />
							<CardTitle className="text-lg text-red-600">
								Urgent: Overdue Items ({overdueOrders.length})
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{overdueOrders.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<AlertCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
								<p className="text-lg font-medium text-green-600">
									No overdue rentals
								</p>
								<p className="text-sm mt-1">All rentals are on track</p>
							</div>
						) : (
							<>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Order Number</TableHead>
											<TableHead>Customer</TableHead>
											<TableHead>Due Date</TableHead>
											<TableHead className="text-center">Days Overdue</TableHead>
											<TableHead className="text-right">Total Amount</TableHead>
											<TableHead className="text-right">Balance Due</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{overdueOrders.map((order) => {
											const daysOverdue = getDaysOverdue(order.rentalEndTime);
											return (
												<TableRow
													key={order.id}
													className="hover:bg-red-50/50"
												>
													<TableCell className="font-medium">
														{order.orderNumber}
													</TableCell>
													<TableCell>
														<div className="flex flex-col">
															<span className="font-medium text-sm">
																{order.customerName}
															</span>
															{order.customerPhone && (
																<span className="text-xs text-muted-foreground">
																	{order.customerPhone}
																</span>
															)}
														</div>
													</TableCell>
													<TableCell>
														<span className="text-sm text-red-600 font-medium">
															{new Date(
																order.rentalEndTime,
															).toLocaleDateString()}
														</span>
													</TableCell>
													<TableCell className="text-center">
														<Badge className="bg-red-100 text-red-800 border-red-200">
															{daysOverdue}{" "}
															{daysOverdue === 1 ? "day" : "days"}
														</Badge>
													</TableCell>
													<TableCell className="text-right font-semibold">
														{formatCurrency(order.totalAmount)}
													</TableCell>
													<TableCell className="text-right">
														<span className="text-red-600 font-semibold">
															{formatCurrency(order.balanceDue)}
														</span>
													</TableCell>
													<TableCell className="text-right">
														<div className="flex items-center justify-end gap-1">
															{order.customerPhone && (
																<Button
																	variant="outline"
																	size="sm"
																	className="border-red-300 text-red-700 hover:bg-red-50"
																	onClick={() =>
																		window.open(
																			`tel:${order.customerPhone}`,
																		)
																	}
																>
																	<PhoneIcon className="w-4 h-4 mr-1" />
																	Contact
																</Button>
															)}
															<ReturnDialog orderId={order.id} />
															{order.balanceDue > 0 && (
																<PaymentDialog orderId={order.id} />
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
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
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</BreadCrumbWrapper>
	);
}
