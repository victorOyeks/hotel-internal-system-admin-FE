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
	InventorySuppliers,
} from "@/lib/fetch";

const columnHelper = createColumnHelper<InventoryGRNResponse>();

const columnDefs = [
	columnHelper.accessor("grnNumber", {
		header: "GRN Number",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("supplierName", {
		header: "Supplier",
		cell: (info) => {
			const [isDetailsOpen, setIsDetailsOpen] = useState(false);
			const selectedGRN = info.row.original;

			return (
				<GRNDetails
					open={isDetailsOpen}
					onOpenChange={setIsDetailsOpen}
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
			// e.g 21st oct, 2025. 7:30 pm
			const value = formatDate(new Date(info.getValue()), "PPpp");

			return value;
		},
	}),
];

export function GRNPage({
	grnsData,
	statsData,
	grnLocations,
	suppliers,
}: {
	grnsData: InventoryGRNResponse[];
	statsData: InventoryGRNStatistics;
	grnLocations: InventoryLocationResponse[];
	suppliers: InventorySuppliers[];
}) {
	const table = useReactTable({
		columns: columnDefs,
		data: grnsData,
		getCoreRowModel: getCoreRowModel(),
	});
	// UI State
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	// Filter State
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [postedFilter, setPostedFilter] = useState<string>("all");

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
			<GRNToolbar
				table={table}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				statusFilter={statusFilter}
				setStatusFilter={setStatusFilter}
				postedFilter={postedFilter}
				setPostedFilter={setPostedFilter}
			/>

			{/* Table */}
			<GRNTable table={table} />
		</div>
	);
}
