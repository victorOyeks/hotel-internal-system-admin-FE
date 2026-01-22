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
	SearchIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	AlertCircleIcon,
	CheckCircleIcon,
	ClockIcon,
	XCircleIcon,
	FileTextIcon,
} from "lucide-react";

// Types based on FRD 3.9
type AdjustmentType = "INCREASE" | "DECREASE";
type AdjustmentReason =
	| "DAMAGE"
	| "THEFT"
	| "EXPIRY"
	| "STOCK_COUNT_VARIANCE"
	| "BREAKAGE"
	| "SPOILAGE"
	| "LOSS"
	| "FOUND"
	| "OTHER";
type AdjustmentStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "POSTED";

type StockAdjustment = {
	id: string;
	adjustmentNumber: string; // Format: ADJ-YYYYMMDD-XXXX
	productId: string;
	productName: string;
	productSku: string;
	locationId: string;
	locationName: string;
	adjustmentDate: string;
	reason: AdjustmentReason;
	adjustmentType: AdjustmentType;
	adjustmentQuantity: number;
	quantityBefore: number;
	quantityAfter: number;
	unitCost: number;
	costImpact: number;
	requiresApproval: boolean;
	status: AdjustmentStatus;
	isPosted: boolean;
	notes?: string;
	insuranceClaim: boolean;
	claimNumber?: string;
	claimAmount?: number;
	createdBy: string;
	createdDate: string;
	approvedBy?: string;
	approvedDate?: string;
	rejectedBy?: string;
	rejectedDate?: string;
	rejectionReason?: string;
	postedBy?: string;
	postedDate?: string;
};

// Mock data
const mockAdjustments: StockAdjustment[] = [
	{
		id: "1",
		adjustmentNumber: "ADJ-20251123-001",
		productId: "1",
		productName: "Kitchen Towels",
		productSku: "KT-001",
		locationId: "1",
		locationName: "Main Warehouse",
		adjustmentDate: "2025-11-23",
		reason: "DAMAGE",
		adjustmentType: "DECREASE",
		adjustmentQuantity: 25,
		quantityBefore: 100,
		quantityAfter: 75,
		unitCost: 2.5,
		costImpact: 62.5,
		requiresApproval: true,
		status: "PENDING_APPROVAL",
		isPosted: false,
		notes: "Water damage from roof leak in storage area",
		insuranceClaim: true,
		claimNumber: "INS-2025-1234",
		claimAmount: 62.5,
		createdBy: "Sarah Johnson",
		createdDate: "2025-11-23T10:30:00",
	},
	{
		id: "2",
		adjustmentNumber: "ADJ-20251122-005",
		productId: "2",
		productName: "Laundry Detergent",
		productSku: "LD-001",
		locationId: "1",
		locationName: "Main Warehouse",
		adjustmentDate: "2025-11-22",
		reason: "STOCK_COUNT_VARIANCE",
		adjustmentType: "INCREASE",
		adjustmentQuantity: 5,
		quantityBefore: 45,
		quantityAfter: 50,
		unitCost: 12.0,
		costImpact: 60.0,
		requiresApproval: false,
		status: "POSTED",
		isPosted: true,
		notes: "Found extra units during stock take",
		insuranceClaim: false,
		createdBy: "Michael Chen",
		createdDate: "2025-11-22T15:00:00",
		postedBy: "Michael Chen",
		postedDate: "2025-11-22T15:05:00",
	},
	{
		id: "3",
		adjustmentNumber: "ADJ-20251121-003",
		productId: "3",
		productName: "Fresh Vegetables",
		productSku: "VEG-MIX-001",
		locationId: "2",
		locationName: "Cold Storage Unit 1",
		adjustmentDate: "2025-11-21",
		reason: "EXPIRY",
		adjustmentType: "DECREASE",
		adjustmentQuantity: 15,
		quantityBefore: 50,
		quantityAfter: 35,
		unitCost: 3.5,
		costImpact: 52.5,
		requiresApproval: true,
		status: "APPROVED",
		isPosted: false,
		notes: "Expired produce discarded as per food safety protocols",
		insuranceClaim: false,
		createdBy: "Sarah Johnson",
		createdDate: "2025-11-21T09:00:00",
		approvedBy: "David Miller",
		approvedDate: "2025-11-21T11:30:00",
	},
	{
		id: "4",
		adjustmentNumber: "ADJ-20251120-002",
		productId: "4",
		productName: "All-Purpose Cleaner",
		productSku: "CL-APC-001",
		locationId: "1",
		locationName: "Main Warehouse",
		adjustmentDate: "2025-11-20",
		reason: "THEFT",
		adjustmentType: "DECREASE",
		adjustmentQuantity: 10,
		quantityBefore: 80,
		quantityAfter: 70,
		unitCost: 8.5,
		costImpact: 85.0,
		requiresApproval: true,
		status: "REJECTED",
		isPosted: false,
		notes: "Suspected theft during inventory check",
		insuranceClaim: true,
		claimNumber: "INS-2025-1235",
		claimAmount: 85.0,
		createdBy: "Michael Chen",
		createdDate: "2025-11-20T14:00:00",
		rejectedBy: "David Miller",
		rejectedDate: "2025-11-20T16:00:00",
		rejectionReason:
			"Insufficient evidence. Requires investigation before adjustment.",
	},
];

const mockProducts = [
	{
		id: "1",
		name: "Kitchen Towels",
		sku: "KT-001",
		currentStock: 100,
		unitCost: 2.5,
	},
	{
		id: "2",
		name: "Laundry Detergent",
		sku: "LD-001",
		currentStock: 50,
		unitCost: 12.0,
	},
	{
		id: "3",
		name: "Fresh Vegetables",
		sku: "VEG-MIX-001",
		currentStock: 50,
		unitCost: 3.5,
	},
	{
		id: "4",
		name: "All-Purpose Cleaner",
		sku: "CL-APC-001",
		currentStock: 80,
		unitCost: 8.5,
	},
	{
		id: "5",
		name: "Hand Soap",
		sku: "HS-001",
		currentStock: 40,
		unitCost: 5.0,
	},
];

const mockStorageLocations = [
	{ id: "1", name: "Main Warehouse", code: "WH-MAIN" },
	{ id: "2", name: "Cold Storage Unit 1", code: "CS-01" },
	{ id: "3", name: "Dry Storage Room", code: "DS-01" },
	{ id: "4", name: "Bar Storage", code: "BAR-ST" },
];

export function StockAdjustmentPage() {
	const [adjustments] = useState<StockAdjustment[]>(mockAdjustments);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [selectedAdjustment, setSelectedAdjustment] =
		useState<StockAdjustment | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	// Filter adjustments
	const filteredAdjustments = adjustments.filter((adj) => {
		const matchesSearch =
			adj.adjustmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
			adj.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			adj.productSku.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus = statusFilter === "all" || adj.status === statusFilter;
		const matchesType =
			typeFilter === "all" || adj.adjustmentType === typeFilter;

		return matchesSearch && matchesStatus && matchesType;
	});

	// Calculate stats
	const pendingApprovalCount = adjustments.filter(
		(a) => a.status === "PENDING_APPROVAL",
	).length;
	const pendingApprovalValue = adjustments
		.filter((a) => a.status === "PENDING_APPROVAL")
		.reduce((sum, a) => sum + Math.abs(a.costImpact), 0);
	const approvedCount = adjustments.filter(
		(a) => a.status === "APPROVED" && !a.isPosted,
	).length;
	const postedCount = adjustments.filter((a) => a.isPosted).length;

	const handleViewDetails = (adjustment: StockAdjustment) => {
		setSelectedAdjustment(adjustment);
		setIsDetailsOpen(true);
	};

	const handleApprove = (adjustmentId: string) => {
		console.log("Approving adjustment:", adjustmentId);
		// API call would go here
		alert("Adjustment approved successfully!");
		setIsDetailsOpen(false);
	};

	const handleReject = (adjustmentId: string, reason: string) => {
		console.log("Rejecting adjustment:", adjustmentId, reason);
		// API call would go here
		alert("Adjustment rejected!");
		setIsDetailsOpen(false);
	};

	const handlePost = (adjustmentId: string) => {
		console.log("Posting adjustment:", adjustmentId);
		// API call would go here
		alert("Adjustment posted to stock successfully!");
		setIsDetailsOpen(false);
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Stock Adjustments
					</h1>
					<p className="text-muted-foreground mt-1">
						Manage stock corrections for damages, theft, and variances
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							Create Adjustment
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create Stock Adjustment</DialogTitle>
						</DialogHeader>
						<CreateAdjustmentForm onClose={() => setIsCreateOpen(false)} />
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-orange-50 rounded-lg">
								<ClockIcon className="w-6 h-6 text-orange-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-muted-foreground">
									Pending Approval
								</p>
								<h3 className="text-2xl font-bold">{pendingApprovalCount}</h3>
								<p className="text-xs text-muted-foreground mt-1">
									${pendingApprovalValue.toLocaleString()} impact
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
									Approved
								</p>
								<h3 className="text-2xl font-bold">{approvedCount}</h3>
								<p className="text-xs text-muted-foreground mt-1">
									Ready to post
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-blue-50 rounded-lg">
								<FileTextIcon className="w-6 h-6 text-blue-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-muted-foreground">
									Posted
								</p>
								<h3 className="text-2xl font-bold">{postedCount}</h3>
								<p className="text-xs text-muted-foreground mt-1">
									Stock updated
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
									Total Adjustments
								</p>
								<h3 className="text-2xl font-bold">{adjustments.length}</h3>
								<p className="text-xs text-muted-foreground mt-1">All time</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="grid gap-4 md:grid-cols-3">
						<div>
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search by adjustment number or product..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger>
								<SelectValue placeholder="All statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								<SelectItem value="PENDING_APPROVAL">
									Pending Approval
								</SelectItem>
								<SelectItem value="APPROVED">Approved</SelectItem>
								<SelectItem value="REJECTED">Rejected</SelectItem>
								<SelectItem value="POSTED">Posted</SelectItem>
							</SelectContent>
						</Select>
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger>
								<SelectValue placeholder="All types" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="INCREASE">Increase</SelectItem>
								<SelectItem value="DECREASE">Decrease</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Adjustments Table */}
			<Card>
				<CardHeader>
					<CardTitle>
						Stock Adjustments ({filteredAdjustments.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Adjustment Number</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Product</TableHead>
								<TableHead>Location</TableHead>
								<TableHead>Reason</TableHead>
								<TableHead>Type</TableHead>
								<TableHead className="text-right">Quantity</TableHead>
								<TableHead className="text-right">Cost Impact</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredAdjustments.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={10}
										className="text-center text-muted-foreground py-8"
									>
										No adjustments found
									</TableCell>
								</TableRow>
							) : (
								filteredAdjustments.map((adjustment) => (
									<TableRow key={adjustment.id}>
										<TableCell className="font-medium">
											{adjustment.adjustmentNumber}
										</TableCell>
										<TableCell>
											{new Date(adjustment.adjustmentDate).toLocaleDateString()}
										</TableCell>
										<TableCell>
											<div>
												<p className="font-medium">{adjustment.productName}</p>
												<p className="text-xs text-muted-foreground">
													{adjustment.productSku}
												</p>
											</div>
										</TableCell>
										<TableCell>{adjustment.locationName}</TableCell>
										<TableCell>
											<Badge variant="outline">
												{adjustment.reason.replace(/_/g, " ")}
											</Badge>
										</TableCell>
										<TableCell>
											{adjustment.adjustmentType === "INCREASE" ? (
												<Badge
													variant="outline"
													className="bg-green-50 text-green-700 border-green-200"
												>
													<TrendingUpIcon className="w-3 h-3 mr-1" />
													Increase
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="bg-red-50 text-red-700 border-red-200"
												>
													<TrendingDownIcon className="w-3 h-3 mr-1" />
													Decrease
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-right font-medium">
											{adjustment.adjustmentQuantity}
										</TableCell>
										<TableCell className="text-right font-medium">
											${Math.abs(adjustment.costImpact).toLocaleString()}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													adjustment.status === "POSTED"
														? "default"
														: adjustment.status === "APPROVED"
															? "secondary"
															: adjustment.status === "REJECTED"
																? "destructive"
																: "outline"
												}
											>
												{adjustment.status.replace(/_/g, " ")}
											</Badge>
										</TableCell>
										<TableCell>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleViewDetails(adjustment)}
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

			{/* Adjustment Details Dialog */}
			<Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					{selectedAdjustment && (
						<>
							<DialogHeader>
								<div className="flex items-center justify-between">
									<DialogTitle>
										Adjustment Details - {selectedAdjustment.adjustmentNumber}
									</DialogTitle>
									<Badge
										variant={
											selectedAdjustment.status === "POSTED"
												? "default"
												: selectedAdjustment.status === "APPROVED"
													? "secondary"
													: selectedAdjustment.status === "REJECTED"
														? "destructive"
														: "outline"
										}
									>
										{selectedAdjustment.status.replace(/_/g, " ")}
									</Badge>
								</div>
							</DialogHeader>

							<div className="space-y-6">
								{/* Adjustment Information */}
								<div className="grid grid-cols-2 gap-6">
									<div className="space-y-3">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Product
											</p>
											<p className="text-base font-semibold">
												{selectedAdjustment.productName}
											</p>
											<p className="text-xs text-muted-foreground">
												{selectedAdjustment.productSku}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Storage Location
											</p>
											<p className="text-base">
												{selectedAdjustment.locationName}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Adjustment Date
											</p>
											<p className="text-base">
												{new Date(
													selectedAdjustment.adjustmentDate,
												).toLocaleDateString()}
											</p>
										</div>
									</div>
									<div className="space-y-3">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Reason
											</p>
											<Badge variant="outline" className="mt-1">
												{selectedAdjustment.reason.replace(/_/g, " ")}
											</Badge>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Adjustment Type
											</p>
											{selectedAdjustment.adjustmentType === "INCREASE" ? (
												<Badge
													variant="outline"
													className="bg-green-50 text-green-700 border-green-200 mt-1"
												>
													<TrendingUpIcon className="w-3 h-3 mr-1" />
													Increase
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="bg-red-50 text-red-700 border-red-200 mt-1"
												>
													<TrendingDownIcon className="w-3 h-3 mr-1" />
													Decrease
												</Badge>
											)}
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Created By
											</p>
											<p className="text-base">
												{selectedAdjustment.createdBy}
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(
													selectedAdjustment.createdDate,
												).toLocaleString()}
											</p>
										</div>
									</div>
								</div>

								<Separator />

								{/* Stock Impact */}
								<div className="bg-gray-50 rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-4">Stock Impact</h3>
									<div className="grid grid-cols-3 gap-4">
										<div className="text-center">
											<p className="text-sm text-muted-foreground mb-1">
												Quantity Before
											</p>
											<p className="text-2xl font-bold">
												{selectedAdjustment.quantityBefore}
											</p>
										</div>
										<div className="text-center">
											<p className="text-sm text-muted-foreground mb-1">
												Adjustment
											</p>
											<p
												className={`text-2xl font-bold ${
													selectedAdjustment.adjustmentType === "INCREASE"
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{selectedAdjustment.adjustmentType === "INCREASE"
													? "+"
													: "-"}
												{selectedAdjustment.adjustmentQuantity}
											</p>
										</div>
										<div className="text-center">
											<p className="text-sm text-muted-foreground mb-1">
												Quantity After
											</p>
											<p className="text-2xl font-bold">
												{selectedAdjustment.quantityAfter}
											</p>
										</div>
									</div>
								</div>

								{/* Cost Impact */}
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-blue-900">
												Cost Impact
											</p>
											<p className="text-xs text-blue-700">
												Unit Cost: ${selectedAdjustment.unitCost.toFixed(2)}
											</p>
										</div>
										<p className="text-2xl font-bold text-blue-900">
											$
											{Math.abs(selectedAdjustment.costImpact).toLocaleString()}
										</p>
									</div>
								</div>

								{/* Notes */}
								{selectedAdjustment.notes && (
									<div>
										<p className="text-sm font-medium text-muted-foreground mb-2">
											Notes
										</p>
										<p className="text-sm bg-gray-50 p-3 rounded border">
											{selectedAdjustment.notes}
										</p>
									</div>
								)}

								{/* Insurance Claim */}
								{selectedAdjustment.insuranceClaim && (
									<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
										<h4 className="text-sm font-semibold text-purple-900 mb-2">
											Insurance Claim
										</h4>
										<div className="grid grid-cols-2 gap-2 text-sm">
											<div>
												<p className="text-purple-700">Claim Number:</p>
												<p className="font-medium text-purple-900">
													{selectedAdjustment.claimNumber}
												</p>
											</div>
											<div>
												<p className="text-purple-700">Claim Amount:</p>
												<p className="font-medium text-purple-900">
													${selectedAdjustment.claimAmount?.toLocaleString()}
												</p>
											</div>
										</div>
									</div>
								)}

								{/* Approval/Rejection Information */}
								{selectedAdjustment.status === "APPROVED" &&
									selectedAdjustment.approvedBy && (
										<div className="bg-green-50 border border-green-200 rounded-lg p-4">
											<p className="text-sm text-green-900">
												<CheckCircleIcon className="w-4 h-4 inline mr-2" />
												Approved by {selectedAdjustment.approvedBy} on{" "}
												{new Date(
													selectedAdjustment.approvedDate!,
												).toLocaleString()}
											</p>
										</div>
									)}

								{selectedAdjustment.status === "REJECTED" &&
									selectedAdjustment.rejectedBy && (
										<div className="bg-red-50 border border-red-200 rounded-lg p-4">
											<p className="text-sm font-semibold text-red-900 mb-1">
												<XCircleIcon className="w-4 h-4 inline mr-2" />
												Rejected by {selectedAdjustment.rejectedBy} on{" "}
												{new Date(
													selectedAdjustment.rejectedDate!,
												).toLocaleString()}
											</p>
											{selectedAdjustment.rejectionReason && (
												<p className="text-sm text-red-700">
													Reason: {selectedAdjustment.rejectionReason}
												</p>
											)}
										</div>
									)}

								{selectedAdjustment.isPosted && selectedAdjustment.postedBy && (
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
										<p className="text-sm text-blue-900">
											<CheckCircleIcon className="w-4 h-4 inline mr-2" />
											Posted to stock by {selectedAdjustment.postedBy} on{" "}
											{new Date(
												selectedAdjustment.postedDate!,
											).toLocaleString()}
										</p>
									</div>
								)}

								{/* Actions */}
								<div className="flex justify-end gap-2 pt-4 border-t">
									{selectedAdjustment.status === "PENDING_APPROVAL" && (
										<>
											<Button
												variant="destructive"
												onClick={() => {
													const reason = prompt("Enter rejection reason:");
													if (reason)
														handleReject(selectedAdjustment.id, reason);
												}}
											>
												<XCircleIcon className="w-4 h-4 mr-2" />
												Reject
											</Button>
											<Button
												onClick={() => handleApprove(selectedAdjustment.id)}
											>
												<CheckCircleIcon className="w-4 h-4 mr-2" />
												Approve
											</Button>
										</>
									)}
									{selectedAdjustment.status === "APPROVED" &&
										!selectedAdjustment.isPosted && (
											<Button onClick={() => handlePost(selectedAdjustment.id)}>
												<FileTextIcon className="w-4 h-4 mr-2" />
												Post to Stock
											</Button>
										)}
									{(selectedAdjustment.status === "POSTED" ||
										selectedAdjustment.status === "REJECTED") && (
										<Button
											variant="outline"
											onClick={() => setIsDetailsOpen(false)}
										>
											Close
										</Button>
									)}
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Create Adjustment Form Component
function CreateAdjustmentForm({ onClose }: { onClose: () => void }) {
	const [formData, setFormData] = useState({
		productId: "",
		locationId: "",
		adjustmentDate: new Date().toISOString().split("T")[0],
		reason: "DAMAGE" as AdjustmentReason,
		adjustmentType: "DECREASE" as AdjustmentType,
		adjustmentQuantity: 0,
		requiresApproval: false,
		insuranceClaim: false,
		claimNumber: "",
		claimAmount: 0,
		notes: "",
	});

	const [selectedProduct, setSelectedProduct] = useState<
		(typeof mockProducts)[0] | null
	>(null);

	const handleProductChange = (productId: string) => {
		const product = mockProducts.find((p) => p.id === productId);
		setSelectedProduct(product || null);
		setFormData({ ...formData, productId });
	};

	const calculateQuantityAfter = () => {
		if (!selectedProduct) return 0;
		if (formData.adjustmentType === "INCREASE") {
			return selectedProduct.currentStock + formData.adjustmentQuantity;
		} else {
			return selectedProduct.currentStock - formData.adjustmentQuantity;
		}
	};

	const calculateCostImpact = () => {
		if (!selectedProduct) return 0;
		return formData.adjustmentQuantity * selectedProduct.unitCost;
	};

	const handleSubmit = () => {
		console.log("Creating adjustment:", {
			...formData,
			quantityBefore: selectedProduct?.currentStock,
			quantityAfter: calculateQuantityAfter(),
			costImpact: calculateCostImpact(),
		});
		// API call would go here
		alert("Stock adjustment created successfully!");
		onClose();
	};

	return (
		<div className="space-y-6">
			{/* Product and Location */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="product">Product *</Label>
					<Select
						value={formData.productId}
						onValueChange={handleProductChange}
					>
						<SelectTrigger id="product">
							<SelectValue placeholder="Select product" />
						</SelectTrigger>
						<SelectContent>
							{mockProducts.map((product) => (
								<SelectItem key={product.id} value={product.id}>
									{product.name} ({product.sku})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{selectedProduct && (
						<p className="text-xs text-muted-foreground">
							Current Stock: {selectedProduct.currentStock} @ $
							{selectedProduct.unitCost.toFixed(2)}
						</p>
					)}
				</div>

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
					<Label htmlFor="date">Adjustment Date *</Label>
					<Input
						id="date"
						type="date"
						value={formData.adjustmentDate}
						onChange={(e) =>
							setFormData({ ...formData, adjustmentDate: e.target.value })
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="reason">Reason *</Label>
					<Select
						value={formData.reason}
						onValueChange={(value) =>
							setFormData({ ...formData, reason: value as AdjustmentReason })
						}
					>
						<SelectTrigger id="reason">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="DAMAGE">Damage</SelectItem>
							<SelectItem value="THEFT">Theft</SelectItem>
							<SelectItem value="EXPIRY">Expiry</SelectItem>
							<SelectItem value="STOCK_COUNT_VARIANCE">
								Stock Count Variance
							</SelectItem>
							<SelectItem value="BREAKAGE">Breakage</SelectItem>
							<SelectItem value="SPOILAGE">Spoilage</SelectItem>
							<SelectItem value="LOSS">Loss</SelectItem>
							<SelectItem value="FOUND">Found</SelectItem>
							<SelectItem value="OTHER">Other</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<Separator />

			{/* Adjustment Details */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="type">Adjustment Type *</Label>
					<Select
						value={formData.adjustmentType}
						onValueChange={(value) =>
							setFormData({
								...formData,
								adjustmentType: value as AdjustmentType,
							})
						}
					>
						<SelectTrigger id="type">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="INCREASE">Increase</SelectItem>
							<SelectItem value="DECREASE">Decrease</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="quantity">Adjustment Quantity *</Label>
					<Input
						id="quantity"
						type="number"
						min="0"
						value={formData.adjustmentQuantity}
						onChange={(e) =>
							setFormData({
								...formData,
								adjustmentQuantity: parseFloat(e.target.value) || 0,
							})
						}
					/>
				</div>
			</div>

			{/* Impact Preview */}
			{selectedProduct && formData.adjustmentQuantity > 0 && (
				<div className="bg-gray-50 rounded-lg p-4">
					<h3 className="text-sm font-semibold mb-3">Impact Preview</h3>
					<div className="grid grid-cols-3 gap-4 text-center">
						<div>
							<p className="text-xs text-muted-foreground">Before</p>
							<p className="text-lg font-bold">
								{selectedProduct.currentStock}
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Change</p>
							<p
								className={`text-lg font-bold ${
									formData.adjustmentType === "INCREASE"
										? "text-green-600"
										: "text-red-600"
								}`}
							>
								{formData.adjustmentType === "INCREASE" ? "+" : "-"}
								{formData.adjustmentQuantity}
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">After</p>
							<p className="text-lg font-bold">{calculateQuantityAfter()}</p>
						</div>
					</div>
					<div className="mt-3 text-center">
						<p className="text-xs text-muted-foreground">Cost Impact</p>
						<p className="text-xl font-bold text-blue-600">
							${calculateCostImpact().toFixed(2)}
						</p>
					</div>
				</div>
			)}

			<Separator />

			{/* Additional Fields */}
			<div className="space-y-4">
				<div className="flex items-center space-x-2">
					<Checkbox
						id="approval"
						checked={formData.requiresApproval}
						onCheckedChange={(checked) =>
							setFormData({ ...formData, requiresApproval: checked as boolean })
						}
					/>
					<Label htmlFor="approval" className="text-sm font-normal">
						Requires Approval
					</Label>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="insurance"
						checked={formData.insuranceClaim}
						onCheckedChange={(checked) =>
							setFormData({ ...formData, insuranceClaim: checked as boolean })
						}
					/>
					<Label htmlFor="insurance" className="text-sm font-normal">
						Insurance Claim
					</Label>
				</div>

				{formData.insuranceClaim && (
					<div className="grid grid-cols-2 gap-4 pl-6">
						<div className="space-y-2">
							<Label htmlFor="claimNumber">Claim Number</Label>
							<Input
								id="claimNumber"
								value={formData.claimNumber}
								onChange={(e) =>
									setFormData({ ...formData, claimNumber: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="claimAmount">Claim Amount</Label>
							<Input
								id="claimAmount"
								type="number"
								min="0"
								step="0.01"
								value={formData.claimAmount}
								onChange={(e) =>
									setFormData({
										...formData,
										claimAmount: parseFloat(e.target.value) || 0,
									})
								}
							/>
						</div>
					</div>
				)}

				<div className="space-y-2">
					<Label htmlFor="notes">Notes</Label>
					<Textarea
						id="notes"
						value={formData.notes}
						onChange={(e) =>
							setFormData({ ...formData, notes: e.target.value })
						}
						placeholder="Additional details about the adjustment..."
						rows={3}
					/>
				</div>
			</div>

			{/* Actions */}
			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={
						!formData.productId ||
						!formData.locationId ||
						formData.adjustmentQuantity <= 0
					}
				>
					Create Adjustment
				</Button>
			</div>
		</div>
	);
}
