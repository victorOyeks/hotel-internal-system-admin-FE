import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	MapPinIcon,
	ThermometerIcon,
	DropletIcon,
	UserIcon,
	ClockIcon,
	ShieldIcon,
	BoxIcon,
	BuildingIcon,
	PhoneIcon,
	AlertCircleIcon,
} from "lucide-react";
import type { PropsWithChildren } from "react";
import type { StorageLocationResponse } from "@/lib/fetch";

interface LocationDetailsProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	location: StorageLocationResponse | null;
}

export function LocationDetails({
	open,
	onOpenChange,
	location,
	children,
}: PropsWithChildren<LocationDetailsProps>) {
	if (!location) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
				<DialogHeader className="p-6 pb-4 border-b shrink-0">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="space-y-1">
							<DialogTitle className="text-2xl font-medium flex items-center gap-3">
								{location.locationName}
								<Badge
									variant={location.active ? "default" : "secondary"}
									className="text-sm font-normal"
								>
									{location.active ? "Active" : "Inactive"}
								</Badge>
							</DialogTitle>
							<p className="text-sm text-muted-foreground flex items-center gap-2">
								<MapPinIcon className="w-4 h-4" />
								{location.locationCode}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<DialogClose asChild>
								<Button variant="outline">Close</Button>
							</DialogClose>
							<Button>Edit Location</Button>
						</div>
					</div>
				</DialogHeader>

				<ScrollArea className="flex-1">
					<div className="p-6 space-y-8">
						{/* Summary Section */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
							<div>
								<p className="text-sm text-muted-foreground mb-1">Type</p>
								<div className="font-medium">
									{location.locationType.replace(/_/g, " ")}
								</div>
							</div>
							<div>
								<p className="text-sm text-muted-foreground mb-1">Capacity</p>
								<div className="font-medium">
									{location.totalCapacity
										? `${Intl.NumberFormat("en-US").format(location.totalCapacity)} ${location.capacityUnit}`
										: "N/A"}
								</div>
							</div>
							<div>
								<p className="text-sm text-muted-foreground mb-1">Occupancy</p>
								<div className="flex items-baseline gap-2">
									<span className="text-2xl font-medium">
										{
											Intl.NumberFormat("en-US", {
												style: "percent",
												maximumFractionDigits: 1,
											}).format(
												location.totalCapacity > 0
													? location.totalProductsStored / location.totalCapacity
													: 0
											)
										}
									</span>
								</div>
								<div className="w-full bg-secondary rounded-full h-1.5 mt-2">
									<div
										className={`h-1.5 rounded-full ${location.totalCapacity > 0 && (location.totalProductsStored / location.totalCapacity) > 0.8
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
							<div>
								<p className="text-sm text-muted-foreground mb-1">Manager</p>
								<div className="font-medium truncate">
									{location.contactPerson}
								</div>
								<p className="text-xs text-muted-foreground truncate">
									{location.contactPhone}
								</p>
							</div>
						</div>

						<Separator />

						<Tabs defaultValue="overview" className="w-full">
							<TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
								<TabsTrigger
									value="overview"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
								>
									Overview
								</TabsTrigger>
								<TabsTrigger
									value="climate"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
								>
									Climate Control
								</TabsTrigger>
								<TabsTrigger
									value="management"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
								>
									Management
								</TabsTrigger>
							</TabsList>

							<TabsContent value="overview" className="mt-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-medium flex items-center gap-2 mb-4">
												<BuildingIcon className="w-5 h-5" /> Physical Location
											</h3>
											<div className="grid grid-cols-2 gap-y-4 gap-x-8">
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Building
													</p>
													<p>{location.building || "N/A"}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Floor
													</p>
													<p>{location.floor || "N/A"}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Room
													</p>
													<p>{location.room || "N/A"}</p>
												</div>
												<div className="col-span-2">
													<p className="text-sm font-medium text-muted-foreground">
														Address
													</p>
													<p>{location.physicalAddress || "N/A"}</p>
												</div>
											</div>
										</div>

										<Separator />

										<div>
											<h3 className="text-lg font-medium flex items-center gap-2 mb-4">
												<BoxIcon className="w-5 h-5" /> Storage Details
											</h3>
											<div className="space-y-4">
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Description
													</p>
													<p className="text-sm mt-1">
														{location.description || "No description provided."}
													</p>
												</div>
												{location.specialInstructions && (
													<div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
														<h4 className="text-sm font-medium text-yellow-800 flex items-center gap-2 mb-2">
															<AlertCircleIcon className="w-4 h-4" /> Special
															Instructions
														</h4>
														<p className="text-sm text-yellow-700">
															{location.specialInstructions}
														</p>
													</div>
												)}
											</div>
										</div>
									</div>

									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-medium flex items-center gap-2 mb-4">
												<ClockIcon className="w-5 h-5" /> Operations
											</h3>
											<div className="space-y-4">
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Operating Hours
													</p>
													<p>{location.operatingHours || "N/A"}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Items Stored
													</p>
													<p className="text-2xl font-medium">
														{location.totalProductsStored}
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="climate" className="mt-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
										<div className="flex items-center gap-3 mb-4">
											<div className="p-2 bg-blue-100 rounded-full">
												<ThermometerIcon className="w-6 h-6 text-blue-600" />
											</div>
											<div>
												<h4 className="font-medium text-blue-900">
													Temperature
												</h4>
												<p className="text-sm text-blue-700">
													{location.temperatureControlled
														? "Active Monitoring"
														: "Not Controlled"}
												</p>
											</div>
										</div>
										{location.temperatureControlled ? (
											<div className="space-y-2">
												<div className="flex justify-between text-sm">
													<span className="text-blue-700">Min Temp</span>
													<span className="font-medium text-blue-900">
														{location.minTemperature}°C
													</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-blue-700">Max Temp</span>
													<span className="font-medium text-blue-900">
														{location.maxTemperature}°C
													</span>
												</div>
											</div>
										) : (
											<p className="text-sm text-blue-600/80">
												This location does not have active temperature control.
											</p>
										)}
									</div>

									<div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
										<div className="flex items-center gap-3 mb-4">
											<div className="p-2 bg-purple-100 rounded-full">
												<DropletIcon className="w-6 h-6 text-purple-600" />
											</div>
											<div>
												<h4 className="font-medium text-purple-900">
													Humidity
												</h4>
												<p className="text-sm text-purple-700">
													{location.humidityControlled
														? "Active Monitoring"
														: "Not Controlled"}
												</p>
											</div>
										</div>
										{location.humidityControlled ? (
											<div className="space-y-2">
												<div className="flex justify-between text-sm">
													<span className="text-purple-700">Min Humidity</span>
													<span className="font-medium text-purple-900">
														{location.minHumidity}
													</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-purple-700">Max Humidity</span>
													<span className="font-medium text-purple-900">
														{location.maxHumidity}
													</span>
												</div>
											</div>
										) : (
											<p className="text-sm text-purple-600/80">
												This location does not have active humidity control.
											</p>
										)}
									</div>
								</div>
							</TabsContent>

							<TabsContent value="management" className="mt-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									<div>
										<h3 className="text-lg font-medium flex items-center gap-2 mb-4">
											<UserIcon className="w-5 h-5" /> Contact Information
										</h3>
										<div className="space-y-4">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
													<span className="font-medium text-lg">
														{location.contactPerson?.charAt(0)}
													</span>
												</div>
												<div>
													<p className="font-medium">{location.contactPerson}</p>
													<p className="text-sm text-muted-foreground">
														Location Manager
													</p>
												</div>
											</div>
											<div className="space-y-2 pl-13">
												{location.contactPhone && (
													<div className="flex items-center gap-2 text-sm">
														<PhoneIcon className="w-4 h-4 text-muted-foreground" />
														<span>{location.contactPhone}</span>
													</div>
												)}
											</div>
										</div>
									</div>

									<div>
										<h3 className="text-lg font-medium flex items-center gap-2 mb-4">
											<ShieldIcon className="w-5 h-5" /> Access Control
										</h3>
										<div className="bg-gray-50 p-4 rounded-md border">
											<p className="text-sm font-medium text-gray-900 mb-2">
												Restrictions
											</p>
											<p className="text-sm text-gray-600">
												{location.accessRestrictions ||
													"No specific access restrictions."}
											</p>
										</div>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
