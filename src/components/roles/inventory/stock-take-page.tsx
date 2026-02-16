/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation */
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
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type {
	InventoryLocationListResponse,
	Pagination,
	StockTake
} from "@/lib/fetch";
import { StockTakeTable } from "./stock-take-table";
import { StockTakeToolbar } from "./stock-take-filters";
// import { StockTakeStats } from "./stock-take-stats";
import { StockTakeDetails } from "./stock-take-details";
import { CreateStockTakeForm } from "./stock-take-form";
import { postStockTakeAdjustments, startStockTake, cancelStockTake, completeStockTake } from "@/lib/inventory-actions";

interface StockTakePageProps {
	stockTakes: StockTake[];
	stats: any;
	paginationSchema: Pagination;
	inventoryLocations: InventoryLocationListResponse[];
}

const columnHelper = createColumnHelper<StockTake>();

export function StockTakePage({ stockTakes, inventoryLocations
	, paginationSchema }: StockTakePageProps) {
	const [selectedStockTake, setSelectedStockTake] =
		useState<StockTake | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

	const columns = [
		columnHelper.accessor("stockTakeNumber", {
			header: "Stock Take #",
			cell: (info) => (
				<Button
					variant="link"
					onClick={() => {
						setSelectedStockTake(info.row.original);
						setIsDetailsDialogOpen(true);
					}}
				>
					<span className="font-medium">{info.getValue()}</span>,
				</Button>
			)
		}),
		columnHelper.accessor("locationName", {
			header: "Location",
		}),
		columnHelper.accessor("scheduledDate", {
			header: "Scheduled Date",
			cell: (info) => new Date(info.getValue()).toLocaleDateString(),
		}),
		columnHelper.accessor("stockTakeType", {
			header: "Type",
			cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
		}),
		columnHelper.accessor("supervisorName", {
			header: "Supervisor",
		}),
		columnHelper.accessor("status", {
			header: "Status",
			cell: (info) => {
				const status = info.getValue();
				return (
					<Badge
						variant={
							status === "COMPLETED"
								? "green"
								: status === "IN_PROGRESS"
									? "secondary"
									: "outline"
						}
					>
						{status.replace(/_/g, " ")}
					</Badge>
				);
			},
		}),
		columnHelper.accessor("totalItemsWithVariance", {
			header: "Variances",
			cell: (info) => {
				const count = info.getValue();
				return count > 0 ? (
					<Badge
						variant="outline"
						className="bg-orange-50 text-orange-700 border-orange-200"
					>
						{count} items
					</Badge>
				) : (
					<span className="text-muted-foreground text-sm">None</span>
				);
			},
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			cell: () => (
				<div>
					{/* {(info.row.original.status === "SCHEDULED" ||
						info.row.original.status === "IN_PROGRESS") && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSelectedStockTake(info.row.original);
									// Logic to open counting dialog would go here
									// For now we just open details
									setIsDetailsDialogOpen(true);
								}}
							>
								<ClipboardListIcon className="w-4 h-4 mr-1" />
								Count
							</Button>
						)} */}

				</div>
			),
		}),
	];

	const handleCompleteStockTake = async (id: string) => {
		const res = await completeStockTake(id);
		if (res.success) {
			setIsDetailsDialogOpen(false);
		}
		return res;
	};

	const handlePostAdjustments = async (id: string) => {
		const res = await postStockTakeAdjustments(id);
		if (res.success) {
			setIsDetailsDialogOpen(false);
		}
		return res;
	};

	const handleStartStockTake = async (id: string) => {
		return await startStockTake(id);
	};

	const handleCancelStockTake = async (id: string) => {
		const res = await cancelStockTake(id, "Cancelled by user");
		if (res.success) {
			setIsDetailsDialogOpen(false);
		}
		return res;
	};

	const handleRecordCount = async (stockTakeId: string, itemId: string, quantity: number) => {
		const { recordStockCount } = await import("@/lib/inventory-actions");
		// Optimistic update could happen here or we rely on revalidatePath
		return await recordStockCount(stockTakeId, itemId, {
			stockTakeItemId: itemId,
			actualQuantity: quantity
		});
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-medium tracking-tight">
						Stock Take / Physical Count
					</h1>
					<p className="text-muted-foreground mt-1">
						Perform physical inventory counts and reconcile variances
					</p>
				</div>

				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button className="rounded-md md:rounded-xl">
							<PlusIcon className="w-4 h-4 mr-2" />
							Create Stock Take
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-4xl! h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create Stock Take</DialogTitle>
						</DialogHeader>
						<CreateStockTakeForm
							inventoryLocations={inventoryLocations}
							onClose={() => setIsCreateDialogOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats */}
			{/* <StockTakeStats stats={stats} /> */}

			{/* Filters */}
			<StockTakeToolbar
				totalCount={paginationSchema.totalElements}
			>

			</StockTakeToolbar>

			{/* Table */}
			<StockTakeTable columns={columns as any} data={stockTakes} />

			{/* Details Dialog */}
			<StockTakeDetails
				stockTake={selectedStockTake}
				open={isDetailsDialogOpen}
				onOpenChange={setIsDetailsDialogOpen}
				onComplete={handleCompleteStockTake}
				onPostAdjustments={handlePostAdjustments}
				onStart={handleStartStockTake}
				onCancel={handleCancelStockTake}
				onRecordCount={handleRecordCount}
			/>
		</div>
	);
}
