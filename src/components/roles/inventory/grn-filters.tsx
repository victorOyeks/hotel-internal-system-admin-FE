import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { Table as TableType } from "@tanstack/react-table";
import {
	type ExportData,
	ExportDialog,
} from "@/components/shared/shared-dialogs";
import { TableFilter } from "@/components/shared/table-filter";
import { atom, useSetAtom } from "jotai";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { InventoryGRNResponse } from "@/lib/fetch";

interface GRNFiltersProps {
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	statusFilter: string;
	setStatusFilter: (val: string) => void;
	postedFilter: string;
	setPostedFilter: (val: string) => void;
}

export function GRNFilters({
	searchQuery,
	setSearchQuery,
	statusFilter,
	setStatusFilter,
	postedFilter,
	setPostedFilter,
}: GRNFiltersProps) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="grid gap-4 md:grid-cols-4">
					<div className="md:col-span-2 relative">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Search by GRN number, supplier, or PO number..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger>
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="DRAFT">Draft</SelectItem>
							<SelectItem value="ACCEPTED">Accepted</SelectItem>
						</SelectContent>
					</Select>
					<Select value={postedFilter} onValueChange={setPostedFilter}>
						<SelectTrigger>
							<SelectValue placeholder="All GRNs" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All GRNs</SelectItem>
							<SelectItem value="posted">Posted</SelectItem>
							<SelectItem value="unposted">Unposted</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	);
}

const successDialogAtom = atom({
	show: false,
	message: "",
});

export function GRNToolbar({
	table,
	postedFilter,
	searchQuery,
	// setPostedFilter,
	// setStatusFilter,
	setSearchQuery,
	statusFilter,
}: {
	table: TableType<InventoryGRNResponse>;
} & GRNFiltersProps) {
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const setSuccessDialogOpen = useSetAtom(successDialogAtom);

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

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div>
				<p>All GRNs ({table.getRowCount()})</p>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				<div className="flex items-center gap-2">
					<TableFilter open={open} setOpen={setOpen}></TableFilter>

					{/* Applied Filters Display */}
					{(statusFilter || postedFilter) && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{statusFilter && (
								<>
									<span>Status:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{statusFilter}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										// onClick={() => setQueryState({ status: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</>
							)}
							{/* {queryState.role && (
                <>
                  <span>Role:</span>
                  <span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                    {queryState.role.replace('_', ' ')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setQueryState({ role: null })}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </>
              )} */}
						</div>
					)}
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
