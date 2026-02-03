"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	PlusIcon,
	SearchIcon,
	XIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	ClockIcon,
	CheckCircleIcon,
	FileTextIcon,
	AlertCircleIcon,
} from "lucide-react";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
	type Table as TableType,
} from "@tanstack/react-table";
import type {
	Pagination,
	StockAdjustmentResponse,
} from "@/lib/fetch"; // Ensure this export exists or mock it locally if missing
import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { useQueryState } from "nuqs";
import {
	ExportDialog,
	type ExportData,
} from "@/components/shared/shared-dialogs";
import { exportStockAdjustments } from "@/lib/inventory-actions";
import { toast } from "sonner";
import { TableFilter } from "@/components/shared/table-filter";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DataTablePagination } from "@/components/shared/pagination";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";

function CreateAdjustmentForm({ onClose }: { onClose: () => void }) {
	return (
		<div className="p-4 space-y-4">
			<div className="bg-yellow-50 p-4 rounded border border-yellow-200">
				<p className="text-yellow-800">Form implementation pending redesign.</p>
			</div>
			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onClose}>Cancel</Button>
				<Button disabled>Save Adjustment</Button>
			</div>
		</div>
	);
}

// Mocking StockAdjustmentStatistics if not in fetch
export type StockAdjustmentStatsMock = {
	pendingApprovalCount: number;
	pendingApprovalValue: number;
	approvedCount: number;
	postedCount: number;
	totalAdjustments: number;
};

// --- Mock Data moved to parent in next step, but need interfaces here ---

const columnHelper = createColumnHelper<StockAdjustmentResponse>();

const columns = [
	columnHelper.accessor("adjustmentNumber", {
		header: "Adjustment #",
		cell: (info) => <span className="font-medium">{info.getValue()}</span>,
	}),
	columnHelper.accessor("adjustmentDate", {
		header: "Date",
		cell: (info) => format(new Date(info.getValue()), "MMM dd, yyyy"),
	}),
	columnHelper.accessor("productName", {
		header: "Product",
		cell: (info) => (
			<div>
				<p className="font-medium">{info.getValue()}</p>
				<p className="text-xs text-muted-foreground">
					{info.row.original.productSku}
				</p>
			</div>
		),
	}),
	columnHelper.accessor("locationName", {
		header: "Location",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("reason", {
		header: "Reason",
		cell: (info) => (
			<Badge variant="outline">{info.getValue().replace(/_/g, " ")}</Badge>
		),
	}),
	columnHelper.accessor("adjustmentType", {
		header: "Type",
		cell: (info) =>
			info.getValue() === "INCREASE" ? (
				<Badge
					variant="outline"
					className="bg-green-50 text-green-700 border-green-200"
				>
					<TrendingUpIcon className="w-3 h-3 mr-1" />
					Increase
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="bg-red-50 text-red-700 border-red-200"
				>
					<TrendingDownIcon className="w-3 h-3 mr-1" />
					Decrease
				</Badge>
			),
	}),
	columnHelper.accessor("adjustmentQuantity", {
		header: "Qty",
		cell: (info) => (
			<span className="font-medium">{info.getValue()}</span>
		),
		meta: {
			align: "right",
		}
	}),
	columnHelper.accessor("totalCostImpact", {
		header: "Cost Impact",
		cell: (info) => formatCurrency(Math.abs(info.getValue())),
		meta: {
			align: "right",
		}
	}),
	columnHelper.display({
		id: "status",
		header: "Status",
		cell: (info) => {
			const adj = info.row.original;
			let status = "PENDING";
			let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

			if (adj.posted) {
				status = "POSTED";
				variant = "default";
			} else if (adj.cancelled) {
				status = "CANCELLED";
				variant = "destructive"; // or gray
			} else if (adj.approved) {
				status = "APPROVED";
				variant = "secondary";
			} else if (adj.requiresApproval && !adj.approved) {
				status = "PENDING APPROVAL";
				variant = "outline"; // or yellow
			}

			return (
				<Badge
					variant={variant}
				>
					{status}
				</Badge>
			);
		},
	}),
];

function StatCard({
	icon,
	bgClass,
	title,
	value,
	subtitle,
}: {
	icon: React.ReactNode;
	bgClass: string;
	title: string;
	value: string | number;
	subtitle?: string;
}) {
	return (
		<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
			<div
				className={cn`size-10 aspect-square ${bgClass} rounded-full flex items-center justify-center`}
			>
				{icon}
			</div>
			<div className="flex flex-col flex-1">
				<h3 className="text-xs text-muted-foreground">{title}</h3>
				<p className="text-xl font-semibold leading-tight">
					{value}{" "}
					{subtitle && (
						<span className="text-xs text-muted-foreground font-light">
							{subtitle}
						</span>
					)}
				</p>
			</div>
		</div>
	);
}

export function StockAdjustmentPage({
	adjustments,
	stats,
	paginationMeta,
}: {
	adjustments: StockAdjustmentResponse[];
	stats: StockAdjustmentStatsMock;
	paginationMeta: Pagination;
}) {
	const [pagination, setPagination] = usePaginationSearchParams();
	const table = useReactTable({
		data: adjustments,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		state: {
			pagination,
		},
	});

	const [isCreateOpen, setIsCreateOpen] = useState(false);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">
						Stock Adjustments
					</h1>
					<p className="text-muted-foreground mt-1">
						Manage stock corrections for damages, theft, and variances
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							Create Adjustment
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create Stock Adjustment</DialogTitle>
						</DialogHeader>
						<CreateAdjustmentForm onClose={() => setIsCreateOpen(false)} />
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
				<StatCard
					icon={<ClockIcon className="text-orange-600" />}
					bgClass="bg-orange-50"
					title="Pending Approval"
					value={stats.pendingApprovalCount}
					subtitle={`${formatCurrency(stats.pendingApprovalValue)} impact`}
				/>
				<StatCard
					icon={<CheckCircleIcon className="text-green-600" />}
					bgClass="bg-green-50"
					title="Approved"
					value={stats.approvedCount}
					subtitle="Ready to post"
				/>
				<StatCard
					icon={<FileTextIcon className="text-blue-600" />}
					bgClass="bg-blue-50"
					title="Posted"
					value={stats.postedCount}
					subtitle="Stock updated"
				/>
				<StatCard
					icon={<AlertCircleIcon className="text-purple-600" />}
					bgClass="bg-purple-50"
					title="Total Adjustments"
					value={stats.totalAdjustments}
					subtitle="All time"
				/>
			</div>

			{/* Toolbar */}
			<StockAdjustmentToolbar table={table} />

			{/* Table */}
			<div className="overflow-hidden rounded-md border bg-card">
				<Table>
					<TableHeader className="bg-gray-100">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="text-gray-500">
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} className="hover:bg-gray-50">
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className={cn("text-gray-600", (cell.column.columnDef.meta as any)?.align === "right" && "text-right")}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
					<TableFooter>
						<TableRow>
							<TableCell colSpan={columns.length}>
								<div className="w-full flex items-center justify-between">
									<span className="text-sm text-gray-500">
										Page {table.getState().pagination.pageIndex + 1} of{" "}
										{table.getPageCount()}
									</span>
									<DataTablePagination table={table} />
								</div>
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</div>
		</div>
	);
}

// Toolbar Component
function StockAdjustmentToolbar({
	table,
}: {
	table: TableType<StockAdjustmentResponse>;
}) {
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const [search, setSearch] = useQueryState("search", {
		defaultValue: "",
		throttleMs: 500,
	});
	const [status, setStatus] = useQueryState("status", { defaultValue: "all" });
	const [type, setType] = useQueryState("type", { defaultValue: "all" });

	const [openFilter, setOpenFilter] = useState(false);

	const activeFilterCount = [status !== "all", type !== "all"].filter(Boolean).length;

	const onExport = async (data: ExportData) => {
		try {
			// Map filters
			const filters = {
				adjustmentType: type !== "all" ? type : undefined,
				approved: status === "APPROVED" ? true : undefined,
				posted: status === "POSTED" ? true : undefined,
				startDate: data.from_date?.toISOString(),
				endDate: data.to_date?.toISOString(),
				format: data.export_type.toUpperCase() as "CSV" | "PDF" | "EXCEL",
			};

			const response = await exportStockAdjustments(filters);

			if (response.success && response.data) {
				const blob = new Blob([response.data as unknown as BlobPart], {
					type:
						data.export_type === "csv"
							? "text/csv"
							: data.export_type === "pdf"
								? "application/pdf"
								: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				});
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				const extension =
					data.export_type === "excel" ? "xlsx" : data.export_type;
				a.download = `stock-adjustments-${format(new Date(), "yyyy-MM-dd")}.${extension}`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success("Export downloaded successfully");
				setIsExportDialogOpen(false);
			} else {
				toast.error(response.error || "Failed to export adjustments");
			}
		} catch {
			toast.error("An error occurred during export");
		}
	};

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div>
				<p className="pl-2">All Adjustments ({table.getRowCount()})</p>
			</div>

			<div className="flex items-center gap-x-2">
				<div className="relative">
					<input
						type="text"
						placeholder="Search product..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
				</div>

				<div className="flex items-center gap-2">
					<TableFilter open={openFilter} setOpen={setOpenFilter} count={activeFilterCount}>
						<div className="space-y-4 w-[200px]">
							<div className="space-y-2">
								<Label>Status</Label>
								<Select value={status} onValueChange={setStatus}>
									<SelectTrigger>
										<SelectValue placeholder="All Statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										<SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
										<SelectItem value="APPROVED">Approved</SelectItem>
										<SelectItem value="POSTED">Posted</SelectItem>
										<SelectItem value="REJECTED">Rejected</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Type</Label>
								<Select value={type} onValueChange={setType}>
									<SelectTrigger>
										<SelectValue placeholder="All Types" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Types</SelectItem>
										<SelectItem value="INCREASE">Increase</SelectItem>
										<SelectItem value="DECREASE">Decrease</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{(status !== "all" || type !== "all") && (
								<Button
									variant="ghost"
									className="w-full justify-start text-muted-foreground"
									onClick={() => {
										setStatus("all");
										setType("all");
									}}
								>
									<XIcon className="mr-2 h-4 w-4" />
									Clear Filters
								</Button>
							)}
						</div>
					</TableFilter>
				</div>

				<ExportDialog
					open={isExportDialogOpen}
					setOpenAction={setIsExportDialogOpen}
					onSubmitAction={onExport}
				/>
			</div>
		</div>
	);
}
