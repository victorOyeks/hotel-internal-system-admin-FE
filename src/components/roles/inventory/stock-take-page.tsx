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
import { Progress } from "@/components/ui/progress";
import {
	PlusIcon,
	SearchIcon,
	ClipboardListIcon,
	CheckCircleIcon,
	AlertCircleIcon,
	ClockIcon,
	FileTextIcon,
	CalendarIcon,
} from "lucide-react";

// Types based on FRD 3.10
type StockTakeType = "FULL" | "PARTIAL" | "CYCLE_COUNT";
type StockTakeStatus =
	| "SCHEDULED"
	| "IN_PROGRESS"
	| "PENDING_REVIEW"
	| "REVIEWED"
	| "COMPLETED";

type StockTakeItem = {
	id: string;
	productId: string;
	productName: string;
	productSku: string;
	systemQuantity: number;
	actualQuantity: number | null;
	unitCost: number;
	variance: number;
	variancePercentage: number;
	varianceValue: number;
	isCounted: boolean;
	countedBy?: string;
	countedDate?: string;
	requiresInvestigation: boolean;
	notes?: string;
	damagedItemsFound: boolean;
	expiredItemsFound: boolean;
};

type StockTake = {
	id: string;
	stockTakeNumber: string; // Format: ST-YYYYMMDD-XXXX
	locationId: string;
	locationName: string;
	scheduledDate: string;
	stockTakeType: StockTakeType;
	supervisorId: string;
	supervisorName: string;
	acceptableVariancePercentage: number;
	status: StockTakeStatus;
	items: StockTakeItem[];
	totalItems: number;
	countedItems: number;
	itemsWithVariance: number;
	totalSystemValue: number;
	totalActualValue: number;
	totalVarianceValue: number;
	completedDate?: string;
	reviewedBy?: string;
	reviewedDate?: string;
	adjustmentsCreated: number;
	adjustmentsPostedDate?: string;
	notes?: string;
	createdBy: string;
	createdDate: string;
};

// Mock data
const mockStockTakes: StockTake[] = [
	{
		id: "1",
		stockTakeNumber: "ST-20251123-001",
		locationId: "1",
		locationName: "Main Warehouse",
		scheduledDate: "2025-11-25",
		stockTakeType: "FULL",
		supervisorId: "1",
		supervisorName: "David Miller",
		acceptableVariancePercentage: 5,
		status: "SCHEDULED",
		items: [
			{
				id: "1",
				productId: "1",
				productName: "Kitchen Towels",
				productSku: "KT-001",
				systemQuantity: 100,
				actualQuantity: null,
				unitCost: 2.5,
				variance: 0,
				variancePercentage: 0,
				varianceValue: 0,
				isCounted: false,
				requiresInvestigation: false,
				damagedItemsFound: false,
				expiredItemsFound: false,
			},
			{
				id: "2",
				productId: "2",
				productName: "Laundry Detergent",
				productSku: "LD-001",
				systemQuantity: 50,
				actualQuantity: null,
				unitCost: 12.0,
				variance: 0,
				variancePercentage: 0,
				varianceValue: 0,
				isCounted: false,
				requiresInvestigation: false,
				damagedItemsFound: false,
				expiredItemsFound: false,
			},
			{
				id: "3",
				productId: "4",
				productName: "All-Purpose Cleaner",
				productSku: "CL-APC-001",
				systemQuantity: 80,
				actualQuantity: null,
				unitCost: 8.5,
				variance: 0,
				variancePercentage: 0,
				varianceValue: 0,
				isCounted: false,
				requiresInvestigation: false,
				damagedItemsFound: false,
				expiredItemsFound: false,
			},
		],
		totalItems: 3,
		countedItems: 0,
		itemsWithVariance: 0,
		totalSystemValue: 1130,
		totalActualValue: 0,
		totalVarianceValue: 0,
		adjustmentsCreated: 0,
		createdBy: "Sarah Johnson",
		createdDate: "2025-11-23T14:00:00",
	},
	{
		id: "2",
		stockTakeNumber: "ST-20251120-002",
		locationId: "2",
		locationName: "Cold Storage Unit 1",
		scheduledDate: "2025-11-20",
		stockTakeType: "CYCLE_COUNT",
		supervisorId: "1",
		supervisorName: "David Miller",
		acceptableVariancePercentage: 3,
		status: "IN_PROGRESS",
		items: [
			{
				id: "4",
				productId: "3",
				productName: "Fresh Vegetables",
				productSku: "VEG-MIX-001",
				systemQuantity: 50,
				actualQuantity: 47,
				unitCost: 3.5,
				variance: -3,
				variancePercentage: -6,
				varianceValue: -10.5,
				isCounted: true,
				countedBy: "Michael Chen",
				countedDate: "2025-11-20T10:30:00",
				requiresInvestigation: true,
				damagedItemsFound: false,
				expiredItemsFound: true,
				notes: "Found 3 expired units",
			},
			{
				id: "5",
				productId: "5",
				productName: "Dairy Products",
				productSku: "DAIRY-MIX-001",
				systemQuantity: 30,
				actualQuantity: 30,
				unitCost: 4.0,
				variance: 0,
				variancePercentage: 0,
				varianceValue: 0,
				isCounted: true,
				countedBy: "Michael Chen",
				countedDate: "2025-11-20T10:45:00",
				requiresInvestigation: false,
				damagedItemsFound: false,
				expiredItemsFound: false,
			},
		],
		totalItems: 2,
		countedItems: 2,
		itemsWithVariance: 1,
		totalSystemValue: 295,
		totalActualValue: 284.5,
		totalVarianceValue: -10.5,
		adjustmentsCreated: 0,
		completedDate: "2025-11-20T11:00:00",
		createdBy: "Sarah Johnson",
		createdDate: "2025-11-20T09:00:00",
	},
	{
		id: "3",
		stockTakeNumber: "ST-20251115-001",
		locationId: "1",
		locationName: "Main Warehouse",
		scheduledDate: "2025-11-15",
		stockTakeType: "FULL",
		supervisorId: "1",
		supervisorName: "David Miller",
		acceptableVariancePercentage: 5,
		status: "COMPLETED",
		items: [
			{
				id: "6",
				productId: "1",
				productName: "Kitchen Towels",
				productSku: "KT-001",
				systemQuantity: 95,
				actualQuantity: 98,
				unitCost: 2.5,
				variance: 3,
				variancePercentage: 3.16,
				varianceValue: 7.5,
				isCounted: true,
				countedBy: "Sarah Johnson",
				countedDate: "2025-11-15T11:00:00",
				requiresInvestigation: false,
				damagedItemsFound: false,
				expiredItemsFound: false,
			},
			{
				id: "7",
				productId: "2",
				productName: "Laundry Detergent",
				productSku: "LD-001",
				systemQuantity: 45,
				actualQuantity: 42,
				unitCost: 12.0,
				variance: -3,
				variancePercentage: -6.67,
				varianceValue: -36,
				isCounted: true,
				countedBy: "Sarah Johnson",
				countedDate: "2025-11-15T11:15:00",
				requiresInvestigation: true,
				damagedItemsFound: true,
				expiredItemsFound: false,
				notes: "Found 3 damaged bottles with leaks",
			},
		],
		totalItems: 2,
		countedItems: 2,
		itemsWithVariance: 2,
		totalSystemValue: 777.5,
		totalActualValue: 749,
		totalVarianceValue: -28.5,
		adjustmentsCreated: 2,
		completedDate: "2025-11-15T11:30:00",
		reviewedBy: "David Miller",
		reviewedDate: "2025-11-15T14:00:00",
		adjustmentsPostedDate: "2025-11-15T14:05:00",
		createdBy: "Sarah Johnson",
		createdDate: "2025-11-15T09:00:00",
	},
];

const mockStorageLocations = [
	{ id: "1", name: "Main Warehouse", code: "WH-MAIN" },
	{ id: "2", name: "Cold Storage Unit 1", code: "CS-01" },
	{ id: "3", name: "Dry Storage Room", code: "DS-01" },
	{ id: "4", name: "Bar Storage", code: "BAR-ST" },
];

export function StockTakePage() {
	const [stockTakes] = useState<StockTake[]>(mockStockTakes);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [selectedStockTake, setSelectedStockTake] = useState<StockTake | null>(
		null,
	);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [isCountingOpen, setIsCountingOpen] = useState(false);

	// Filter stock takes
	const filteredStockTakes = stockTakes.filter((st) => {
		const matchesSearch =
			st.stockTakeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
			st.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			st.supervisorName.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus = statusFilter === "all" || st.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	// Calculate stats
	const scheduledCount = stockTakes.filter(
		(st) => st.status === "SCHEDULED",
	).length;
	const inProgressCount = stockTakes.filter(
		(st) => st.status === "IN_PROGRESS",
	).length;
	const pendingReviewCount = stockTakes.filter(
		(st) => st.status === "PENDING_REVIEW",
	).length;
	const completedCount = stockTakes.filter(
		(st) => st.status === "COMPLETED",
	).length;

	const handleViewDetails = (stockTake: StockTake) => {
		setSelectedStockTake(stockTake);
		setIsDetailsOpen(true);
	};

	const handleStartCounting = (stockTake: StockTake) => {
		setSelectedStockTake(stockTake);
		setIsCountingOpen(true);
	};

	const handleCompleteStockTake = (stockTakeId: string) => {
		console.log("Completing stock take:", stockTakeId);
		// API call would go here
		alert("Stock take completed and ready for review!");
		setIsDetailsOpen(false);
	};

	const handlePostAdjustments = (stockTakeId: string) => {
		console.log("Posting adjustments for stock take:", stockTakeId);
		// API call would go here
		alert("Adjustments created and posted to stock successfully!");
		setIsDetailsOpen(false);
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Stock Take / Physical Count
					</h1>
					<p className="text-muted-foreground mt-1">
						Perform physical inventory counts and reconcile variances
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							Create Stock Take
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Create Stock Take</DialogTitle>
						</DialogHeader>
						<CreateStockTakeForm onClose={() => setIsCreateOpen(false)} />
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-blue-50 rounded-lg">
								<CalendarIcon className="w-6 h-6 text-blue-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-muted-foreground">
									Scheduled
								</p>
								<h3 className="text-2xl font-bold">{scheduledCount}</h3>
								<p className="text-xs text-muted-foreground mt-1">
									Upcoming counts
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-orange-50 rounded-lg">
								<ClipboardListIcon className="w-6 h-6 text-orange-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-muted-foreground">
									In Progress
								</p>
								<h3 className="text-2xl font-bold">{inProgressCount}</h3>
								<p className="text-xs text-muted-foreground mt-1">
									Counting active
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-purple-50 rounded-lg">
								<AlertCircleIcon className="w-6 h-6 text-purple-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-muted-foreground">
									Pending Review
								</p>
								<h3 className="text-2xl font-bold">{pendingReviewCount}</h3>
								<p className="text-xs text-muted-foreground mt-1">
									Awaiting approval
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-green-50 rounded-lg">
								<CheckCircleIcon className="w-6 h-6 text-green-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-muted-foreground">
									Completed
								</p>
								<h3 className="text-2xl font-bold">{completedCount}</h3>
								<p className="text-xs text-muted-foreground mt-1">
									Adjustments posted
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="relative">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
							<Input
								placeholder="Search by stock take number, location, or supervisor..."
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
								<SelectItem value="SCHEDULED">Scheduled</SelectItem>
								<SelectItem value="IN_PROGRESS">In Progress</SelectItem>
								<SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
								<SelectItem value="COMPLETED">Completed</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Stock Takes Table */}
			<Card>
				<CardHeader>
					<CardTitle>Stock Takes ({filteredStockTakes.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Stock Take Number</TableHead>
								<TableHead>Location</TableHead>
								<TableHead>Scheduled Date</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Supervisor</TableHead>
								<TableHead>Progress</TableHead>
								<TableHead>Variances</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredStockTakes.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={9}
										className="text-center text-muted-foreground py-8"
									>
										No stock takes found
									</TableCell>
								</TableRow>
							) : (
								filteredStockTakes.map((stockTake) => {
									const progress =
										(stockTake.countedItems / stockTake.totalItems) * 100;
									return (
										<TableRow key={stockTake.id}>
											<TableCell className="font-medium">
												{stockTake.stockTakeNumber}
											</TableCell>
											<TableCell>{stockTake.locationName}</TableCell>
											<TableCell>
												{new Date(stockTake.scheduledDate).toLocaleDateString()}
											</TableCell>
											<TableCell>
												<Badge variant="outline">
													{stockTake.stockTakeType}
												</Badge>
											</TableCell>
											<TableCell>{stockTake.supervisorName}</TableCell>
											<TableCell>
												<div className="space-y-1">
													<div className="flex justify-between text-xs">
														<span>
															{stockTake.countedItems}/{stockTake.totalItems}
														</span>
														<span>{progress.toFixed(0)}%</span>
													</div>
													<Progress value={progress} className="h-2" />
												</div>
											</TableCell>
											<TableCell>
												{stockTake.itemsWithVariance > 0 ? (
													<Badge
														variant="outline"
														className="bg-orange-50 text-orange-700 border-orange-200"
													>
														{stockTake.itemsWithVariance} items
													</Badge>
												) : (
													<span className="text-muted-foreground text-sm">
														None
													</span>
												)}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														stockTake.status === "COMPLETED"
															? "default"
															: stockTake.status === "IN_PROGRESS"
																? "secondary"
																: "outline"
													}
												>
													{stockTake.status.replace(/_/g, " ")}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex gap-2">
													{(stockTake.status === "SCHEDULED" ||
														stockTake.status === "IN_PROGRESS") && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleStartCounting(stockTake)}
														>
															Count
														</Button>
													)}
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleViewDetails(stockTake)}
													>
														View
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Stock Take Details Dialog */}
			<StockTakeDetailsDialog
				stockTake={selectedStockTake}
				open={isDetailsOpen}
				onOpenChange={setIsDetailsOpen}
				onComplete={handleCompleteStockTake}
				onPostAdjustments={handlePostAdjustments}
			/>

			{/* Counting Dialog */}
			<CountingDialog
				stockTake={selectedStockTake}
				open={isCountingOpen}
				onOpenChange={setIsCountingOpen}
			/>
		</div>
	);
}

// Create Stock Take Form Component
function CreateStockTakeForm({ onClose }: { onClose: () => void }) {
	const [formData, setFormData] = useState({
		locationId: "",
		scheduledDate: new Date().toISOString().split("T")[0],
		stockTakeType: "FULL" as StockTakeType,
		supervisorName: "",
		acceptableVariancePercentage: 5,
		notes: "",
	});

	const handleSubmit = () => {
		console.log("Creating stock take:", formData);
		// API call would go here
		alert(
			"Stock take created successfully! Items auto-generated from location.",
		);
		onClose();
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="location">Storage Location *</Label>
					<Select
						value={formData.locationId}
						onValueChange={(value) =>
							setFormData({ ...formData, locationId: value })
						}
					>
						<SelectTrigger id="location">
							<SelectValue placeholder="Select location" />
						</SelectTrigger>
						<SelectContent>
							{mockStorageLocations.map((location) => (
								<SelectItem key={location.id} value={location.id}>
									{location.name} ({location.code})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="scheduledDate">Scheduled Date *</Label>
					<Input
						id="scheduledDate"
						type="date"
						value={formData.scheduledDate}
						onChange={(e) =>
							setFormData({ ...formData, scheduledDate: e.target.value })
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="type">Stock Take Type *</Label>
					<Select
						value={formData.stockTakeType}
						onValueChange={(value) =>
							setFormData({
								...formData,
								stockTakeType: value as StockTakeType,
							})
						}
					>
						<SelectTrigger id="type">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="FULL">Full Count</SelectItem>
							<SelectItem value="PARTIAL">Partial Count</SelectItem>
							<SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="supervisor">Supervisor Name *</Label>
					<Input
						id="supervisor"
						value={formData.supervisorName}
						onChange={(e) =>
							setFormData({ ...formData, supervisorName: e.target.value })
						}
						placeholder="Enter supervisor name"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="variance">Acceptable Variance % *</Label>
					<Input
						id="variance"
						type="number"
						min="0"
						max="100"
						step="0.1"
						value={formData.acceptableVariancePercentage}
						onChange={(e) =>
							setFormData({
								...formData,
								acceptableVariancePercentage: parseFloat(e.target.value) || 0,
							})
						}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="notes">Notes</Label>
				<Textarea
					id="notes"
					value={formData.notes}
					onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
					placeholder="Additional notes or instructions..."
					rows={3}
				/>
			</div>

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!formData.locationId || !formData.supervisorName}
				>
					Create Stock Take
				</Button>
			</div>
		</div>
	);
}

// Stock Take Details Dialog
function StockTakeDetailsDialog({
	stockTake,
	open,
	onOpenChange,
	onComplete,
	onPostAdjustments,
}: {
	stockTake: StockTake | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onComplete: (id: string) => void;
	onPostAdjustments: (id: string) => void;
}) {
	if (!stockTake) return null;

	const progress = (stockTake.countedItems / stockTake.totalItems) * 100;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>Stock Take - {stockTake.stockTakeNumber}</DialogTitle>
						<Badge
							variant={
								stockTake.status === "COMPLETED"
									? "default"
									: stockTake.status === "IN_PROGRESS"
										? "secondary"
										: "outline"
							}
						>
							{stockTake.status.replace(/_/g, " ")}
						</Badge>
					</div>
				</DialogHeader>

				<div className="space-y-6">
					{/* Header Information */}
					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-3">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Location
								</p>
								<p className="text-base font-semibold">
									{stockTake.locationName}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Scheduled Date
								</p>
								<p className="text-base">
									{new Date(stockTake.scheduledDate).toLocaleDateString()}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Stock Take Type
								</p>
								<Badge variant="outline">{stockTake.stockTakeType}</Badge>
							</div>
						</div>
						<div className="space-y-3">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Supervisor
								</p>
								<p className="text-base">{stockTake.supervisorName}</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Acceptable Variance
								</p>
								<p className="text-base">
									±{stockTake.acceptableVariancePercentage}%
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Created By
								</p>
								<p className="text-base">{stockTake.createdBy}</p>
								<p className="text-xs text-muted-foreground">
									{new Date(stockTake.createdDate).toLocaleString()}
								</p>
							</div>
						</div>
					</div>

					<Separator />

					{/* Progress */}
					<div className="bg-gray-50 rounded-lg p-4">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-semibold">Counting Progress</h3>
							<span className="text-sm font-medium">
								{stockTake.countedItems} / {stockTake.totalItems} items
							</span>
						</div>
						<Progress value={progress} className="h-3" />
						<p className="text-xs text-muted-foreground mt-1">
							{progress.toFixed(1)}% complete
						</p>
					</div>

					{/* Items Table */}
					<div>
						<h3 className="text-lg font-semibold mb-3">Count Items</h3>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Product</TableHead>
									<TableHead className="text-center">System Qty</TableHead>
									<TableHead className="text-center">Actual Qty</TableHead>
									<TableHead className="text-center">Variance</TableHead>
									<TableHead className="text-right">Variance Value</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{stockTake.items.map((item) => (
									<TableRow key={item.id}>
										<TableCell>
											<div>
												<p className="font-medium">{item.productName}</p>
												<p className="text-xs text-muted-foreground">
													{item.productSku}
												</p>
												{item.notes && (
													<p className="text-xs text-orange-600 mt-1">
														{item.notes}
													</p>
												)}
											</div>
										</TableCell>
										<TableCell className="text-center font-medium">
											{item.systemQuantity}
										</TableCell>
										<TableCell className="text-center">
											{item.actualQuantity !== null ? (
												<span className="font-medium">
													{item.actualQuantity}
												</span>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</TableCell>
										<TableCell className="text-center">
											{item.variance !== 0 ? (
												<span
													className={`font-medium ${
														item.variance > 0
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{item.variance > 0 ? "+" : ""}
													{item.variance} ({item.variancePercentage.toFixed(1)}
													%)
												</span>
											) : item.isCounted ? (
												<span className="text-muted-foreground">
													No variance
												</span>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</TableCell>
										<TableCell className="text-right">
											{item.varianceValue !== 0 ? (
												<span
													className={`font-medium ${
														item.varianceValue > 0
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													${Math.abs(item.varianceValue).toFixed(2)}
												</span>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</TableCell>
										<TableCell>
											{item.isCounted ? (
												<div className="space-y-1">
													<Badge
														variant="outline"
														className="bg-green-50 text-green-700 border-green-200"
													>
														<CheckCircleIcon className="w-3 h-3 mr-1" />
														Counted
													</Badge>
													{item.requiresInvestigation && (
														<Badge
															variant="outline"
															className="bg-orange-50 text-orange-700 border-orange-200"
														>
															Requires Review
														</Badge>
													)}
												</div>
											) : (
												<Badge variant="outline">
													<ClockIcon className="w-3 h-3 mr-1" />
													Pending
												</Badge>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Variance Summary */}
					{stockTake.itemsWithVariance > 0 && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-blue-900 mb-3">
								Variance Summary
							</h3>
							<div className="grid grid-cols-3 gap-4">
								<div>
									<p className="text-xs text-blue-700">Items with Variance</p>
									<p className="text-xl font-bold text-blue-900">
										{stockTake.itemsWithVariance}
									</p>
								</div>
								<div>
									<p className="text-xs text-blue-700">System Value</p>
									<p className="text-xl font-bold text-blue-900">
										${stockTake.totalSystemValue.toLocaleString()}
									</p>
								</div>
								<div>
									<p className="text-xs text-blue-700">Total Variance</p>
									<p
										className={`text-xl font-bold ${
											stockTake.totalVarianceValue >= 0
												? "text-green-900"
												: "text-red-900"
										}`}
									>
										${Math.abs(stockTake.totalVarianceValue).toFixed(2)}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Completion/Review Information */}
					{stockTake.status === "COMPLETED" && stockTake.reviewedBy && (
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<p className="text-sm text-green-900">
								<CheckCircleIcon className="w-4 h-4 inline mr-2" />
								Completed and adjustments posted by {stockTake.reviewedBy} on{" "}
								{new Date(stockTake.adjustmentsPostedDate!).toLocaleString()}
							</p>
							<p className="text-sm text-green-700 mt-1">
								{stockTake.adjustmentsCreated} stock adjustments created
							</p>
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-4 border-t">
						{stockTake.status === "IN_PROGRESS" &&
							stockTake.countedItems === stockTake.totalItems && (
								<Button onClick={() => onComplete(stockTake.id)}>
									<FileTextIcon className="w-4 h-4 mr-2" />
									Complete Stock Take
								</Button>
							)}
						{stockTake.status === "PENDING_REVIEW" && (
							<Button onClick={() => onPostAdjustments(stockTake.id)}>
								<CheckCircleIcon className="w-4 h-4 mr-2" />
								Post Adjustments
							</Button>
						)}
						{stockTake.status === "COMPLETED" && (
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								Close
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Counting Dialog Component
function CountingDialog({
	stockTake,
	open,
	onOpenChange,
}: {
	stockTake: StockTake | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [currentItemIndex, setCurrentItemIndex] = useState(0);
	const [actualQuantity, setActualQuantity] = useState<number | "">("");
	const [notes, setNotes] = useState("");

	if (!stockTake) return null;

	const currentItem = stockTake.items[currentItemIndex];
	const isLastItem = currentItemIndex === stockTake.items.length - 1;

	const handleRecordCount = () => {
		if (actualQuantity === "") return;

		console.log("Recording count:", {
			itemId: currentItem.id,
			actualQuantity,
			notes,
		});

		// API call would go here

		if (isLastItem) {
			alert("All items counted!");
			onOpenChange(false);
		} else {
			setCurrentItemIndex(currentItemIndex + 1);
			setActualQuantity("");
			setNotes("");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						Record Count - Item {currentItemIndex + 1} of{" "}
						{stockTake.items.length}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Progress */}
					<Progress
						value={((currentItemIndex + 1) / stockTake.items.length) * 100}
					/>

					{/* Product Info */}
					<div className="bg-gray-50 rounded-lg p-4">
						<h3 className="font-semibold text-lg">{currentItem.productName}</h3>
						<p className="text-sm text-muted-foreground">
							{currentItem.productSku}
						</p>
						<div className="mt-3 grid grid-cols-2 gap-4">
							<div>
								<p className="text-xs text-muted-foreground">System Quantity</p>
								<p className="text-2xl font-bold">
									{currentItem.systemQuantity}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Unit Cost</p>
								<p className="text-2xl font-bold">
									${currentItem.unitCost.toFixed(2)}
								</p>
							</div>
						</div>
					</div>

					{/* Actual Count Input */}
					<div className="space-y-2">
						<Label htmlFor="actualQty">Actual Quantity Counted *</Label>
						<Input
							id="actualQty"
							type="number"
							min="0"
							value={actualQuantity}
							onChange={(e) =>
								setActualQuantity(
									e.target.value === "" ? "" : parseFloat(e.target.value),
								)
							}
							placeholder="Enter counted quantity"
							className="text-lg"
							autoFocus
						/>
					</div>

					{/* Variance Preview */}
					{actualQuantity !== "" && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm font-medium text-blue-900 mb-2">Variance</p>
							<div className="flex items-center justify-between">
								<span
									className={`text-3xl font-bold ${
										actualQuantity - currentItem.systemQuantity > 0
											? "text-green-600"
											: actualQuantity - currentItem.systemQuantity < 0
												? "text-red-600"
												: "text-gray-600"
									}`}
								>
									{actualQuantity - currentItem.systemQuantity > 0 ? "+" : ""}
									{actualQuantity - currentItem.systemQuantity}
								</span>
								<div className="text-right">
									<p className="text-xs text-blue-700">Variance %</p>
									<p className="text-lg font-bold text-blue-900">
										{(
											((actualQuantity - currentItem.systemQuantity) /
												currentItem.systemQuantity) *
											100
										).toFixed(1)}
										%
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Notes */}
					<div className="space-y-2">
						<Label htmlFor="notes">Notes (optional)</Label>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Any observations or issues found..."
							rows={3}
						/>
					</div>

					{/* Actions */}
					<div className="flex justify-between pt-4 border-t">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Save & Exit
						</Button>
						<div className="flex gap-2">
							{currentItemIndex > 0 && (
								<Button
									variant="outline"
									onClick={() => {
										setCurrentItemIndex(currentItemIndex - 1);
										setActualQuantity("");
										setNotes("");
									}}
								>
									Previous
								</Button>
							)}
							<Button
								onClick={handleRecordCount}
								disabled={actualQuantity === ""}
							>
								{isLastItem ? "Complete" : "Next Item"}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
