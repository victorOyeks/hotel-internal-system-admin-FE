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
import { PlusIcon } from "lucide-react";
import { GRNDetails } from "./grn-details";
import { CreateGRNForm } from "./grn-form";
import { GRNStats } from "./grns";
import { GRNToolbar } from "./grn-filters";
import {
	createColumnHelper,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { GRNTable } from "./grn-table";
import { formatDate } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

import type {
	InventoryGRNResponse,
	InventoryGRNStatistics,
	InventoryLocationResponse,
	InventoryProduct,
	InventorySupplierMini,
	PurchaseOrderListItem,
} from "@/lib/fetch";
import { GRNActions } from "./grn-actions";

const columnHelper = createColumnHelper<InventoryGRNResponse>();



export function GRNPage({
	grnsData,
	statsData,
	grnLocations,
	suppliers,
	products,
	purchaseOrders,
}: {
	grnsData: InventoryGRNResponse[];
	statsData: InventoryGRNStatistics;
	grnLocations: InventoryLocationResponse[];
	suppliers: InventorySupplierMini[];
	products: InventoryProduct[];
	purchaseOrders: PurchaseOrderListItem[];
}) {
	const columnDefs = [
		columnHelper.accessor("grnNumber", {
			header: "GRN Number",
			cell: (info) => info.getValue(),
		}),
		columnHelper.accessor("supplierName", {
			header: "Vendor",
			cell: (info) => {
				const selectedGRN = info.row.original;

				return (
					<GRNDetails
						grn={selectedGRN}
					/>
				);
			},
		}),
		columnHelper.accessor("purchaseOrderNumber", {
			header: "PO Number",
			cell: (info) => info.getValue(),
		}),
		columnHelper.accessor("status", {
			header: "Status",
			cell: (info) => {
				const value = info.getValue();

				if (value === "ACCEPTED") {
					return <Badge variant={"green"}>Accepted</Badge>;
				}

				return <Badge variant={"yellow"}>Draft</Badge>;
			},
		}),
		columnHelper.accessor("stockPosted", {
			header: "Posted",
			cell: (info) => info.getValue(),
		}),
		columnHelper.accessor("totalAmount", {
			header: "Total Amount",
			cell: (info) => formatCurrency(info.getValue()),
		}),
		columnHelper.accessor("updatedAt", {
			header: "Created Date",
			cell: (info) => {
				const value = formatDate(new Date(info.getValue()), "PPpp");
				return value;
			},
		}),
		columnHelper.display({
			id: "actions",
			cell: ({ row }) => (
				<GRNActions
					grn={row.original}
					grnLocations={grnLocations}
					suppliers={suppliers}
					products={products}
					purchaseOrders={purchaseOrders}
				/>
			),
		}),
	];

	const table = useReactTable({
		columns: columnDefs,
		data: grnsData,
		getCoreRowModel: getCoreRowModel(),
	});

	// UI State
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Goods Receipt Notes
					</h1>
					<p className="text-muted-foreground mt-1">
						Record and manage goods received from suppliers
					</p>
				</div>

				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen} modal>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" /> Create GRN
						</Button>
					</DialogTrigger>
					<DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create Goods Receipt Note</DialogTitle>
						</DialogHeader>
						<CreateGRNForm
							grnLocations={grnLocations}
							suppliers={suppliers}
							products={products}
							purchaseOrders={purchaseOrders}
							onClose={() => setIsCreateOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats */}
			<GRNStats
				totalValue={statsData.totalValue}
				postedCount={statsData.stockPostedGRNs}
				recentCount={statsData.grnsToday}
			/>

			{/* Filters */}
			<GRNToolbar table={table} />

			{/* Table */}
			<GRNTable table={table} />
		</div>
	);
}
