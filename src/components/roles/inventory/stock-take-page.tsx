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
import { PlusIcon, EyeIcon, ClipboardListIcon } from "lucide-react";
import {
	createColumnHelper,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type {
	InventoryStockTakeResponse,
	InventoryStockTakeStatistics,
} from "@/lib/fetch";
import { StockTakeTable } from "./stock-take-table";
import { StockTakeToolbar } from "./stock-take-filters";
import { StockTakeStats } from "./stock-take-stats";
import { StockTakeDetails } from "./stock-take-details";
import { CreateStockTakeForm } from "./stock-take-form";

interface StockTakePageProps {
	stockTakes: InventoryStockTakeResponse[];
	stats: InventoryStockTakeStatistics;
}

const columnHelper = createColumnHelper<InventoryStockTakeResponse>();

export function StockTakePage({ stockTakes, stats }: StockTakePageProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [selectedStockTake, setSelectedStockTake] =
		useState<InventoryStockTakeResponse | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

	const filteredData = (stockTakes || []).filter((item) => {
		const matchesSearch =
			item.stockTakeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.supervisorName.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus =
			statusFilter === "all" || item.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const columns = [
		columnHelper.accessor("stockTakeNumber", {
			header: "Stock Take #",
			cell: (info) => <span className="font-medium">{info.getValue()}</span>,
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
								? "default"
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
		columnHelper.accessor("itemsWithVariance", {
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
			cell: (info) => (
				<div className="flex gap-2">
					{(info.row.original.status === "SCHEDULED" ||
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
						)}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => {
							setSelectedStockTake(info.row.original);
							setIsDetailsDialogOpen(true);
						}}
					>
						<EyeIcon className="w-4 h-4" />
					</Button>
				</div>
			),
		}),
	];

	const handleCompleteStockTake = (id: string) => {
		console.log("Completing stock take:", id);
		setIsDetailsDialogOpen(false);
	};

	const handlePostAdjustments = (id: string) => {
		console.log("Posting adjustments:", id);
		setIsDetailsDialogOpen(false);
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Stock Take / Physical Count
					</h1>
					<p className="text-muted-foreground mt-1">
						Perform physical inventory counts and reconcile variances
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							Create Stock Take
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Create Stock Take</DialogTitle>
						</DialogHeader>
						<CreateStockTakeForm
							onClose={() => setIsCreateDialogOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats */}
			<StockTakeStats stats={stats} />

			{/* Filters */}
			<StockTakeToolbar
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				statusFilter={statusFilter}
				setStatusFilter={setStatusFilter}
			/>

			{/* Table */}
			<StockTakeTable columns={columns as any} data={filteredData} />

			{/* Details Dialog */}
			<StockTakeDetails
				stockTake={selectedStockTake}
				open={isDetailsDialogOpen}
				onOpenChange={setIsDetailsDialogOpen}
				onComplete={handleCompleteStockTake}
				onPostAdjustments={handlePostAdjustments}
			/>
		</div>
	);
}
