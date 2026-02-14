"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomerHistory, getCustomerOutstanding } from "@/lib/rental-actions";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
	UsersIcon,
	SearchIcon,
	PhoneIcon,
	MailIcon,
	CalendarIcon,
	ClipboardListIcon,
	Loader2Icon,
} from "lucide-react";
type CustomerLog = {
	customerName: string;
	customerPhone: string;
	customerEmail: string;
	totalRentals: number;
	activeRentals: number;
	completedRentals: number;
	totalSpent: number;
	outstandingBalance: number;
	lastRentalOrderNumber: string;
	lastRentalDate: string;
	firstRentalDate: string;
};

type RentalCustomersPageProps = {
	customers: CustomerLog[];
	breadcrumbs: {
		title: string;
		breadcrumbs: Array<{ label: string; href: string }>;
	};
};

const statusColors: Record<string, string> = {
	PENDING: "bg-yellow-100 text-yellow-800",
	CONFIRMED: "bg-indigo-100 text-indigo-800",
	PICKED_UP: "bg-cyan-100 text-cyan-800",
	ACTIVE: "bg-blue-100 text-blue-800",
	OVERDUE: "bg-red-100 text-red-800",
	RETURNED: "bg-teal-100 text-teal-800",
	COMPLETED: "bg-green-100 text-green-800",
	CANCELLED: "bg-gray-100 text-gray-800",
	LOST: "bg-red-200 text-red-900",
	DAMAGED: "bg-orange-100 text-orange-800",
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function RentalCustomersPage({
	customers,
	breadcrumbs,
}: RentalCustomersPageProps) {
	const [search, setSearch] = useState("");
	const [selectedCustomer, setSelectedCustomer] =
		useState<CustomerLog | null>(null);
	const [historyOpen, setHistoryOpen] = useState(false);

	const filtered = customers.filter(
		(c) =>
			c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
			c.customerPhone?.toLowerCase().includes(search.toLowerCase()) ||
			c.customerEmail?.toLowerCase().includes(search.toLowerCase()),
	);

	const totalActive = customers.reduce((sum, c) => sum + c.activeRentals, 0);
	const totalOutstanding = customers.reduce(
		(sum, c) => sum + c.outstandingBalance,
		0,
	);

	return (
		<BreadCrumbWrapper breadcrumbs={breadcrumbs}>
			<div className="flex flex-col gap-6 p-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Customer History
					</h1>
					<p className="text-muted-foreground mt-1">
						View customer rental activity and outstanding balances
					</p>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardContent className="pt-6">
							<p className="text-sm text-muted-foreground">
								Total Customers
							</p>
							<p className="text-2xl font-bold mt-1">
								{customers.length}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<p className="text-sm text-muted-foreground">
								Active Rentals
							</p>
							<p className="text-2xl font-bold text-blue-600 mt-1">
								{totalActive}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<p className="text-sm text-muted-foreground">
								With Outstanding Balance
							</p>
							<p className="text-2xl font-bold text-orange-600 mt-1">
								{customers.filter((c) => c.outstandingBalance > 0).length}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<p className="text-sm text-muted-foreground">
								Total Outstanding
							</p>
							<p className="text-2xl font-bold text-red-600 mt-1">
								{formatCurrency(totalOutstanding)}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Customer Table */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<UsersIcon className="w-5 h-5 text-blue-600" />
								<CardTitle className="text-lg">
									All Customers
								</CardTitle>
							</div>
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search by name, phone, or email..."
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
										<TableHead>Customer</TableHead>
										<TableHead>Contact</TableHead>
										<TableHead className="text-center">
											Total Rentals
										</TableHead>
										<TableHead className="text-center">
											Active
										</TableHead>
										<TableHead className="text-right">
											Total Spent
										</TableHead>
										<TableHead className="text-right">
											Outstanding
										</TableHead>
										<TableHead>Last Rental</TableHead>
										<TableHead></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={8}
												className="text-center py-8 text-muted-foreground"
											>
												No customers found
											</TableCell>
										</TableRow>
									) : (
										filtered.map((customer, index) => (
											<TableRow
												key={`${customer.customerPhone}-${index}`}
												className="hover:bg-muted/50"
											>
												<TableCell className="font-medium">
													{customer.customerName}
												</TableCell>
												<TableCell>
													<div className="flex flex-col text-sm">
														{customer.customerPhone && (
															<span className="flex items-center gap-1 text-muted-foreground">
																<PhoneIcon className="w-3 h-3" />
																{customer.customerPhone}
															</span>
														)}
														{customer.customerEmail && (
															<span className="flex items-center gap-1 text-muted-foreground">
																<MailIcon className="w-3 h-3" />
																{customer.customerEmail}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell className="text-center font-medium">
													{customer.totalRentals}
												</TableCell>
												<TableCell className="text-center">
													{customer.activeRentals > 0 ? (
														<Badge className="bg-blue-100 text-blue-800">
															{customer.activeRentals}
														</Badge>
													) : (
														<span className="text-muted-foreground">
															0
														</span>
													)}
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(customer.totalSpent)}
												</TableCell>
												<TableCell className="text-right">
													{customer.outstandingBalance > 0 ? (
														<span className="font-medium text-orange-600">
															{formatCurrency(
																customer.outstandingBalance,
															)}
														</span>
													) : (
														<span className="text-green-600 text-sm">
															Settled
														</span>
													)}
												</TableCell>
												<TableCell>
													{customer.lastRentalDate ? (
														<div className="flex flex-col text-xs">
															<span>
																{new Date(
																	customer.lastRentalDate,
																).toLocaleDateString()}
															</span>
															{customer.lastRentalOrderNumber && (
																<span className="text-muted-foreground">
																	{customer.lastRentalOrderNumber}
																</span>
															)}
														</div>
													) : (
														"-"
													)}
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setSelectedCustomer(customer);
															setHistoryOpen(true);
														}}
													>
														View History
													</Button>
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

			{/* Customer History Dialog */}
			<CustomerHistoryDialog
				customer={selectedCustomer}
				open={historyOpen}
				onOpenChange={setHistoryOpen}
			/>
		</BreadCrumbWrapper>
	);
}

type CustomerHistoryDialogProps = {
	customer: CustomerLog | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function CustomerHistoryDialog({
	customer,
	open,
	onOpenChange,
}: CustomerHistoryDialogProps) {
	const { data: orders, isLoading } = useQuery({
		queryKey: [
			"rentals",
			"customers",
			"history",
			customer?.customerPhone,
		],
		queryFn: async () => {
			const response = await $fetch(
				"@get/api/hotels/rentals/customers/history",
				{
					query: { phone: customer!.customerPhone },
					throw: true,
				},
			);
			return response.data;
		},
		enabled: !!customer?.customerPhone && open,
	});

	const { data: outstanding } = useQuery({
		queryKey: [
			"rentals",
			"customers",
			"outstanding",
			customer?.customerPhone,
		],
		queryFn: async () => {
			const response = await $fetch(
				"@get/api/hotels/rentals/customers/outstanding",
				{
					query: { phone: customer!.customerPhone },
					throw: true,
				},
			);
			return response.data;
		},
		enabled: !!customer?.customerPhone && open,
	});

	if (!customer) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-bold">
						{customer.customerName}
					</DialogTitle>
					<DialogDescription>
						Rental history and outstanding orders
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{/* Contact Info */}
					<div className="flex gap-6 text-sm">
						{customer.customerPhone && (
							<span className="flex items-center gap-1.5 text-muted-foreground">
								<PhoneIcon className="w-4 h-4" />
								{customer.customerPhone}
							</span>
						)}
						{customer.customerEmail && (
							<span className="flex items-center gap-1.5 text-muted-foreground">
								<MailIcon className="w-4 h-4" />
								{customer.customerEmail}
							</span>
						)}
						{customer.firstRentalDate && (
							<span className="flex items-center gap-1.5 text-muted-foreground">
								<CalendarIcon className="w-4 h-4" />
								Customer since{" "}
								{new Date(
									customer.firstRentalDate,
								).toLocaleDateString()}
							</span>
						)}
					</div>

					{/* Stats */}
					<div className="grid grid-cols-4 gap-3">
						<div className="bg-muted/50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold">
								{customer.totalRentals}
							</p>
							<p className="text-xs text-muted-foreground">
								Total Rentals
							</p>
						</div>
						<div className="bg-blue-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-blue-600">
								{customer.activeRentals}
							</p>
							<p className="text-xs text-muted-foreground">
								Active
							</p>
						</div>
						<div className="bg-green-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-green-600">
								{formatCurrency(customer.totalSpent)}
							</p>
							<p className="text-xs text-muted-foreground">
								Total Spent
							</p>
						</div>
						<div className="bg-orange-50 rounded-lg p-3 text-center">
							<p className="text-2xl font-bold text-orange-600">
								{formatCurrency(customer.outstandingBalance)}
							</p>
							<p className="text-xs text-muted-foreground">
								Outstanding
							</p>
						</div>
					</div>

					<Separator />

					{/* Outstanding Orders */}
					{outstanding && outstanding.length > 0 && (
						<div>
							<h3 className="font-semibold mb-2 text-orange-700">
								Outstanding Orders ({outstanding.length})
							</h3>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Order #</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">
											Balance Due
										</TableHead>
										<TableHead>Rental Period</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{outstanding.map((order: any) => (
										<TableRow key={order.id}>
											<TableCell className="font-medium">
												{order.orderNumber}
											</TableCell>
											<TableCell>
												<Badge
													className={
														statusColors[order.status] ||
														"bg-gray-100 text-gray-800"
													}
												>
													{order.status?.replace(/_/g, " ")}
												</Badge>
											</TableCell>
											<TableCell className="text-right font-medium text-orange-600">
												{formatCurrency(order.balanceDue || 0)}
											</TableCell>
											<TableCell className="text-sm">
												{new Date(
													order.rentalStartTime,
												).toLocaleDateString()}{" "}
												-{" "}
												{new Date(
													order.rentalEndTime,
												).toLocaleDateString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<Separator className="my-4" />
						</div>
					)}

					{/* Full History */}
					<div>
						<div className="flex items-center gap-2 mb-2">
							<ClipboardListIcon className="w-4 h-4 text-muted-foreground" />
							<h3 className="font-semibold">
								All Rental Orders
							</h3>
						</div>

						{isLoading ? (
							<div className="flex justify-center py-8">
								<Loader2Icon className="w-6 h-6 animate-spin text-blue-600" />
							</div>
						) : !orders || orders.length === 0 ? (
							<p className="text-center text-muted-foreground py-6 text-sm">
								No rental history found
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Order #</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Payment</TableHead>
										<TableHead className="text-center">
											Items
										</TableHead>
										<TableHead className="text-right">
											Total
										</TableHead>
										<TableHead>Period</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{orders.map((order: any) => (
										<TableRow key={order.id}>
											<TableCell className="font-medium">
												{order.orderNumber}
											</TableCell>
											<TableCell>
												<Badge
													className={
														statusColors[order.status] ||
														"bg-gray-100 text-gray-800"
													}
												>
													{order.status?.replace(/_/g, " ")}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="text-xs">
													{order.paymentStatus?.replace(
														/_/g,
														" ",
													)}
												</Badge>
											</TableCell>
											<TableCell className="text-center">
												{order.totalItemsCount}
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatCurrency(order.totalAmount || 0)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{new Date(
													order.rentalStartTime,
												).toLocaleDateString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
