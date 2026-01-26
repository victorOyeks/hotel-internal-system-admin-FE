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
import type { InventoryGRNResponse, StorageLocationResponse } from "@/lib/fetch";

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

interface LocationsFiltersProps {
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	typeFilter: string;
	setTypeFilter: (val: string) => void;
	temperatureFilter: string;
	setTemperatureFilter: (val: string) => void;
}

export function LocationFilters({
	searchQuery,
	setSearchQuery,
	typeFilter,
	setTypeFilter,
	temperatureFilter,
	setTemperatureFilter,
}: LocationsFiltersProps) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="grid gap-4 md:grid-cols-4">
					<div className="md:col-span-2 relative">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Search by code, name, or description..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select value={typeFilter} onValueChange={setTypeFilter}>
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
					<Select
						value={temperatureFilter}
						onValueChange={setTemperatureFilter}
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
			</CardContent>
		</Card>
	);
}

const successDialogAtom = atom({
	show: false,
	message: "",
});

export function LocationsToolbar({
	table,
	temperatureFilter,
	searchQuery,
	// settypeFilter,
	// settemperatureFilter,
	setSearchQuery,
	typeFilter,
}: {
	table: TableType<StorageLocationResponse>;
} & LocationsFiltersProps) {
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
					{(temperatureFilter || typeFilter) && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{temperatureFilter && (
								<>
									<span>Status:</span>
									<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
										{temperatureFilter}
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
