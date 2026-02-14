import { Input } from "@/components/ui/input";
import { SearchIcon, XIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableFilter } from "@/components/shared/table-filter";
import { useState, type PropsWithChildren } from "react";
import { useQueryStates, parseAsString, parseAsStringLiteral } from "nuqs";
import { ExportDialog, type ExportData } from "@/components/shared/shared-dialogs";
import { exportStockTakes } from "@/lib/inventory-actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface StockTakeToolbarProps {
	totalCount: number;
}

export function StockTakeToolbar({
	totalCount,
	children,
}: PropsWithChildren<StockTakeToolbarProps>) {
	const [queryState, setQueryState] = useQueryStates({
		search: parseAsString,
		status: parseAsStringLiteral([
			"SCHEDULED",
			"IN_PROGRESS",
			"PENDING_REVIEW",
			"REVIEWED",
			"COMPLETED",
		]),
	});

	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

	const onExport = async (data: ExportData) => {
		try {
			const filters = {
				search: queryState.search || undefined,
				status: queryState.status || undefined,
				startDate: data.from_date?.toISOString(),
				endDate: data.to_date?.toISOString(),
				format: data.export_type.toUpperCase() as "CSV" | "PDF" | "EXCEL",
			};

			const response = await exportStockTakes(filters);

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
				a.download = `stock-takes-${format(new Date(), "yyyy-MM-dd")}.${extension}`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success("Export downloaded successfully");
				setIsExportDialogOpen(false);
			} else {
				toast.error(response.error || "Failed to export stock takes");
			}
		} catch {
			toast.error("An error occurred during export");
		}
	};

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div>
				<p className="text-primary md:pl-2 font-medium">
					All Stock Takes ({totalCount})
				</p>
			</div>

			<div className="flex items-center gap-x-2">
				<div className="relative w-[250px]">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
					<Input
						placeholder="Search Stock Takes..."
						value={queryState.search ?? ""}
						onChange={(event) =>
							setQueryState({ search: event.target.value || null })
						}
						className="pl-9 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full border-none"
					/>
				</div>

				<TableFilter
					open={isFilterOpen}
					setOpen={setIsFilterOpen}
					count={queryState.status ? 1 : 0}
				>
					<div className="flex flex-col gap-y-4">
						<div className="flex items-center justify-between gap-x-4">
							<div className="flex flex-col gap-2">
								<span className="text-sm font-medium text-muted-foreground">
									Status
								</span>
								<div className="flex flex-wrap gap-2">
									{[
										{ label: "All", value: "all" },
										{ label: "Scheduled", value: "SCHEDULED" },
										{ label: "In Progress", value: "IN_PROGRESS" },
										{ label: "Pending Review", value: "PENDING_REVIEW" },
										{ label: "Reviewed", value: "REVIEWED" },
										{ label: "Completed", value: "COMPLETED" },
									].map((status) => (
										<Button
											key={status.value}
											size={"sm"}
											variant={"outline"}
											className="shadow-none text-xs hover:border-transparent"
											onClick={() =>
												setQueryState({
													status:
														status.value === "all" ? null : (status.value as any),
												})
											}
											data-active={
												(queryState.status ?? "all") === status.value
											}
										>
											{queryState.status === status.value && (
												<CheckIcon className="w-3 h-3 mr-1" />
											)}
											<span>{status.label}</span>
										</Button>
									))}
								</div>
							</div>
						</div>

						<div className="flex items-center justify-end gap-x-2">
							<Button
								size={"sm"}
								variant={"ghost"}
								onClick={() => {
									setQueryState({ status: null });
								}}
								className="h-8 px-2"
							>
								Reset
							</Button>
							<Button
								size={"sm"}
								onClick={() => setIsFilterOpen(false)}
								className="h-8 px-2"
							>
								Done
							</Button>
						</div>
					</div>
				</TableFilter>

				{(queryState.search || queryState.status) && (
					<Button
						variant="ghost"
						onClick={() => {
							setQueryState({ search: null, status: null });
						}}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<XIcon className="ml-2 h-4 w-4" />
					</Button>
				)}

				{children}
				<ExportDialog
					open={isExportDialogOpen}
					setOpenAction={setIsExportDialogOpen}
					onSubmitAction={onExport}
				/>
			</div>
		</div>
	);
}
