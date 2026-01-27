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
import { ThermometerIcon, DropletIcon, MoreVerticalIcon, PlusIcon } from "lucide-react";
import { StatSection } from "./locations";
import {
	LocationsToolbar,
	type LocationType,
} from "./locations-filters";
import {
	createColumnHelper,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { LocationDetails } from "./location-details";
import type { Pagination, StorageLocationResponse } from "@/lib/fetch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LocationTable } from "./location-table";
import { CreateLocationForm } from "./create-location-form";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";

const columnHelper = createColumnHelper<StorageLocationResponse>();

const columnDefs = [
	columnHelper.accessor("locationCode", {
		header: "Location Code",
		cell: (info) => <span className="font-medium">{info.getValue()}</span>,
	}),
	columnHelper.accessor("locationName", {
		header: "Name",
		cell: (info) => {
			return (
				<LocationDetails
					location={info.row.original}
				>
					<div className="hover:underline group-hover:underline cursor-pointer">
						<p className="font-medium">{info.getValue()}</p>
						{info.row.original.description && (
							<p className="text-xs text-muted-foreground">
								{info.row.original.description.substring(0, 40)}
								{info.row.original.description.length > 40 ? "..." : ""}
							</p>
						)}
					</div>
				</LocationDetails>
			);
		},
	}),
	columnHelper.accessor("locationType", {
		header: "Type",
		cell: (info) => (
			<Badge variant="outline">{info.getValue().replace(/_/g, " ")}</Badge>
		),
	}),
	columnHelper.accessor("building", {
		header: "Building/Floor",
		cell: (info) => {
			const location = info.row.original;
			return (
				<div className="text-sm">
					<p>{location.building}</p>
					{location.floor && (
						<p className="text-xs text-muted-foreground">{location.floor}</p>
					)}
				</div>
			);
		},
	}),
	columnHelper.display({
		id: "climateControl",
		header: "Climate Control",
		cell: (info) => {
			const location = info.row.original;
			return (
				<div className="flex flex-col gap-y-1">
					{location.temperatureControlled && (
						<Badge
							variant="outline"
							className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
						>
							<ThermometerIcon className="w-3 h-3 mr-1" />
							{location.minTemperature}°C - {location.maxTemperature}°C
						</Badge>
					)}
					{location.humidityControlled && (
						<Badge
							variant="outline"
							className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
						>
							<DropletIcon className="w-3 h-3 mr-1" />
							{location.minHumidity}% - {location.maxHumidity}%
						</Badge>
					)}
					{!location.temperatureControlled && !location.humidityControlled && (
						<span className="text-xs text-muted-foreground">Ambient</span>
					)}
				</div>
			);
		},
	}),
	columnHelper.display({
		id: "occupancy",
		header: "Occupancy",
		cell: (info) => {
			const location = info.row.original;
			return (
				<div className="space-y-1 min-w-[120px]">
					<div className="flex justify-between text-xs">
						<span>{location.totalProductsStored} items</span>
						<span>{
							Intl.NumberFormat("en-US", {
								style: "percent",
								maximumFractionDigits: 2,
							}).format(
								location.totalCapacity > 0
									? (location.totalProductsStored / location.totalCapacity)
									: 0
							)
						}</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className={`h-2 rounded-full ${location.totalCapacity > 0 && (location.totalProductsStored / location.totalCapacity) > 0.8
								? "bg-red-500"
								: location.totalCapacity > 0 && (location.totalProductsStored / location.totalCapacity) > 0.6
									? "bg-orange-500"
									: "bg-green-500"
								}`}
							style={{
								width: `${location.totalCapacity > 0
									? (location.totalProductsStored / location.totalCapacity) * 100
									: 0
									}%`
							}}
						/>
					</div>
				</div>
			);
		},
	}),
	columnHelper.accessor("contactPerson", {
		header: "Manager",
		cell: (info) => {
			const location = info.row.original;
			return (
				<div className="text-sm">
					<p className="font-medium">{location.contactPerson}</p>
					{location.contactPhone && (
						<p className="text-xs text-muted-foreground">
							{location.contactPhone}
						</p>
					)}
				</div>
			);
		},
	}),
	columnHelper.accessor("active", {
		header: "Status",
		cell: (info) => (
			<Badge variant={info.getValue() ? "green" : "red"}>
				{info.getValue() ? "Active" : "Inactive"}
			</Badge>
		),
	})
];

export function StorageLocationPage({
	locations,
	paginationMeta
}: {
	locations: StorageLocationResponse[];
	paginationMeta: Pagination;
}) {
	// Calculate stats
	const activeCount = locations.filter((l) => l.active).length;
	const temperatureControlledCount = locations.filter(
		(l) => l.temperatureControlled,
	).length;
	const totalItemsStored = locations.reduce(
		(sum, l) => sum + (l.totalProductsStored || 0),
		0,
	);
	const totalCapacity = locations.reduce(
		(sum, l) => sum + (l.totalCapacity || 0),
		0,
	);
	const avgOccupancy =
		totalCapacity > 0 ? (totalItemsStored / totalCapacity) * 100 : 0;

	const [pagination, onPaginationChange] = usePaginationSearchParams()

	const table = useReactTable({
		data: locations,
		columns: columnDefs,
		manualPagination: true,
		manualFiltering: true,
		onPaginationChange,
		pageCount: paginationMeta.totalPages,
		state: {
			pagination
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-medium tracking-tight">
						Storage Locations
					</h1>
					<p className="text-muted-foreground mt-1">
						Manage warehouse and storage facility information
					</p>
				</div>
				<Dialog>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							Add Location
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Add Storage Location</DialogTitle>
						</DialogHeader>
						<CreateLocationForm />
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<StatSection
				activeCount={activeCount}
				avgOccupancy={avgOccupancy}
				temperatureControlledCount={temperatureControlledCount}
				totalItemsStored={totalItemsStored}
			/>

			{/* Search and Filters */}
			<LocationsToolbar table={table} />

			{/* Locations Table */}
			<LocationTable
				table={table}
			/>
		</div>
	);
}


