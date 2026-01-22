"use client";

import { useState } from "react";
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
import { RentalOrderDetailsDialog } from "./rental-order-details-dialog";
import { EyeIcon } from "lucide-react";
import type { Pagination } from "@/lib/fetch";

type RentalOrder = {
	id: string;
	orderNumber: string;
	customerName: string;
	customerPhone: string;
	status: string;
	paymentStatus: string;
	totalAmount: number;
	rentalStartDate: string;
	rentalEndDate: string;
};

type RentalOrdersPageProps = {
	orders: RentalOrder[];
	paginationMeta: Pagination;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

export function RentalOrdersPage({
	orders,
	paginationMeta,
	breadcrumbs,
}: RentalOrdersPageProps) {
	const [selectedOrder, setSelectedOrder] = useState<RentalOrder | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	const statusColors: Record<string, string> = {
		PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
		RESERVED: "bg-purple-100 text-purple-800 border-purple-200",
		ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
		COMPLETED: "bg-green-100 text-green-800 border-green-200",
		OVERDUE: "bg-red-100 text-red-800 border-red-200",
		CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
	};

	const paymentStatusColors: Record<string, string> = {
		PAID: "bg-green-100 text-green-800 border-green-200",
		PARTIAL: "bg-orange-100 text-orange-800 border-orange-200",
		PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
		DEPOSIT_PAID: "bg-blue-100 text-blue-800 border-blue-200",
	};

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Rental Orders</h1>
						<p className="text-muted-foreground mt-1">
							Manage all rental orders and returns
						</p>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							All Orders ({orders.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Order Number</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Period</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Payment</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orders.map((order) => (
									<TableRow key={order.id} className="hover:bg-muted/50">
										<TableCell className="font-medium">
											{order.orderNumber}
										</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span className="font-medium text-sm">
													{order.customerName}
												</span>
												<span className="text-xs text-muted-foreground">
													{order.customerPhone}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex flex-col text-xs">
												<span>
													{new Date(order.rentalStartDate).toLocaleDateString()}
												</span>
												<span className="text-muted-foreground">
													to{" "}
													{new Date(order.rentalEndDate).toLocaleDateString()}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-right font-semibold">
											${order.totalAmount.toLocaleString()}
										</TableCell>
										<TableCell>
											<Badge
												className={
													statusColors[order.status] ||
													"bg-gray-100 text-gray-800"
												}
											>
												{order.status}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={paymentStatusColors[order.paymentStatus]}
											>
												{order.paymentStatus.replace(/_/g, " ")}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													setSelectedOrder(order);
													setIsDetailsOpen(true);
												}}
											>
												<EyeIcon className="w-4 h-4 mr-1" />
												View
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			<RentalOrderDetailsDialog
				order={selectedOrder}
				open={isDetailsOpen}
				onOpenChange={setIsDetailsOpen}
			/>
		</BreadCrumbWrapper>
	);
}
