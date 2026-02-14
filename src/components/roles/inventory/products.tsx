"use client";

import type { Table as TableType } from "@tanstack/react-table";
import type { InventoryProductResponse } from "@/lib/fetch";
import { useCallback, useState } from "react";
import {
	type ExportData,
	ExportDialog,
} from "@/components/shared/shared-dialogs";
import { SearchIcon } from "lucide-react";
import { TableFilter } from "@/components/shared/table-filter";

import {
	LOCATION_TYPES,
	PRODUCT_CATEGORIES,
	PRODUCT_STATUSES,
	productSearchParams,
} from "@/lib/search-params.inventory";
import { useQueryState } from "nuqs";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

import { exportProducts } from "@/lib/inventory-actions";
import { format } from "date-fns";
import { toast } from "sonner";

export function ProductsToolbar({
	table,
}: {
	table: TableType<InventoryProductResponse>;
}) {
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [search, setSearch] = useQueryState(
		"search",
		productSearchParams.search.withOptions({ throttleMs: 500 }),
	);
	const [status, setStatus] = useQueryState(
		"status",
		productSearchParams.status,
	);
	const [category, setCategory] = useQueryState(
		"category",
		productSearchParams.category,
	);
	const [locationType, setLocationType] = useQueryState(
		"locationType",
		productSearchParams.locationType,
	);

	const handleExport = useCallback(
		async (data: ExportData) => {
			try {
				const filters = {
					status: status || undefined,
					category: category || undefined,
					format: data.export_type.toUpperCase() as "CSV" | "PDF" | "EXCEL",
				};

				const response = await exportProducts(filters);

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
					a.download = `products-${format(new Date(), "yyyy-MM-dd")}.${extension}`;
					document.body.appendChild(a);
					a.click();
					window.URL.revokeObjectURL(url);
					document.body.removeChild(a);
					toast.success("Export downloaded successfully");
					setExportDialogOpen(false);
				} else {
					toast.error(response.error || "Failed to export products");
				}
			} catch {
				toast.error("An error occurred during export");
			}
		},
		[status, category],
	);

	const [open, setOpen] = useState(false);

	const activeFilterCount = [status, category, locationType].filter(
		Boolean,
	).length;

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div>
				<p>
					All Products ({table.getRowCount()})
				</p>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				<div className="flex items-center gap-2">
					<TableFilter
						open={open}
						setOpen={setOpen}
						count={activeFilterCount}
					>
						<div className="space-y-4 w-[200px]">
							<div className="space-y-2">
								<Label>Status</Label>
								<Select
									value={status || "all"}
									onValueChange={(val) =>
										setStatus(
											val === "all"
												? null
												: (val as (typeof PRODUCT_STATUSES)[number]),
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="All Statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										{PRODUCT_STATUSES.map((s) => (
											<SelectItem key={s} value={s}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Category</Label>
								<Select
									value={category || "all"}
									onValueChange={(val) =>
										setCategory(
											val === "all"
												? null
												: (val as (typeof PRODUCT_CATEGORIES)[number]),
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="All Categories" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Categories</SelectItem>
										{PRODUCT_CATEGORIES.map((c) => (
											<SelectItem key={c} value={c}>
												{c.replaceAll("_", " ")}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Location Type</Label>
								<Select
									value={locationType || "all"}
									onValueChange={(val) =>
										setLocationType(
											val === "all"
												? null
												: (val as (typeof LOCATION_TYPES)[number]),
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="All Locations" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Locations</SelectItem>
										{LOCATION_TYPES.map((l) => (
											<SelectItem key={l} value={l}>
												{l.replaceAll("_", " ")}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{(status || category || locationType) && (
								<Button
									variant="ghost"
									className="w-full justify-start text-muted-foreground"
									onClick={() => {
										setStatus(null);
										setCategory(null);
										setLocationType(null);
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
					open={exportDialogOpen}
					setOpenAction={setExportDialogOpen}
					onSubmitAction={handleExport}
				/>
			</div>
		</div>
	);
}
