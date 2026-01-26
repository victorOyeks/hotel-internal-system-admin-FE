"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, ThermometerIcon, DropletIcon, EyeIcon, MoreHorizontalIcon, MoreVerticalIcon } from "lucide-react";
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
								((location.totalProductsStored / location.totalCapacity) * 100),
							)
						}</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className={`h-2 rounded-full ${(location.totalProductsStored / location.totalCapacity) > 80
								? "bg-red-500"
								: (location.totalProductsStored / location.totalCapacity) > 60
									? "bg-orange-500"
									: "bg-green-500"
								}`}
							style={{ width: `${(location.totalProductsStored / location.totalCapacity) * 100}%` }}
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
	}),
	columnHelper.display({
		id: "actions",
		header: "Actions",
		cell: () => {
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<MoreVerticalIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuLabel>View</DropdownMenuLabel>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	}),
];

export function StorageLocationPage({
	locations,
	paginationMeta
}: {
	locations: StorageLocationResponse[];
	paginationMeta: Pagination;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [temperatureFilter, setTemperatureFilter] = useState<string>("all");
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const table = useReactTable({
		data: locations,
		columns: columnDefs,
		manualPagination: true,
		manualFiltering: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	// Calculate stats
	const activeCount = locations.filter((l) => l.active).length;
	const temperatureControlledCount = locations.filter(
		(l) => l.temperatureControlled,
	).length;
	const totalItemsStored = locations.reduce(
		(sum, l) => sum + (l.totalProductsStored || 0),
		0,
	);
	const avgOccupancy =
		locations.reduce((sum, l) => sum + (l.totalCapacity || 0), 0) /
		locations.length;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Storage Locations
					</h1>
					<p className="text-muted-foreground mt-1">
						Manage warehouse and storage facility information
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
						<CreateLocationForm onClose={() => setIsCreateOpen(false)} />
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
			<LocationsToolbar
				table={table}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				typeFilter={typeFilter}
				setTypeFilter={setTypeFilter}
				temperatureFilter={temperatureFilter}
				setTemperatureFilter={setTemperatureFilter}
			/>

			{/* Locations Table */}
			<LocationTable
				table={table}
			/>
		</div>
	);
}

// Create Location Form Component
function CreateLocationForm({ onClose }: { onClose: () => void }) {
	const [formData, setFormData] = useState({
		code: "",
		name: "",
		locationType: "WAREHOUSE" as LocationType,
		description: "",
		building: "",
		floor: "",
		room: "",
		physicalAddress: "",
		capacityVolume: 0,
		capacityWeight: 0,
		capacityUnits: 0,
		temperatureControlled: false,
		temperatureMin: 0,
		temperatureMax: 0,
		humidityControlled: false,
		humidityMin: 0,
		humidityMax: 0,
		managerName: "",
		contactPhone: "",
		contactEmail: "",
		accessRestrictions: "",
		operatingHours: "",
		specialInstructions: "",
	});

	const handleSubmit = () => {
		console.log("Creating storage location:", formData);
		// API call would go here
		alert("Storage location created successfully!");
		onClose();
	};

	return (
		<div className="space-y-6">
			{/* Basic Information */}
			<div>
				<h3 className="text-lg font-semibold mb-4">Basic Information</h3>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="code">Location Code *</Label>
						<Input
							id="code"
							value={formData.code}
							onChange={(e) =>
								setFormData({ ...formData, code: e.target.value })
							}
							placeholder="e.g., WH-MAIN"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="name">Location Name *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="e.g., Main Warehouse"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="type">Location Type *</Label>
						<Select
							value={formData.locationType}
							onValueChange={(value) =>
								setFormData({
									...formData,
									locationType: value as LocationType,
								})
							}
						>
							<SelectTrigger id="type">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="WAREHOUSE">Warehouse</SelectItem>
								<SelectItem value="COLD_STORAGE">Cold Storage</SelectItem>
								<SelectItem value="DRY_STORAGE">Dry Storage</SelectItem>
								<SelectItem value="BAR">Bar</SelectItem>
								<SelectItem value="KITCHEN">Kitchen</SelectItem>
								<SelectItem value="RESTAURANT">Restaurant</SelectItem>
								<SelectItem value="HOUSEKEEPING">Housekeeping</SelectItem>
								<SelectItem value="MAINTENANCE">Maintenance</SelectItem>
								<SelectItem value="OTHER">Other</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="col-span-2 space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder="Brief description of the storage location..."
							rows={2}
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* Physical Location */}
			<div>
				<h3 className="text-lg font-semibold mb-4">Physical Location</h3>
				<div className="grid grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label htmlFor="building">Building</Label>
						<Input
							id="building"
							value={formData.building}
							onChange={(e) =>
								setFormData({ ...formData, building: e.target.value })
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="floor">Floor</Label>
						<Input
							id="floor"
							value={formData.floor}
							onChange={(e) =>
								setFormData({ ...formData, floor: e.target.value })
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="room">Room</Label>
						<Input
							id="room"
							value={formData.room}
							onChange={(e) =>
								setFormData({ ...formData, room: e.target.value })
							}
						/>
					</div>

					<div className="col-span-3 space-y-2">
						<Label htmlFor="address">Physical Address</Label>
						<Input
							id="address"
							value={formData.physicalAddress}
							onChange={(e) =>
								setFormData({ ...formData, physicalAddress: e.target.value })
							}
							placeholder="Full physical address"
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* Capacity */}
			<div>
				<h3 className="text-lg font-semibold mb-4">Capacity</h3>
				<div className="grid grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label htmlFor="volume">Volume (m³)</Label>
						<Input
							id="volume"
							type="number"
							min="0"
							value={formData.capacityVolume}
							onChange={(e) =>
								setFormData({
									...formData,
									capacityVolume: parseFloat(e.target.value) || 0,
								})
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="weight">Weight (kg)</Label>
						<Input
							id="weight"
							type="number"
							min="0"
							value={formData.capacityWeight}
							onChange={(e) =>
								setFormData({
									...formData,
									capacityWeight: parseFloat(e.target.value) || 0,
								})
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="units">Units/Pallets</Label>
						<Input
							id="units"
							type="number"
							min="0"
							value={formData.capacityUnits}
							onChange={(e) =>
								setFormData({
									...formData,
									capacityUnits: parseFloat(e.target.value) || 0,
								})
							}
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* Climate Control */}
			<div>
				<h3 className="text-lg font-semibold mb-4">Climate Control</h3>
				<div className="space-y-4">
					<div className="flex items-center space-x-2">
						<Checkbox
							id="tempControl"
							checked={formData.temperatureControlled}
							onCheckedChange={(checked) =>
								setFormData({
									...formData,
									temperatureControlled: checked as boolean,
								})
							}
						/>
						<Label htmlFor="tempControl" className="text-sm font-normal">
							Temperature Controlled
						</Label>
					</div>

					{formData.temperatureControlled && (
						<div className="grid grid-cols-2 gap-4 pl-6">
							<div className="space-y-2">
								<Label htmlFor="tempMin">Min Temperature (°C)</Label>
								<Input
									id="tempMin"
									type="number"
									value={formData.temperatureMin}
									onChange={(e) =>
										setFormData({
											...formData,
											temperatureMin: parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="tempMax">Max Temperature (°C)</Label>
								<Input
									id="tempMax"
									type="number"
									value={formData.temperatureMax}
									onChange={(e) =>
										setFormData({
											...formData,
											temperatureMax: parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>
						</div>
					)}

					<div className="flex items-center space-x-2">
						<Checkbox
							id="humControl"
							checked={formData.humidityControlled}
							onCheckedChange={(checked) =>
								setFormData({
									...formData,
									humidityControlled: checked as boolean,
								})
							}
						/>
						<Label htmlFor="humControl" className="text-sm font-normal">
							Humidity Controlled
						</Label>
					</div>

					{formData.humidityControlled && (
						<div className="grid grid-cols-2 gap-4 pl-6">
							<div className="space-y-2">
								<Label htmlFor="humMin">Min Humidity (%)</Label>
								<Input
									id="humMin"
									type="number"
									min="0"
									max="100"
									value={formData.humidityMin}
									onChange={(e) =>
										setFormData({
											...formData,
											humidityMin: parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="humMax">Max Humidity (%)</Label>
								<Input
									id="humMax"
									type="number"
									min="0"
									max="100"
									value={formData.humidityMax}
									onChange={(e) =>
										setFormData({
											...formData,
											humidityMax: parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>
						</div>
					)}
				</div>
			</div>

			<Separator />

			{/* Management */}
			<div>
				<h3 className="text-lg font-semibold mb-4">Management & Contact</h3>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="manager">Manager Name</Label>
						<Input
							id="manager"
							value={formData.managerName}
							onChange={(e) =>
								setFormData({ ...formData, managerName: e.target.value })
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="phone">Contact Phone</Label>
						<Input
							id="phone"
							value={formData.contactPhone}
							onChange={(e) =>
								setFormData({ ...formData, contactPhone: e.target.value })
							}
						/>
					</div>

					<div className="col-span-2 space-y-2">
						<Label htmlFor="email">Contact Email</Label>
						<Input
							id="email"
							type="email"
							value={formData.contactEmail}
							onChange={(e) =>
								setFormData({ ...formData, contactEmail: e.target.value })
							}
						/>
					</div>

					<div className="col-span-2 space-y-2">
						<Label htmlFor="hours">Operating Hours</Label>
						<Input
							id="hours"
							value={formData.operatingHours}
							onChange={(e) =>
								setFormData({ ...formData, operatingHours: e.target.value })
							}
							placeholder="e.g., 24/7 or 9:00 AM - 5:00 PM"
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* Access & Instructions */}
			<div>
				<h3 className="text-lg font-semibold mb-4">Access & Instructions</h3>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="access">Access Restrictions</Label>
						<Textarea
							id="access"
							value={formData.accessRestrictions}
							onChange={(e) =>
								setFormData({ ...formData, accessRestrictions: e.target.value })
							}
							placeholder="Who can access this location and any requirements..."
							rows={2}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="instructions">Special Instructions</Label>
						<Textarea
							id="instructions"
							value={formData.specialInstructions}
							onChange={(e) =>
								setFormData({
									...formData,
									specialInstructions: e.target.value,
								})
							}
							placeholder="Special handling, safety protocols, etc..."
							rows={3}
						/>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="flex justify-end gap-2 pt-4 border-t">
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!formData.code || !formData.name}
				>
					Create Location
				</Button>
			</div>
		</div>
	);
}
