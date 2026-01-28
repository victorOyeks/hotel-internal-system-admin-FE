"use client";

import { atom, useSetAtom } from "jotai";
import type { Table as TableType } from "@tanstack/react-table";
import type { InventoryProductResponse } from "@/lib/fetch";
import { useCallback, useState } from "react";
import {
	type ExportData,
	ExportDialog,
} from "@/components/shared/shared-dialogs";
import { SearchIcon } from "lucide-react";
import { TableFilter } from "@/components/shared/table-filter";

const successDialogAtom = atom({
	show: false,
	message: "",
});

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

export function ProductsToolbar({
	table,
}: {
	table: TableType<InventoryProductResponse>;
}) {
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const setSuccessDialogOpen = useSetAtom(successDialogAtom);
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
			// Handle the export logic here, e.g., sending data to an API
			console.log("Exporting data with the following details:", data);
			setExportDialogOpen(false);
			setSuccessDialogOpen({
				show: true,
				message: "Data exported successfully!",
			});
		},
		[setSuccessDialogOpen],
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
