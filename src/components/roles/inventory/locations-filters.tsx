import { SearchIcon, XIcon } from "lucide-react";
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
import type { StorageLocationResponse } from "@/lib/fetch";
import { useQueryStates, parseAsString, parseAsStringLiteral } from "nuqs";

// Types based on FRD 3.5
export type LocationType =
	| "WAREHOUSE"
	| "COLD_STORAGE"
	| "DRY_STORAGE"
	| "BAR"
	| "KITCHEN"
	| "RESTAURANT"
	| "HOUSEKEEPING"
	| "MAINTENANCE"
	| "OTHER";

export type StorageLocation = {
	id: string;
	code: string; // Unique code
	name: string;
	locationType: LocationType;
	description?: string;
	building?: string;
	floor?: string;
	room?: string;
	physicalAddress?: string;
	capacityVolume?: number; // in cubic meters
	capacityWeight?: number; // in kg
	capacityUnits?: number; // number of units/pallets
	temperatureControlled: boolean;
	temperatureMin?: number;
	temperatureMax?: number;
	humidityControlled: boolean;
	humidityMin?: number;
	humidityMax?: number;
	managerId?: string;
	managerName?: string;
	contactPhone?: string;
	contactEmail?: string;
	accessRestrictions?: string;
	operatingHours?: string;
	specialInstructions?: string;
	isActive: boolean;
	currentOccupancy?: number; // percentage
	itemsStored?: number;
	createdBy: string;
	createdDate: string;
	lastModifiedBy?: string;
	lastModifiedDate?: string;
};

const successDialogAtom = atom({
	show: false,
	message: "",
});

export function LocationsToolbar({
	table,
}: {
	table: TableType<StorageLocationResponse>;
}) {
	const [queryState, setQueryState] = useQueryStates({
		search: parseAsString,
		type: parseAsStringLiteral([
			"WAREHOUSE",
			"COLD_STORAGE",
			"DRY_STORAGE",
			"BAR",
			"KITCHEN",
			"RESTAURANT",
			"HOUSEKEEPING",
			"MAINTENANCE",
			"OTHER",
		]),
		temperature: parseAsStringLiteral(["controlled", "uncontrolled"]),
	});

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
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div>
				<p>All Locations ({table.getRowCount()})</p>
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
					<TableFilter open={open} setOpen={setOpen} count={(queryState.type ? 1 : 0) + (queryState.temperature ? 1 : 0)}>
						<div className="flex flex-col gap-y-4 w-[280px]">
							<div className="space-y-2">
								<h4 className="font-medium leading-none">Type</h4>
								<Select
									value={queryState.type ?? "all"}
									onValueChange={(value) =>
										setQueryState({
											type: value === "all" ? null : (value as any),
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="All types" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Types</SelectItem>
										<SelectItem value="WAREHOUSE">Warehouse</SelectItem>
										<SelectItem value="COLD_STORAGE">Cold Storage</SelectItem>
										<SelectItem value="DRY_STORAGE">Dry Storage</SelectItem>
										<SelectItem value="BAR">Bar</SelectItem>
										<SelectItem value="KITCHEN">Kitchen</SelectItem>
										<SelectItem value="HOUSEKEEPING">Housekeeping</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<h4 className="font-medium leading-none">Temperature</h4>
								<Select
									value={queryState.temperature ?? "all"}
									onValueChange={(value) =>
										setQueryState({
											temperature: value === "all" ? null : (value as any),
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="All locations" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Locations</SelectItem>
										<SelectItem value="controlled">Temperature Controlled</SelectItem>
										<SelectItem value="uncontrolled">Not Controlled</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center justify-between border-t pt-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setQueryState({ type: null, temperature: null });
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
					{(queryState.type || queryState.temperature) && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{queryState.type && (
								<>
									<span>Type:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{queryState.type.replace(/_/g, " ")}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQueryState({ type: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</>
							)}
							{queryState.temperature && (
								<>
									<span>Temp:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{queryState.temperature}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQueryState({ temperature: null })}
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
