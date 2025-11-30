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
	FileTextIcon,
	PlusIcon,
	SearchIcon,
	PackageCheckIcon,
	AlertCircleIcon,
	CheckCircleIcon,
	TruckIcon,
	TrashIcon,
} from "lucide-react";

// Types based on FRD 3.8
type GRNStatus = "DRAFT" | "ACCEPTED";

type GRNItem = {
	id: string;
	productId: string;
	productName: string;
	productSku: string;
	quantityReceived: number;
	quantityAccepted: number;
	quantityRejected: number;
	unitPrice: number;
	batchNumber?: string;
	serialNumber?: string;
	manufactureDate?: string;
	expiryDate?: string;
	qualityStatus: "GOOD" | "ACCEPTABLE" | "POOR" | "DAMAGED";
	rejectionReason?: string;
	damageDetails?: string;
	packagingCondition: "INTACT" | "MINOR_DAMAGE" | "MAJOR_DAMAGE";
	lineTotal: number;
};

type GoodsReceiptNote = {
	id: string;
	grnNumber: string; // Format: GRN-YYYYMMDD-XXXX
	purchaseOrderId?: string;
	purchaseOrderNumber?: string;
	supplierId: string;
	supplierName: string;
	storageLocationId: string;
	storageLocationName: string;
	receiptDate: string;
	receiptTime: string;
	supplierInvoiceNumber?: string;
	supplierInvoiceDate?: string;
	supplierDeliveryNote?: string;
	deliveredBy?: string;
	vehicleNumber?: string;
	inspectionRequired: boolean;
	items: GRNItem[];
	subtotal: number;
	totalAmount: number;
	status: GRNStatus;
	isPosted: boolean;
	postedBy?: string;
	postedDate?: string;
	notes?: string;
	createdBy: string;
	createdDate: string;
};

// Mock data
const mockGRNs: GoodsReceiptNote[] = [
	{
		id: "1",
		grnNumber: "GRN-20251123-001",
		purchaseOrderId: "1",
		purchaseOrderNumber: "PO-20251120-001",
		supplierId: "1",
		supplierName: "ABC Hospitality Supplies",
		storageLocationId: "1",
		storageLocationName: "Main Warehouse",
		receiptDate: "2025-11-23",
		receiptTime: "09:30",
		supplierInvoiceNumber: "INV-ABC-2025-1234",
		supplierInvoiceDate: "2025-11-22",
		supplierDeliveryNote: "DN-ABC-5678",
		deliveredBy: "John Doe",
		vehicleNumber: "ABC-1234",
		inspectionRequired: true,
		items: [
			{
				id: "1",
				productId: "1",
				productName: "Kitchen Towels",
				productSku: "KT-001",
				quantityReceived: 100,
				quantityAccepted: 95,
				quantityRejected: 5,
				unitPrice: 2.5,
				batchNumber: "BATCH-2025-11-001",
				manufactureDate: "2025-11-15",
				qualityStatus: "GOOD",
				rejectionReason: "Packaging damage",
				packagingCondition: "MINOR_DAMAGE",
				lineTotal: 250,
			},
			{
				id: "2",
				productId: "2",
				productName: "Laundry Detergent",
				productSku: "LD-001",
				quantityReceived: 50,
				quantityAccepted: 50,
				quantityRejected: 0,
				unitPrice: 12.0,
				batchNumber: "BATCH-2025-11-002",
				expiryDate: "2027-11-01",
				qualityStatus: "GOOD",
				packagingCondition: "INTACT",
				lineTotal: 600,
			},
		],
		subtotal: 850,
		totalAmount: 850,
		status: "DRAFT",
		isPosted: false,
		createdBy: "Sarah Johnson",
		createdDate: "2025-11-23T09:45:00",
	},
	{
		id: "2",
		grnNumber: "GRN-20251122-003",
		supplierId: "2",
		supplierName: "Premium Food Distributors",
		storageLocationId: "2",
		storageLocationName: "Cold Storage Unit 1",
		receiptDate: "2025-11-22",
		receiptTime: "14:00",
		supplierInvoiceNumber: "INV-PFD-8765",
		deliveredBy: "Mike Wilson",
		vehicleNumber: "PFD-9876",
		inspectionRequired: true,
		items: [
			{
				id: "3",
				productId: "3",
				productName: "Fresh Vegetables",
				productSku: "VEG-MIX-001",
				quantityReceived: 200,
				quantityAccepted: 200,
				quantityRejected: 0,
				unitPrice: 3.5,
				batchNumber: "BATCH-VEG-2025-11-22",
				expiryDate: "2025-11-29",
				qualityStatus: "GOOD",
				packagingCondition: "INTACT",
				lineTotal: 700,
			},
		],
		subtotal: 700,
		totalAmount: 700,
		status: "ACCEPTED",
		isPosted: true,
		postedBy: "Sarah Johnson",
		postedDate: "2025-11-22T14:30:00",
		notes: "All items in excellent condition",
		createdBy: "Sarah Johnson",
		createdDate: "2025-11-22T14:15:00",
	},
	{
		id: "3",
		grnNumber: "GRN-20251121-002",
		supplierId: "3",
		supplierName: "Cleaning Solutions Ltd",
		storageLocationId: "1",
		storageLocationName: "Main Warehouse",
		receiptDate: "2025-11-21",
		receiptTime: "11:00",
		supplierInvoiceNumber: "INV-CSL-4567",
		supplierInvoiceDate: "2025-11-20",
		deliveredBy: "Robert Brown",
		vehicleNumber: "CSL-5678",
		inspectionRequired: false,
		items: [
			{
				id: "4",
				productId: "4",
				productName: "All-Purpose Cleaner",
				productSku: "CL-APC-001",
				quantityReceived: 75,
				quantityAccepted: 70,
				quantityRejected: 5,
				unitPrice: 8.5,
				batchNumber: "BATCH-CL-2025-11",
				expiryDate: "2027-11-01",
				qualityStatus: "ACCEPTABLE",
				rejectionReason: "5 bottles with damaged spray nozzles",
				packagingCondition: "MINOR_DAMAGE",
				lineTotal: 637.5,
			},
		],
		subtotal: 637.5,
		totalAmount: 637.5,
		status: "DRAFT",
		isPosted: false,
		notes: "Damaged nozzles documented for supplier return",
		createdBy: "Michael Chen",
		createdDate: "2025-11-21T11:20:00",
	},
];

const mockSuppliers = [
	{ id: "1", name: "ABC Hospitality Supplies" },
	{ id: "2", name: "Premium Food Distributors" },
	{ id: "3", name: "Cleaning Solutions Ltd" },
	{ id: "4", name: "Kitchen Equipment Pro" },
];

const mockStorageLocations = [
	{ id: "1", name: "Main Warehouse", code: "WH-MAIN" },
	{ id: "2", name: "Cold Storage Unit 1", code: "CS-01" },
	{ id: "3", name: "Dry Storage Room", code: "DS-01" },
	{ id: "4", name: "Bar Storage", code: "BAR-ST" },
];

const mockProducts = [
	{ id: "1", name: "Kitchen Towels", sku: "KT-001", trackBatches: true },
	{
		id: "2",
		name: "Laundry Detergent",
		sku: "LD-001",
		trackBatches: true,
		trackExpiry: true,
	},
	{
		id: "3",
		name: "Fresh Vegetables",
		sku: "VEG-MIX-001",
		trackBatches: true,
		trackExpiry: true,
	},
	{
		id: "4",
		name: "All-Purpose Cleaner",
		sku: "CL-APC-001",
		trackBatches: true,
		trackExpiry: true,
	},
	{ id: "5", name: "Hand Soap", sku: "HS-001", trackBatches: true },
];

export function GRNPage() {
	const [grns] = useState<GoodsReceiptNote[]>(mockGRNs);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [postedFilter, setPostedFilter] = useState<string>("all");
	const [selectedGRN, setSelectedGRN] = useState<GoodsReceiptNote | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	// Filter GRNs
	const filteredGRNs = grns.filter((grn) => {
		const matchesSearch =
			grn.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
			grn.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			grn.purchaseOrderNumber
				?.toLowerCase()
				.includes(searchQuery.toLowerCase());

		const matchesStatus = statusFilter === "all" || grn.status === statusFilter;
		const matchesPosted =
			postedFilter === "all" ||
			(postedFilter === "posted" && grn.isPosted) ||
			(postedFilter === "unposted" && !grn.isPosted);

		return matchesSearch && matchesStatus && matchesPosted;
	});

	// Calculate stats
	const unpostedCount = grns.filter((g) => !g.isPosted).length;
	const unpostedValue = grns
		.filter((g) => !g.isPosted)
		.reduce((sum, g) => sum + g.totalAmount, 0);
	const recentCount = grns.filter(
		(g) =>
			new Date(g.createdDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
	).length;

	const handleViewDetails = (grn: GoodsReceiptNote) => {
		setSelectedGRN(grn);
		setIsDetailsOpen(true);
	};

	const handlePostToStock = (grnId: string) => {
		console.log("Posting GRN to stock:", grnId);
		// API call would go here
		alert("GRN posted to stock successfully!");
		setIsDetailsOpen(false);
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Goods Receipt Notes
					</h1>
					<p className="text-muted-foreground mt-1">
						Record and manage goods received from suppliers
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							Create GRN
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create Goods Receipt Note</DialogTitle>
						</DialogHeader>
						<CreateGRNForm onClose={() => setIsCreateOpen(false)} />
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<div className="bg-white p-2 md:pl-4 rounded-2xl flex items-center space-x-2 border shadow-sm">
					<div className="bg-orange-50 size-10 md:size-12 rounded-full flex items-center justify-center">
						<FileTextIcon className="size-5 text-orange-600" />
					</div>
					<div className="flex-1 space-y-1">
						<p className="text-sm font-medium text-muted-foreground">
							Unposted GRNs
						</p>
						<div className="flex items-baseline gap-2">
							<h3 className="text-2xl font-bold">{unpostedCount}</h3>
							<p className="text-xs text-muted-foreground">
								${unpostedValue.toLocaleString()} total value
							</p>
						</div>
					</div>
				</div>

				<div className="bg-white p-2 md:pl-4 rounded-2xl flex items-center space-x-2 border shadow-sm">
					<div className="bg-green-50 size-10 md:size-12 rounded-full flex items-center justify-center">
						<PackageCheckIcon className="size-5 text-green-600" />
					</div>
					<div className="flex-1 space-y-1">
						<p className="text-sm font-medium text-muted-foreground">
							Posted GRNs
						</p>
						<div className="flex items-baseline gap-2">
							<h3 className="text-2xl font-bold">
								{grns.filter((g) => g.isPosted).length}
							</h3>
							<p className="text-xs text-muted-foreground">Stock updated</p>
						</div>
					</div>
				</div>

				<div className="bg-white p-2 md:pl-4 rounded-2xl flex items-center space-x-2 border shadow-sm">
					<div className="bg-blue-50 size-10 md:size-12 rounded-full flex items-center justify-center">
						<TruckIcon className="size-5 text-blue-600" />
					</div>
					<div className="flex-1 space-y-1">
						<p className="text-sm font-medium text-muted-foreground">
							Recent GRNs
						</p>
						<div className="flex items-baseline gap-2">
							<h3 className="text-2xl font-bold">{recentCount}</h3>
							<p className="text-xs text-muted-foreground">Last 7 days</p>
						</div>
					</div>
				</div>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="grid gap-4 md:grid-cols-4">
						<div className="md:col-span-2">
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search by GRN number, supplier, or PO number..."
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
								<SelectItem value="DRAFT">Draft</SelectItem>
								<SelectItem value="ACCEPTED">Accepted</SelectItem>
							</SelectContent>
						</Select>
						<Select value={postedFilter} onValueChange={setPostedFilter}>
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
				</CardContent>
			</Card>

			{/* GRNs Table */}
			<Card>
				<CardHeader>
					<CardTitle>Goods Receipt Notes ({filteredGRNs.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>GRN Number</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Supplier</TableHead>
								<TableHead>PO Number</TableHead>
								<TableHead>Location</TableHead>
								<TableHead className="text-right">Total Amount</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Posted</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredGRNs.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={9}
										className="text-center text-muted-foreground py-8"
									>
										No GRNs found
									</TableCell>
								</TableRow>
							) : (
								filteredGRNs.map((grn) => (
									<TableRow key={grn.id}>
										<TableCell className="font-medium">
											{grn.grnNumber}
										</TableCell>
										<TableCell>
											{new Date(grn.receiptDate).toLocaleDateString()}
										</TableCell>
										<TableCell>{grn.supplierName}</TableCell>
										<TableCell>
											{grn.purchaseOrderNumber ? (
												<span className="text-blue-600">
													{grn.purchaseOrderNumber}
												</span>
											) : (
												<span className="text-muted-foreground">
													Standalone
												</span>
											)}
										</TableCell>
										<TableCell>{grn.storageLocationName}</TableCell>
										<TableCell className="text-right font-medium">
											${grn.totalAmount.toLocaleString()}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													grn.status === "ACCEPTED" ? "default" : "secondary"
												}
											>
												{grn.status}
											</Badge>
										</TableCell>
										<TableCell>
											{grn.isPosted ? (
												<Badge
													variant="outline"
													className="bg-green-50 text-green-700 border-green-200"
												>
													<CheckCircleIcon className="w-3 h-3 mr-1" />
													Posted
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="bg-orange-50 text-orange-700 border-orange-200"
												>
													<AlertCircleIcon className="w-3 h-3 mr-1" />
													Unposted
												</Badge>
											)}
										</TableCell>
										<TableCell>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleViewDetails(grn)}
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

			{/* GRN Details Dialog */}
			<Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
				<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
					{selectedGRN && (
						<>
							<DialogHeader>
								<div className="flex items-center justify-between">
									<DialogTitle>
										GRN Details - {selectedGRN.grnNumber}
									</DialogTitle>
									<div className="flex gap-2">
										<Badge
											variant={
												selectedGRN.status === "ACCEPTED"
													? "default"
													: "secondary"
											}
										>
											{selectedGRN.status}
										</Badge>
										{selectedGRN.isPosted ? (
											<Badge
												variant="outline"
												className="bg-green-50 text-green-700 border-green-200"
											>
												<CheckCircleIcon className="w-3 h-3 mr-1" />
												Posted
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="bg-orange-50 text-orange-700 border-orange-200"
											>
												<AlertCircleIcon className="w-3 h-3 mr-1" />
												Unposted
											</Badge>
										)}
									</div>
								</div>
							</DialogHeader>

							<div className="space-y-6">
								{/* Header Information */}
								<div className="grid grid-cols-2 gap-6">
									<div className="space-y-3">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Supplier
											</p>
											<p className="text-base font-semibold">
												{selectedGRN.supplierName}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Storage Location
											</p>
											<p className="text-base">
												{selectedGRN.storageLocationName}
											</p>
										</div>
										{selectedGRN.purchaseOrderNumber && (
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													Purchase Order
												</p>
												<p className="text-base text-blue-600">
													{selectedGRN.purchaseOrderNumber}
												</p>
											</div>
										)}
									</div>
									<div className="space-y-3">
										<div>
											<p className="text-sm font-medium text-muted-foreground">
												Receipt Date & Time
											</p>
											<p className="text-base">
												{new Date(selectedGRN.receiptDate).toLocaleDateString()}{" "}
												at {selectedGRN.receiptTime}
											</p>
										</div>
										{selectedGRN.supplierInvoiceNumber && (
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													Supplier Invoice
												</p>
												<p className="text-base">
													{selectedGRN.supplierInvoiceNumber}
												</p>
											</div>
										)}
										{selectedGRN.deliveredBy && (
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													Delivered By
												</p>
												<p className="text-base">
													{selectedGRN.deliveredBy} -{" "}
													{selectedGRN.vehicleNumber}
												</p>
											</div>
										)}
									</div>
								</div>

								<Separator />

								{/* Items Table */}
								<div>
									<h3 className="text-lg font-semibold mb-3">Received Items</h3>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Product</TableHead>
												<TableHead>Batch/Expiry</TableHead>
												<TableHead className="text-center">Received</TableHead>
												<TableHead className="text-center">Accepted</TableHead>
												<TableHead className="text-center">Rejected</TableHead>
												<TableHead>Quality</TableHead>
												<TableHead className="text-right">Unit Price</TableHead>
												<TableHead className="text-right">Total</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{selectedGRN.items.map((item) => (
												<TableRow key={item.id}>
													<TableCell>
														<div>
															<p className="font-medium">{item.productName}</p>
															<p className="text-xs text-muted-foreground">
																{item.productSku}
															</p>
														</div>
													</TableCell>
													<TableCell>
														<div className="text-xs">
															{item.batchNumber && (
																<p>Batch: {item.batchNumber}</p>
															)}
															{item.expiryDate && (
																<p className="text-muted-foreground">
																	Exp: {item.expiryDate}
																</p>
															)}
														</div>
													</TableCell>
													<TableCell className="text-center font-medium">
														{item.quantityReceived}
													</TableCell>
													<TableCell className="text-center">
														<span className="text-green-600 font-medium">
															{item.quantityAccepted}
														</span>
													</TableCell>
													<TableCell className="text-center">
														{item.quantityRejected > 0 ? (
															<span className="text-red-600 font-medium">
																{item.quantityRejected}
															</span>
														) : (
															<span className="text-muted-foreground">0</span>
														)}
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className={
																item.qualityStatus === "GOOD"
																	? "bg-green-50 text-green-700 border-green-200"
																	: item.qualityStatus === "ACCEPTABLE"
																		? "bg-blue-50 text-blue-700 border-blue-200"
																		: "bg-red-50 text-red-700 border-red-200"
															}
														>
															{item.qualityStatus}
														</Badge>
													</TableCell>
													<TableCell className="text-right">
														${item.unitPrice.toFixed(2)}
													</TableCell>
													<TableCell className="text-right font-medium">
														${item.lineTotal.toFixed(2)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

								{/* Rejection Details */}
								{selectedGRN.items.some(
									(item) => item.quantityRejected > 0,
								) && (
									<div className="bg-red-50 border border-red-200 rounded-lg p-4">
										<h4 className="text-sm font-semibold text-red-900 mb-2">
											Rejection Details
										</h4>
										<div className="space-y-2">
											{selectedGRN.items
												.filter((item) => item.quantityRejected > 0)
												.map((item) => (
													<div key={item.id} className="text-sm">
														<p className="font-medium text-red-900">
															{item.productName}
														</p>
														<p className="text-red-700">
															Reason: {item.rejectionReason || "Not specified"}
														</p>
														{item.damageDetails && (
															<p className="text-red-700">
																Details: {item.damageDetails}
															</p>
														)}
													</div>
												))}
										</div>
									</div>
								)}

								<Separator />

								{/* Totals */}
								<div className="flex justify-end">
									<div className="w-64 space-y-2">
										<div className="flex justify-between text-lg font-semibold">
											<span>Total Amount:</span>
											<span>${selectedGRN.totalAmount.toLocaleString()}</span>
										</div>
									</div>
								</div>

								{/* Notes */}
								{selectedGRN.notes && (
									<div>
										<p className="text-sm font-medium text-muted-foreground mb-1">
											Notes
										</p>
										<p className="text-sm bg-gray-50 p-3 rounded border">
											{selectedGRN.notes}
										</p>
									</div>
								)}

								{/* Posted Information */}
								{selectedGRN.isPosted && selectedGRN.postedBy && (
									<div className="bg-green-50 border border-green-200 rounded-lg p-4">
										<p className="text-sm text-green-900">
											<CheckCircleIcon className="w-4 h-4 inline mr-2" />
											Posted to stock by {selectedGRN.postedBy} on{" "}
											{new Date(selectedGRN.postedDate!).toLocaleString()}
										</p>
									</div>
								)}

								{/* Actions */}
								{!selectedGRN.isPosted && (
									<div className="flex justify-end gap-2 pt-4 border-t">
										<Button
											variant="outline"
											onClick={() => setIsDetailsOpen(false)}
										>
											Close
										</Button>
										<Button onClick={() => handlePostToStock(selectedGRN.id)}>
											<PackageCheckIcon className="w-4 h-4 mr-2" />
											Post to Stock
										</Button>
									</div>
								)}
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Create GRN Form Component
function CreateGRNForm({ onClose }: { onClose: () => void }) {
	const [formData, setFormData] = useState({
		supplierId: "",
		storageLocationId: "",
		receiptDate: new Date().toISOString().split("T")[0],
		receiptTime: new Date().toTimeString().slice(0, 5),
		supplierInvoiceNumber: "",
		supplierInvoiceDate: "",
		supplierDeliveryNote: "",
		deliveredBy: "",
		vehicleNumber: "",
		inspectionRequired: false,
		notes: "",
	});

	const [items, setItems] = useState<
		Array<{
			id: string;
			productId: string;
			quantityReceived: number;
			quantityAccepted: number;
			quantityRejected: number;
			unitPrice: number;
			batchNumber: string;
			expiryDate: string;
			qualityStatus: string;
			rejectionReason: string;
			packagingCondition: string;
		}>
	>([]);

	const handleAddItem = () => {
		setItems([
			...items,
			{
				id: Date.now().toString(),
				productId: "",
				quantityReceived: 0,
				quantityAccepted: 0,
				quantityRejected: 0,
				unitPrice: 0,
				batchNumber: "",
				expiryDate: "",
				qualityStatus: "GOOD",
				rejectionReason: "",
				packagingCondition: "INTACT",
			},
		]);
	};

	const handleRemoveItem = (id: string) => {
		setItems(items.filter((item) => item.id !== id));
	};

	const handleItemChange = (id: string, field: string, value: any) => {
		setItems(
			items.map((item) => {
				if (item.id === id) {
					const updated = { ...item, [field]: value };
					// Auto-calculate accepted/rejected
					if (field === "quantityReceived" || field === "quantityRejected") {
						const received =
							field === "quantityReceived" ? value : item.quantityReceived;
						const rejected =
							field === "quantityRejected" ? value : item.quantityRejected;
						updated.quantityAccepted = Math.max(0, received - rejected);
					}
					return updated;
				}
				return item;
			}),
		);
	};

	const handleSubmit = () => {
		console.log("Creating GRN:", { ...formData, items });
		// API call would go here
		alert("GRN created successfully!");
		onClose();
	};

	return (
		<div className="space-y-6">
			{/* Basic Information */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="supplier">Supplier *</Label>
					<Select
						value={formData.supplierId}
						onValueChange={(value) =>
							setFormData({ ...formData, supplierId: value })
						}
					>
						<SelectTrigger id="supplier">
							<SelectValue placeholder="Select supplier" />
						</SelectTrigger>
						<SelectContent>
							{mockSuppliers.map((supplier) => (
								<SelectItem key={supplier.id} value={supplier.id}>
									{supplier.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="location">Storage Location *</Label>
					<Select
						value={formData.storageLocationId}
						onValueChange={(value) =>
							setFormData({ ...formData, storageLocationId: value })
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
					<Label htmlFor="receiptDate">Receipt Date *</Label>
					<Input
						id="receiptDate"
						type="date"
						value={formData.receiptDate}
						onChange={(e) =>
							setFormData({ ...formData, receiptDate: e.target.value })
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="receiptTime">Receipt Time *</Label>
					<Input
						id="receiptTime"
						type="time"
						value={formData.receiptTime}
						onChange={(e) =>
							setFormData({ ...formData, receiptTime: e.target.value })
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="invoiceNumber">Supplier Invoice Number</Label>
					<Input
						id="invoiceNumber"
						value={formData.supplierInvoiceNumber}
						onChange={(e) =>
							setFormData({
								...formData,
								supplierInvoiceNumber: e.target.value,
							})
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="invoiceDate">Invoice Date</Label>
					<Input
						id="invoiceDate"
						type="date"
						value={formData.supplierInvoiceDate}
						onChange={(e) =>
							setFormData({ ...formData, supplierInvoiceDate: e.target.value })
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="deliveredBy">Delivered By</Label>
					<Input
						id="deliveredBy"
						value={formData.deliveredBy}
						onChange={(e) =>
							setFormData({ ...formData, deliveredBy: e.target.value })
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="vehicleNumber">Vehicle Number</Label>
					<Input
						id="vehicleNumber"
						value={formData.vehicleNumber}
						onChange={(e) =>
							setFormData({ ...formData, vehicleNumber: e.target.value })
						}
					/>
				</div>
			</div>

			<div className="flex items-center space-x-2">
				<Checkbox
					id="inspection"
					checked={formData.inspectionRequired}
					onCheckedChange={(checked) =>
						setFormData({ ...formData, inspectionRequired: checked as boolean })
					}
				/>
				<Label htmlFor="inspection" className="text-sm font-normal">
					Inspection Required
				</Label>
			</div>

			<Separator />

			{/* Items Section */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">Received Items</h3>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleAddItem}
					>
						<PlusIcon className="w-4 h-4 mr-2" />
						Add Item
					</Button>
				</div>

				<div className="space-y-4">
					{items.map((item, index) => (
						<Card key={item.id}>
							<CardContent className="pt-6">
								<div className="space-y-4">
									<div className="flex items-start justify-between">
										<h4 className="font-medium">Item {index + 1}</h4>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveItem(item.id)}
										>
											<TrashIcon className="w-4 h-4 text-red-600" />
										</Button>
									</div>

									<div className="grid grid-cols-3 gap-4">
										<div className="col-span-3 space-y-2">
											<Label>Product *</Label>
											<Select
												value={item.productId}
												onValueChange={(value) =>
													handleItemChange(item.id, "productId", value)
												}
											>
												<SelectTrigger>
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
										</div>

										<div className="space-y-2">
											<Label>Qty Received *</Label>
											<Input
												type="number"
												min="0"
												value={item.quantityReceived}
												onChange={(e) =>
													handleItemChange(
														item.id,
														"quantityReceived",
														parseFloat(e.target.value) || 0,
													)
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>Qty Rejected</Label>
											<Input
												type="number"
												min="0"
												value={item.quantityRejected}
												onChange={(e) =>
													handleItemChange(
														item.id,
														"quantityRejected",
														parseFloat(e.target.value) || 0,
													)
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>Qty Accepted</Label>
											<Input
												type="number"
												value={item.quantityAccepted}
												disabled
												className="bg-gray-50"
											/>
										</div>

										<div className="space-y-2">
											<Label>Unit Price *</Label>
											<Input
												type="number"
												min="0"
												step="0.01"
												value={item.unitPrice}
												onChange={(e) =>
													handleItemChange(
														item.id,
														"unitPrice",
														parseFloat(e.target.value) || 0,
													)
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>Batch Number</Label>
											<Input
												value={item.batchNumber}
												onChange={(e) =>
													handleItemChange(
														item.id,
														"batchNumber",
														e.target.value,
													)
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>Expiry Date</Label>
											<Input
												type="date"
												value={item.expiryDate}
												onChange={(e) =>
													handleItemChange(
														item.id,
														"expiryDate",
														e.target.value,
													)
												}
											/>
										</div>

										<div className="space-y-2">
											<Label>Quality Status *</Label>
											<Select
												value={item.qualityStatus}
												onValueChange={(value) =>
													handleItemChange(item.id, "qualityStatus", value)
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="GOOD">Good</SelectItem>
													<SelectItem value="ACCEPTABLE">Acceptable</SelectItem>
													<SelectItem value="POOR">Poor</SelectItem>
													<SelectItem value="DAMAGED">Damaged</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label>Packaging Condition *</Label>
											<Select
												value={item.packagingCondition}
												onValueChange={(value) =>
													handleItemChange(item.id, "packagingCondition", value)
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="INTACT">Intact</SelectItem>
													<SelectItem value="MINOR_DAMAGE">
														Minor Damage
													</SelectItem>
													<SelectItem value="MAJOR_DAMAGE">
														Major Damage
													</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{item.quantityRejected > 0 && (
											<div className="col-span-3 space-y-2">
												<Label>Rejection Reason</Label>
												<Textarea
													value={item.rejectionReason}
													onChange={(e) =>
														handleItemChange(
															item.id,
															"rejectionReason",
															e.target.value,
														)
													}
													placeholder="Explain why items were rejected..."
												/>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{items.length === 0 && (
						<div className="text-center py-8 text-muted-foreground">
							No items added yet. Click "Add Item" to start.
						</div>
					)}
				</div>
			</div>

			<Separator />

			{/* Notes */}
			<div className="space-y-2">
				<Label htmlFor="notes">Notes</Label>
				<Textarea
					id="notes"
					value={formData.notes}
					onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
					placeholder="Additional notes or observations..."
					rows={3}
				/>
			</div>

			{/* Actions */}
			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={
						!formData.supplierId ||
						!formData.storageLocationId ||
						items.length === 0
					}
				>
					Create GRN
				</Button>
			</div>
		</div>
	);
}
