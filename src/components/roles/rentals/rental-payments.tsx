"use client";

import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DollarSignIcon } from "lucide-react";
import type { Pagination } from "@/lib/fetch";

type RentalPayment = {
	id: string;
	orderNumber: string;
	amount: number;
	paymentType: string;
	paymentMethod: string;
	paymentDate: string;
	customerName: string;
};

type RentalPaymentsPageProps = {
	payments: RentalPayment[];
	paginationMeta: Pagination;
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

export function RentalPaymentsPage({
	payments,
	paginationMeta,
	breadcrumbs,
}: RentalPaymentsPageProps) {
	const paymentTypeColors: Record<string, string> = {
		DEPOSIT: "bg-blue-100 text-blue-800 border-blue-200",
		RENTAL_FEE: "bg-green-100 text-green-800 border-green-200",
		DAMAGE_FEE: "bg-red-100 text-red-800 border-red-200",
		LATE_FEE: "bg-orange-100 text-orange-800 border-orange-200",
		REFUND: "bg-purple-100 text-purple-800 border-purple-200",
	};

	const paymentMethodColors: Record<string, string> = {
		CARD: "bg-slate-100 text-slate-800 border-slate-200",
		CASH: "bg-emerald-100 text-emerald-800 border-emerald-200",
		MOBILE_MONEY: "bg-violet-100 text-violet-800 border-violet-200",
		BANK_TRANSFER: "bg-cyan-100 text-cyan-800 border-cyan-200",
	};

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div>
					<h1 className="text-3xl font-bold">Payment History</h1>
					<p className="text-muted-foreground mt-1">
						View all rental payments and transactions
					</p>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<DollarSignIcon className="w-5 h-5 text-green-600" />
							<CardTitle className="text-lg">
								All Payments ({payments.length})
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date & Time</TableHead>
									<TableHead>Order Number</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Payment Type</TableHead>
									<TableHead>Method</TableHead>
									<TableHead className="text-right">Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments.map((payment) => (
									<TableRow key={payment.id} className="hover:bg-muted/50">
										<TableCell>
											<div className="flex flex-col text-xs">
												<span className="font-medium">
													{new Date(payment.paymentDate).toLocaleDateString()}
												</span>
												<span className="text-muted-foreground">
													{new Date(payment.paymentDate).toLocaleTimeString(
														[],
														{ hour: "2-digit", minute: "2-digit" },
													)}
												</span>
											</div>
										</TableCell>
										<TableCell className="font-medium">
											{payment.orderNumber}
										</TableCell>
										<TableCell>
											<span className="text-sm">{payment.customerName}</span>
										</TableCell>
										<TableCell>
											<Badge
												className={
													paymentTypeColors[payment.paymentType] ||
													"bg-gray-100 text-gray-800"
												}
											>
												{payment.paymentType.replace(/_/g, " ")}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={paymentMethodColors[payment.paymentMethod]}
											>
												{payment.paymentMethod.replace(/_/g, " ")}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-semibold text-green-600">
											${payment.amount.toLocaleString()}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</BreadCrumbWrapper>
	);
}
