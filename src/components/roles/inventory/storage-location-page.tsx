"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
	PlusIcon,
	ThermometerIcon,
	DropletIcon,
	UserIcon,
	ClockIcon,
	ShieldIcon,
} from "lucide-react";
import { StatSection } from "./locations";
import {
	LocationFilters,
	LocationsToolbar,
	type LocationType,
	type StorageLocation,
} from "./locations-filters";
import {
	type ColumnDef,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";

// Mock data
const mockLocations: StorageLocation[] = [
	{
		id: "1",
		code: "WH-MAIN",
		name: "Main Warehouse",
		locationType: "WAREHOUSE",
		description: "Primary storage facility for general inventory",
		building: "Building A",
		floor: "Ground Floor",
		room: "Room 101",
		physicalAddress: "123 Hotel Drive, Storage Block A",
		capacityVolume: 500,
		capacityWeight: 10000,
		capacityUnits: 100,
		temperatureControlled: true,
		temperatureMin: 15,
		temperatureMax: 25,
		humidityControlled: true,
		humidityMin: 40,
		humidityMax: 60,
		managerId: "1",
		managerName: "Sarah Johnson",
		contactPhone: "+1-555-0101",
		contactEmail: "sarah.j@hotel.com",
		accessRestrictions: "Authorized personnel only. Badge required.",
		operatingHours: "24/7",
		specialInstructions:
			"Heavy items on lower shelves. FIFO rotation required.",
		isActive: true,
		currentOccupancy: 75,
		itemsStored: 245,
		createdBy: "Admin",
		createdDate: "2025-01-01T00:00:00",
	},
	{
		id: "2",
		code: "CS-01",
		name: "Cold Storage Unit 1",
		locationType: "COLD_STORAGE",
		description: "Temperature-controlled storage for perishables",
		building: "Building B",
		floor: "Basement",
		room: "CS-1",
		capacityVolume: 100,
		capacityWeight: 2000,
		temperatureControlled: true,
		temperatureMin: 2,
		temperatureMax: 8,
		humidityControlled: true,
		humidityMin: 80,
		humidityMax: 90,
		managerId: "2",
		managerName: "Michael Chen",
		contactPhone: "+1-555-0102",
		contactEmail: "michael.c@hotel.com",
		accessRestrictions: "Kitchen staff and inventory officers only",
		operatingHours: "24/7",
		specialInstructions:
			"Temperature monitored continuously. Alert if temp exceeds 10°C. FIFO strictly enforced.",
		isActive: true,
		currentOccupancy: 60,
		itemsStored: 85,
		createdBy: "Admin",
		createdDate: "2025-01-01T00:00:00",
	},
	{
		id: "3",
		code: "DS-01",
		name: "Dry Storage Room",
		locationType: "DRY_STORAGE",
		description: "Ambient storage for non-perishables",
		building: "Building A",
		floor: "Ground Floor",
		room: "Room 102",
		capacityVolume: 200,
		capacityWeight: 5000,
		capacityUnits: 50,
		temperatureControlled: false,
		humidityControlled: true,
		humidityMin: 30,
		humidityMax: 50,
		managerId: "1",
		managerName: "Sarah Johnson",
		contactPhone: "+1-555-0101",
		contactEmail: "sarah.j@hotel.com",
		accessRestrictions: "Standard access. Sign-in required.",
		operatingHours: "6:00 AM - 10:00 PM",
		specialInstructions: "Keep dry. No water storage. Pest control monthly.",
		isActive: true,
		currentOccupancy: 45,
		itemsStored: 120,
		createdBy: "Admin",
		createdDate: "2025-01-01T00:00:00",
	},
	{
		id: "4",
		code: "BAR-ST",
		name: "Bar Storage",
		locationType: "BAR",
		description: "Dedicated storage for bar supplies and beverages",
		building: "Main Building",
		floor: "1st Floor",
		room: "Bar Back Room",
		capacityVolume: 50,
		capacityWeight: 1000,
		temperatureControlled: true,
		temperatureMin: 12,
		temperatureMax: 18,
		humidityControlled: false,
		managerId: "3",
		managerName: "Emma Davis",
		contactPhone: "+1-555-0103",
		contactEmail: "emma.d@hotel.com",
		accessRestrictions: "Bar staff only. Manager approval required.",
		operatingHours: "10:00 AM - 2:00 AM",
		specialInstructions: "Secure lock. Inventory daily. Wine storage separate.",
		isActive: true,
		currentOccupancy: 80,
		itemsStored: 156,
		createdBy: "Admin",
		createdDate: "2025-01-01T00:00:00",
	},
	{
		id: "5",
		code: "HK-ST",
		name: "Housekeeping Storage",
		locationType: "HOUSEKEEPING",
		description: "Cleaning supplies and linen storage",
		building: "Service Building",
		floor: "2nd Floor",
		room: "HK-Storage",
		capacityVolume: 80,
		capacityWeight: 1500,
		temperatureControlled: false,
		humidityControlled: false,
		managerId: "4",
		managerName: "Lisa Martinez",
		contactPhone: "+1-555-0104",
		contactEmail: "lisa.m@hotel.com",
		accessRestrictions: "Housekeeping department only",
		operatingHours: "6:00 AM - 6:00 PM",
		specialInstructions: "Chemicals stored separately. MSDS sheets on wall.",
		isActive: true,
		currentOccupancy: 55,
		itemsStored: 78,
		createdBy: "Admin",
		createdDate: "2025-01-01T00:00:00",
	},
];

export function StorageLocationPage() {
	const table = useReactTable({
		data: mockLocations,
		columns: [] as unknown as ColumnDef<StorageLocation>[],
		getCoreRowModel: getCoreRowModel(),
	});
	const [locations] = useState<StorageLocation[]>(mockLocations);
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [temperatureFilter, setTemperatureFilter] = useState<string>("all");
	const [selectedLocation, setSelectedLocation] =
		useState<StorageLocation | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	// Filter locations
	const filteredLocations = locations.filter((loc) => {
		const matchesSearch =
			loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
			loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			loc.description?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesType = typeFilter === "all" || loc.locationType === typeFilter;
		const matchesTemp =
			temperatureFilter === "all" ||
			(temperatureFilter === "controlled" && loc.temperatureControlled) ||
			(temperatureFilter === "uncontrolled" && !loc.temperatureControlled);

		return matchesSearch && matchesType && matchesTemp;
	});

	// Calculate stats
	const activeCount = locations.filter((l) => l.isActive).length;
	const temperatureControlledCount = locations.filter(
		(l) => l.temperatureControlled,
	).length;
	const totalItemsStored = locations.reduce(
		(sum, l) => sum + (l.itemsStored || 0),
		0,
	);
	const avgOccupancy =
		locations.reduce((sum, l) => sum + (l.currentOccupancy || 0), 0) /
		locations.length;

	const handleViewDetails = (location: StorageLocation) => {
		setSelectedLocation(location);
		setIsDetailsOpen(true);
	};

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
			<Card>
				<CardHeader>
					<CardTitle>Storage Locations ({filteredLocations.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Location Code</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Building/Floor</TableHead>
								<TableHead>Climate Control</TableHead>
								<TableHead>Occupancy</TableHead>
								<TableHead>Manager</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredLocations.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={9}
										className="text-center text-muted-foreground py-8"
									>
										No locations found
									</TableCell>
								</TableRow>
							) : (
								filteredLocations.map((location) => (
									<TableRow key={location.id}>
										<TableCell className="font-medium">
											{location.code}
										</TableCell>
										<TableCell>
											<div>
												<p className="font-medium">{location.name}</p>
												{location.description && (
													<p className="text-xs text-muted-foreground">
														{location.description.substring(0, 40)}
														{location.description.length > 40 ? "..." : ""}
													</p>
												)}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{location.locationType.replace(/_/g, " ")}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<p>{location.building}</p>
												{location.floor && (
													<p className="text-xs text-muted-foreground">
														{location.floor}
													</p>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className="space-y-1">
												{location.temperatureControlled && (
													<Badge
														variant="outline"
														className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
													>
														<ThermometerIcon className="w-3 h-3 mr-1" />
														{location.temperatureMin}°C -{" "}
														{location.temperatureMax}°C
													</Badge>
												)}
												{location.humidityControlled && (
													<Badge
														variant="outline"
														className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
													>
														<DropletIcon className="w-3 h-3 mr-1" />
														{location.humidityMin}% - {location.humidityMax}%
													</Badge>
												)}
												{!location.temperatureControlled &&
													!location.humidityControlled && (
														<span className="text-xs text-muted-foreground">
															Ambient
														</span>
													)}
											</div>
										</TableCell>
										<TableCell>
											<div className="space-y-1">
												<div className="flex justify-between text-xs">
													<span>{location.itemsStored} items</span>
													<span>{location.currentOccupancy}%</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div
														className={`h-2 rounded-full ${
															(location.currentOccupancy || 0) > 80
																? "bg-red-500"
																: (location.currentOccupancy || 0) > 60
																	? "bg-orange-500"
																	: "bg-green-500"
														}`}
														style={{ width: `${location.currentOccupancy}%` }}
													/>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<p className="font-medium">{location.managerName}</p>
												{location.contactPhone && (
													<p className="text-xs text-muted-foreground">
														{location.contactPhone}
													</p>
												)}
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={location.isActive ? "default" : "secondary"}
											>
												{location.isActive ? "Active" : "Inactive"}
											</Badge>
										</TableCell>
										<TableCell>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleViewDetails(location)}
											>
												View Details
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Location Details Dialog */}
			<Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					{selectedLocation && (
						<>
							<DialogHeader>
								<div className="flex items-center justify-between">
									<DialogTitle>
										{selectedLocation.code} - {selectedLocation.name}
									</DialogTitle>
									<Badge
										variant={
											selectedLocation.isActive ? "default" : "secondary"
										}
									>
										{selectedLocation.isActive ? "Active" : "Inactive"}
									</Badge>
								</div>
							</DialogHeader>

							<div className="space-y-6">
								{/* Basic Information */}
								<div className="grid grid-cols-2 gap-6">
									<div className="space-y-3">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Location Type
											</p>
											<Badge variant="outline" className="mt-1">
												{selectedLocation.locationType.replace(/_/g, " ")}
											</Badge>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Description
											</p>
											<p className="text-base">
												{selectedLocation.description || "N/A"}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Physical Location
											</p>
											<div className="text-sm">
												{selectedLocation.building && (
													<p>{selectedLocation.building}</p>
												)}
												{selectedLocation.floor && (
													<p>{selectedLocation.floor}</p>
												)}
												{selectedLocation.room && (
													<p>{selectedLocation.room}</p>
												)}
												{selectedLocation.physicalAddress && (
													<p className="text-muted-foreground mt-1">
														{selectedLocation.physicalAddress}
													</p>
												)}
											</div>
										</div>
									</div>
									<div className="space-y-3">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Capacity
											</p>
											<div className="text-sm space-y-1 mt-1">
												{selectedLocation.capacityVolume && (
													<p>Volume: {selectedLocation.capacityVolume} m³</p>
												)}
												{selectedLocation.capacityWeight && (
													<p>Weight: {selectedLocation.capacityWeight} kg</p>
												)}
												{selectedLocation.capacityUnits && (
													<p>Units: {selectedLocation.capacityUnits} pallets</p>
												)}
											</div>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Current Status
											</p>
											<div className="text-sm space-y-1 mt-1">
												<p>Items Stored: {selectedLocation.itemsStored}</p>
												<p>Occupancy: {selectedLocation.currentOccupancy}%</p>
											</div>
										</div>
									</div>
								</div>

								<Separator />

								{/* Climate Control */}
								<div>
									<h3 className="text-lg font-semibold mb-3">
										Climate Control
									</h3>
									<div className="grid grid-cols-2 gap-4">
										<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
											<div className="flex items-center gap-2 mb-2">
												<ThermometerIcon className="w-5 h-5 text-blue-600" />
												<h4 className="font-medium text-blue-900">
													Temperature
												</h4>
											</div>
											{selectedLocation.temperatureControlled ? (
												<div>
													<p className="text-sm text-blue-700">
														Controlled: {selectedLocation.temperatureMin}°C -{" "}
														{selectedLocation.temperatureMax}°C
													</p>
													<Badge
														variant="outline"
														className="bg-blue-100 text-blue-800 border-blue-300 mt-2"
													>
														Active Monitoring
													</Badge>
												</div>
											) : (
												<p className="text-sm text-muted-foreground">
													Not controlled
												</p>
											)}
										</div>

										<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
											<div className="flex items-center gap-2 mb-2">
												<DropletIcon className="w-5 h-5 text-purple-600" />
												<h4 className="font-medium text-purple-900">
													Humidity
												</h4>
											</div>
											{selectedLocation.humidityControlled ? (
												<div>
													<p className="text-sm text-purple-700">
														Controlled: {selectedLocation.humidityMin}% -{" "}
														{selectedLocation.humidityMax}%
													</p>
													<Badge
														variant="outline"
														className="bg-purple-100 text-purple-800 border-purple-300 mt-2"
													>
														Active Monitoring
													</Badge>
												</div>
											) : (
												<p className="text-sm text-muted-foreground">
													Not controlled
												</p>
											)}
										</div>
									</div>
								</div>

								<Separator />

								{/* Management & Access */}
								<div className="grid grid-cols-2 gap-6">
									<div className="space-y-3">
										<div>
											<div className="flex items-center gap-2 mb-2">
												<UserIcon className="w-4 h-4 text-muted-foreground" />
												<p className="text-sm font-medium text-muted-foreground">
													Manager
												</p>
											</div>
											<p className="text-base font-semibold">
												{selectedLocation.managerName}
											</p>
											{selectedLocation.contactPhone && (
												<p className="text-sm text-muted-foreground">
													{selectedLocation.contactPhone}
												</p>
											)}
											{selectedLocation.contactEmail && (
												<p className="text-sm text-muted-foreground">
													{selectedLocation.contactEmail}
												</p>
											)}
										</div>
										<div>
											<div className="flex items-center gap-2 mb-2">
												<ClockIcon className="w-4 h-4 text-muted-foreground" />
												<p className="text-sm font-medium text-muted-foreground">
													Operating Hours
												</p>
											</div>
											<p className="text-base">
												{selectedLocation.operatingHours || "N/A"}
											</p>
										</div>
									</div>
									<div className="space-y-3">
										<div>
											<div className="flex items-center gap-2 mb-2">
												<ShieldIcon className="w-4 h-4 text-muted-foreground" />
												<p className="text-sm font-medium text-muted-foreground">
													Access Restrictions
												</p>
											</div>
											<p className="text-sm bg-gray-50 p-3 rounded border">
												{selectedLocation.accessRestrictions ||
													"No restrictions"}
											</p>
										</div>
									</div>
								</div>

								{/* Special Instructions */}
								{selectedLocation.specialInstructions && (
									<div>
										<p className="text-sm font-medium text-muted-foreground mb-2">
											Special Instructions
										</p>
										<p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
											{selectedLocation.specialInstructions}
										</p>
									</div>
								)}

								<Separator />

								{/* Metadata */}
								<div className="text-xs text-muted-foreground">
									<p>
										Created by {selectedLocation.createdBy} on{" "}
										{new Date(selectedLocation.createdDate).toLocaleString()}
									</p>
									{selectedLocation.lastModifiedBy && (
										<p>
											Last modified by {selectedLocation.lastModifiedBy} on{" "}
											{new Date(
												selectedLocation.lastModifiedDate!,
											).toLocaleString()}
										</p>
									)}
								</div>

								{/* Actions */}
								<div className="flex justify-end gap-2 pt-4 border-t">
									<Button
										variant="outline"
										onClick={() => setIsDetailsOpen(false)}
									>
										Close
									</Button>
									<Button>Edit Location</Button>
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
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
