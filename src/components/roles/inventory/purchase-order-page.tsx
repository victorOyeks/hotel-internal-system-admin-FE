"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusIcon, MoreHorizontal } from "lucide-react";
import {
	createColumnHelper,
	getCoreRowModel,
	useReactTable,
	getPaginationRowModel,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type {
	PurchaseOrderResponse,
	InventoryPurchaseOrderStatistics,
	InventorySuppliers,
	InventoryProductResponse,
} from "@/lib/fetch";
import { PurchaseOrderTable } from "./purchase-order-table";
import { PurchaseOrderToolbar } from "./purchase-order-filters";
import { PurchaseOrderStats } from "./purchase-order-stats";
import { PurchaseOrderDetails } from "./purchase-order-details";
import { CreatePOForm } from "./purchase-order-form";

const columnHelper = createColumnHelper<PurchaseOrderResponse>();

const columnDefs = [
	columnHelper.accessor("poNumber", {
		header: "PO Number",
		cell: (info) => (
			<span className="font-mono font-medium">{info.getValue()}</span>
		),
	}),
	columnHelper.accessor("supplierName", {
		header: "Supplier",
		cell: (info) => {
			const order = info.row.original;
			return (
				<PurchaseOrderDetails
					order={order}
				>

					<div className="cursor-pointer hover:underline">
						<p className="font-medium">{order.supplierName}</p>
						<p className="text-xs text-muted-foreground">
							{order.items.length} items
						</p>
					</div>
				</PurchaseOrderDetails>
			);
		},
	}),
	columnHelper.accessor("orderDate", {
		header: "Order Date",
		cell: (info) => new Date(info.getValue()).toLocaleDateString(),
	}),
	columnHelper.accessor("expectedDeliveryDate", {
		header: "Expected Delivery",
		cell: (info) => {
			const date = info.getValue();
			if (!date) return "N/A";
			return new Date(date).toLocaleDateString();
		},
	}),
	columnHelper.accessor("status", {
		header: "Status",
		cell: (info) => {
			const status = info.getValue();
			let variant: "default" | "secondary" | "destructive" | "outline" =
				"default";
			let className = "";

			switch (status) {
				case "DRAFT":
					variant = "secondary";
					className = "bg-gray-100 text-gray-800 hover:bg-gray-100";
					break;
				case "PENDING_APPROVAL":
					variant = "secondary";
					className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
					break;
				case "APPROVED":
					variant = "secondary";
					className = "bg-green-100 text-green-800 hover:bg-green-100";
					break;
				case "REJECTED":
					variant = "secondary";
					className = "bg-red-100 text-red-800 hover:bg-red-100";
					break;
				case "SENT_TO_SUPPLIER":
					variant = "secondary";
					className = "bg-blue-100 text-blue-800 hover:bg-blue-100";
					break;
				case "PARTIALLY_RECEIVED":
					variant = "secondary";
					className = "bg-orange-100 text-orange-800 hover:bg-orange-100";
					break;
				case "FULLY_RECEIVED":
					variant = "secondary";
					className = "bg-teal-100 text-teal-800 hover:bg-teal-100";
					break;
				case "CANCELLED":
					variant = "secondary";
					className = "bg-gray-200 text-gray-700 hover:bg-gray-200";
					break;
				case "CLOSED":
					variant = "secondary";
					className = "bg-slate-100 text-slate-800 hover:bg-slate-100";
					break;
				default:
					variant = "outline";
			}

			return (
				<Badge variant={variant} className={`border-0 ${className}`}>
					{status.replace(/_/g, " ")}
				</Badge>
			);
		},
	}),
	columnHelper.accessor("totalAmount", {
		header: "Amount Paid",
		cell: (info) => (
			<div className="font-semibold">
				{formatCurrency(info.getValue())}
			</div>
		),
	}),
	columnHelper.display({
		id: "actions",
		cell: (info) => {
			const order = info.row.original;

			return (
				<div className="text-right">
					<DropdownMenu modal>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							{order.status === "PENDING_APPROVAL" && (
								<DropdownMenuItem>
									Approve Order
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>

				</div>
			);
		},
	}),
];

interface PurchaseOrderPageProps {
	orders: PurchaseOrderResponse[];
	stats: InventoryPurchaseOrderStatistics;
	suppliers: Pick<InventorySuppliers, "id" | "name" | "email" |
		"phone">[];
	products: InventoryProductResponse[];
}


export function PurchaseOrderPage({ orders, stats, suppliers, products }: PurchaseOrderPageProps) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const table = useReactTable({
		data: orders,
		columns: columnDefs,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
					<p className="text-muted-foreground mt-1">
						Create and manage purchase orders for suppliers
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							Create PO
						</Button>
					</DialogTrigger>
					<DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create Purchase Order</DialogTitle>
						</DialogHeader>
						<CreatePOForm
							suppliers={suppliers}
							products={products}
							onClose={() => setIsCreateOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats */}
			<PurchaseOrderStats stats={stats} />

			{/* Filters */}
			<PurchaseOrderToolbar />

			{/* Table */}
			<PurchaseOrderTable table={table} />
		</div>
	);
}