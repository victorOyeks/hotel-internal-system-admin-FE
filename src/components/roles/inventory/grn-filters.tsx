import { SearchIcon, XIcon, DownloadIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { useQueryStates, parseAsString, parseAsStringLiteral } from "nuqs";
import { exportGRNs } from "@/lib/inventory-actions";
import { toast } from "sonner";
import { format } from "date-fns";

const successDialogAtom = atom({
	show: false,
	message: "",
});

export function GRNToolbar({
	table,
}: {
	table: TableType<InventoryGRNResponse>;
}) {
	const [queryState, setQueryState] = useQueryStates({
		search: parseAsString,
		status: parseAsStringLiteral(["DRAFT", "ACCEPTED"]),
		posted: parseAsStringLiteral(["posted", "unposted"]),
	});

	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const setSuccessDialogOpen = useSetAtom(successDialogAtom);

	const handleExport = useCallback(
		async (data: ExportData) => {
			try {
				const result = await exportGRNs(
					{
						search: queryState.search || undefined,
						status: queryState.status || undefined,
						posted: queryState.posted || undefined,
						startDate: data.from_date?.toDateString(),
						endDate: data.to_date?.toDateString(),
					},
					data,
				);

				if (result.success && result.data) {
					const url = window.URL.createObjectURL(result.data as any);
					const a = document.createElement("a");
					a.href = url;
					a.download = `grn-export-${format(new Date(), "yyyy-MM-dd")}.${data.export_type}`;
					a.click();
					window.URL.revokeObjectURL(url);
					toast.success("Data exported successfully!");
				} else {
					toast.error(result.error || "Failed to export data");
				}
			} catch (error) {
				console.error("Export error:", error);
				toast.error("Failed to export data");
			} finally {
				setExportDialogOpen(false);
			}
		},
		[queryState],
	);

	const [open, setOpen] = useState(false);

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div>
				<p>All GRNs ({table.getRowCount()})</p>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search..."
						value={queryState.search ?? ""}
						onChange={(e) =>
							setQueryState({ search: e.target.value || null })
						}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				<div className="flex items-center gap-2">
					<TableFilter open={open} setOpen={setOpen} count={(queryState.status ? 1 : 0) + (queryState.posted ? 1 : 0)}>
						<div className="flex flex-col gap-y-4 w-[280px]">
							<div className="space-y-2">
								<h4 className="font-medium leading-none">Status</h4>
								<Select
									value={queryState.status ?? "all"}
									onValueChange={(value) =>
										setQueryState({
											status: value === "all" ? null : (value as any),
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="All statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										<SelectItem value="DRAFT">Draft</SelectItem>
										<SelectItem value="ACCEPTED">Accepted</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<h4 className="font-medium leading-none">Posted</h4>
								<Select
									value={queryState.posted ?? "all"}
									onValueChange={(value) =>
										setQueryState({
											posted: value === "all" ? null : (value as any),
										})
									}
								>
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
							<div className="flex items-center justify-between border-t pt-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setQueryState({ status: null, posted: null });
									}}
									className="text-muted-foreground hover:text-foreground"
								>
									Reset
								</Button>
								<Button
									size="sm"
									onClick={() => {
										setOpen(false);
									}}
								>
									Done
								</Button>
							</div>
						</div>
					</TableFilter>

					{/* Applied Filters Display */}
					{(queryState.status || queryState.posted) && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{queryState.status && (
								<>
									<span>Status:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{queryState.status}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQueryState({ status: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</>
							)}
							{queryState.posted && (
								<>
									<span>Posted:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{queryState.posted}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQueryState({ posted: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</>
							)}
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
