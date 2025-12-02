"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import type { GoodsReceiptNote } from "./grn-types";
import { mockGRNs } from "./grn-mock";
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
import { atom, useAtomValue, useSetAtom } from "jotai";

const selectedGRNAtom = atom<GoodsReceiptNote | null>(null);

const columnHelper = createColumnHelper<GoodsReceiptNote>();

const columnDefs = [
	columnHelper.accessor("grnNumber", {
		header: "GRN Number",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("supplierName", {
		header: "Supplier",
		cell: (info) => {
			const setGrn = useSetAtom(selectedGRNAtom);

			return (
				<Button variant={"link"} onClick={() => setGrn(info.row.original)}>
					{info.getValue()}
				</Button>
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
	columnHelper.accessor("isPosted", {
		header: "Posted",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("totalAmount", {
		header: "Total Amount",
		cell: (info) => formatCurrency(info.getValue()),
	}),
	columnHelper.accessor("createdDate", {
		header: "Created Date",
		cell: (info) => {
			// e.g 21st oct, 2025. 7:30 pm
			const value = formatDate(new Date(info.getValue()), "PPpp");

			return value;
		},
	}),
];

export function GRNPage() {
	const table = useReactTable({
		columns: columnDefs,
		data: mockGRNs,
		getCoreRowModel: getCoreRowModel(),
	});
	// UI State
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const selectedGRN = useAtomValue<GoodsReceiptNote | null>(selectedGRNAtom);
	const grns = useMemo(
		() => table.getFilteredRowModel().rows.map((row) => row.original),
		[table],
	);

	// Filter State
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [postedFilter, setPostedFilter] = useState<string>("all");

	// Logic: Calculate Stats
	const unpostedValue = grns
		.filter((g) => !g.isPosted)
		.reduce((sum, g) => sum + g.totalAmount, 0);
	const postedCount = grns.filter((g) => g.isPosted).length;
	const recentCount = grns.filter(
		(g) =>
			new Date(g.createdDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
	).length;

	const handlePostToStock = (grnId: string) => {
		console.log("Posting GRN to stock:", grnId);
		alert("GRN posted to stock successfully!");
		setIsDetailsOpen(false);
	};

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

				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" /> Create GRN
						</Button>
					</DialogTrigger>
					<DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create Goods Receipt Note</DialogTitle>
						</DialogHeader>
						<CreateGRNForm onClose={() => setIsCreateOpen(false)} />
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats */}
			<GRNStats
				unpostedValue={unpostedValue}
				postedCount={postedCount}
				recentCount={recentCount}
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

			{/* Details Modal */}
			<GRNDetails
				open={isDetailsOpen}
				onOpenChange={setIsDetailsOpen}
				grn={selectedGRN}
				onPostToStock={handlePostToStock}
			/>
		</div>
	);
}
