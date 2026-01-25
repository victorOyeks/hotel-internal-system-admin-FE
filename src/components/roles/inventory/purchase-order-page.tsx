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
import { PlusIcon, EyeIcon, CheckCircleIcon } from "lucide-react";
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
	InventoryProduct,
} from "@/lib/fetch";
import { PurchaseOrderTable } from "./purchase-order-table";
import { PurchaseOrderToolbar } from "./purchase-order-filters";
import { PurchaseOrderStats } from "./purchase-order-stats";
import { PurchaseOrderDetails } from "./purchase-order-details";
import { CreatePOForm } from "./purchase-order-form";

const columnHelper = createColumnHelper<PurchaseOrderResponse>();

const columnDefs = [
	columnHelper.accessor("orderNumber", {
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
				<div>
					<p className="font-medium">{order.supplierName}</p>
					<p className="text-xs text-muted-foreground">
						{order.items.length} items
					</p>
				</div>
			);
		},
	}),
	columnHelper.accessor("orderDate", {
		header: "Order Date",
		cell: (info) => new Date(info.getValue()).toLocaleDateString(),
	}),
	columnHelper.accessor("expectedDeliveryDate", {
		header: "Expected Delivery",
		cell: (info) => new Date(info.getValue()).toLocaleDateString(),
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
				case "PARTIALLY_RECEIVED":
				case "COMPLETED":
					variant = "secondary";
					className = "bg-blue-100 text-blue-800 hover:bg-blue-100";
					break;
				case "CANCELLED":
				case "REJECTED":
					variant = "destructive";
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
	columnHelper.accessor("amountPaid", {
		header: "Amount Paid",
		cell: (info) => (
			<div className="text-right font-semibold">
				{formatCurrency(info.getValue())}
			</div>
		),
	}),
	columnHelper.display({
		id: "actions",
		header: "Actions",
		cell: (info) => {
			const [isDetailsOpen, setIsDetailsOpen] = useState(false);
			const order = info.row.original;

			return (
				<div className="flex gap-2 justify-end">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsDetailsOpen(true)}
					>
						<EyeIcon className="w-4 h-4" />
					</Button>
					{order.status === "PENDING_APPROVAL" && (
						<Button variant="ghost" size="sm" className="text-green-600">
							<CheckCircleIcon className="w-4 h-4" />
						</Button>
					)}
					<PurchaseOrderDetails
						open={isDetailsOpen}
						onOpenChange={setIsDetailsOpen}
						order={order}
					/>
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
	products: InventoryProduct[];
}

export function PurchaseOrderPage({ orders, stats, suppliers, products }: PurchaseOrderPageProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	// Filter data
	const filteredData = orders.filter((order) => {
		const matchesSearch =
			order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			order.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus =
			statusFilter === "all" || order.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const table = useReactTable({
		data: filteredData,
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
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							Create PO
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create Purchase Order</DialogTitle>
						</DialogHeader>
						<CreatePOForm
							onClose={() => setIsCreateDialogOpen(false)}
							suppliers={suppliers}
							products={products}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats */}
			<PurchaseOrderStats stats={stats} />

			{/* Filters */}
			<PurchaseOrderToolbar
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				statusFilter={statusFilter}
				setStatusFilter={setStatusFilter}
			/>

			{/* Table */}
			<PurchaseOrderTable table={table} />
		</div>
	);
}
