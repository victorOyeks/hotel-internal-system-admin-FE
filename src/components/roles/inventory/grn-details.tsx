import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	CheckCircleIcon,
	AlertCircleIcon,
	PackageCheckIcon,
	TruckIcon,
	CalendarIcon,
	ClipboardCheckIcon,
	FileTextIcon,
	AlertTriangleIcon,
	Loader2Icon,
} from "lucide-react";
import type { InventoryGRNResponse } from "@/lib/fetch";
import { useMutation } from "@tanstack/react-query";
import { postGRNToStock } from "@/lib/inventory-actions";
import { toast } from "sonner";
import { revalidateRoute } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";

interface GRNDetailsProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	grn: InventoryGRNResponse | null;
}

export function GRNDetails({ open, onOpenChange, grn }: GRNDetailsProps) {

	const { mutate: postToStock, isPending } = useMutation({
		mutationFn: async (grnId: string) => {
			const response = await postGRNToStock(grnId);
			if (!response.success) {
				throw new Error(response.error);
			}
			return response.data;
		},
		onSuccess: async () => {
			toast.success("GRN posted to stock successfully");
			await revalidateRoute("/dashboard/grn");
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error("Failed to post GRN to stock", {
				description: error.message,
			});
		},
	});

	const formatDate = (dateString: string) => {
		if (!dateString) return "N/A";
		return new Date(dateString).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (!grn) return null;
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button variant={"link"} className="p-0 h-auto font-medium">
					{grn.supplierName}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
				<DialogHeader className="p-6 pb-4 border-b shrink-0">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="space-y-1">
							<DialogTitle className="text-2xl font-medium flex items-center gap-3">
								{grn.supplierName}
								<Badge
									variant={grn.status === "ACCEPTED" ? "green" : "yellow"}
									className="text-sm font-normal"
								>
									{grn.status}
								</Badge>
							</DialogTitle>
							<p className="text-sm text-muted-foreground flex items-center gap-2">
								<CalendarIcon className="w-4 h-4" />
								Received on {formatDate(grn.receiptDate)} at {grn.receiptTime}
							</p>
						</div>
						<div className="flex items-center gap-2">
							{grn.stockPosted ? (
								<Badge
									variant="outline"
									className="bg-green-50 text-green-700 border-green-200 py-1 px-3"
								>
									<CheckCircleIcon className="w-4 h-4 mr-2" /> Stock Posted
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="bg-orange-50 text-orange-700 border-orange-200 py-1 px-3"
								>
									<AlertCircleIcon className="w-4 h-4 mr-2" /> Unposted
								</Badge>
							)}
							{!grn.stockPosted && (
								<Button
									onClick={() => postToStock(grn.id)}
									size="sm"
									disabled={isPending}
								>
									{isPending ? (
										<Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
									) : (
										<PackageCheckIcon className="w-4 h-4 mr-2" />
									)}
									Post to Stock
								</Button>
							)}
						</div>
					</div>
				</DialogHeader>

				<ScrollArea className="flex-1">
					<div className="p-6 space-y-8">
						{/* Summary Section - Simplified */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
							<div>
								<p className="text-sm text-muted-foreground mb-1">Total Value</p>
								<div className="text-2xl font-medium">
									{formatCurrency(grn.netAmount)}
								</div>
							</div>
							<div>
								<p className="text-sm text-muted-foreground mb-1">Items Summary</p>
								<div className="flex items-baseline gap-2">
									<span className="text-2xl font-medium">
										{grn.totalQuantityAccepted}
									</span>
									<span className="text-sm text-muted-foreground">
										/ {grn.totalQuantityReceived} Received
									</span>
								</div>
								{grn.totalQuantityRejected > 0 && (
									<p className="text-xs text-red-600 font-medium mt-1">
										{grn.totalQuantityRejected} Rejected
									</p>
								)}
							</div>
							<div>
								<p className="text-sm text-muted-foreground mb-1">Supplier</p>
								<div className="font-semimedium truncate" title={grn.supplierName}>
									{grn.supplierName}
								</div>
								<p className="text-xs text-muted-foreground truncate">
									Inv: {grn.supplierInvoiceNumber}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground mb-1">Location</p>
								<div
									className="font-semimedium truncate"
									title={grn.storageLocationName}
								>
									{grn.storageLocationName}
								</div>
								<p className="text-xs text-muted-foreground">
									{grn.storageLocationCode}
								</p>
							</div>
						</div>

						<Separator />

						<Tabs defaultValue="items" className="w-full">
							<TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
								<TabsTrigger
									value="items"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
								>
									Items
								</TabsTrigger>
								<TabsTrigger
									value="general"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
								>
									General Info
								</TabsTrigger>
								<TabsTrigger
									value="financials"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
								>
									Financials
								</TabsTrigger>
							</TabsList>

							<TabsContent value="items" className="mt-6">
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Product Details</TableHead>
												<TableHead className="text-center">Received</TableHead>
												<TableHead className="text-center">Accepted</TableHead>
												<TableHead className="text-center">Rejected</TableHead>
												<TableHead className="text-right">Unit Price</TableHead>
												<TableHead className="text-right">Total</TableHead>
												<TableHead className="text-right">Status</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{grn.items.map((item) => (
												<TableRow key={item.id}>
													<TableCell>
														<div className="font-medium">
															{item.productName}
														</div>
														<div className="text-xs text-muted-foreground">
															SKU: {item.productSku}
														</div>
														{(item.batchNumber || item.serialNumber) && (
															<div className="text-xs text-muted-foreground mt-1">
																{item.batchNumber && (
																	<span className="mr-2">
																		Batch: {item.batchNumber}
																	</span>
																)}
																{item.serialNumber && (
																	<span>SN: {item.serialNumber}</span>
																)}
															</div>
														)}
													</TableCell>
													<TableCell className="text-center">
														{item.quantityReceived} {item.unit}
													</TableCell>
													<TableCell className="text-center text-green-600 font-medium">
														{item.quantityAccepted}
													</TableCell>
													<TableCell className="text-center">
														{item.quantityRejected > 0 ? (
															<span className="text-red-600 font-medium">
																{item.quantityRejected}
															</span>
														) : (
															"-"
														)}
													</TableCell>
													<TableCell className="text-right">
														{formatCurrency(item.unitPrice)}
													</TableCell>
													<TableCell className="text-right font-medium">
														{formatCurrency(item.lineTotal)}
													</TableCell>
													<TableCell className="text-right">
														{item.quantityRejected > 0 ? (
															<Badge variant="destructive">Issues</Badge>
														) : (
															<Badge
																variant="outline"
																className="text-green-600 border-green-200 bg-green-50"
															>
																OK
															</Badge>
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</TabsContent>

							<TabsContent value="general" className="mt-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-semimedium flex items-center gap-2 mb-4">
												<TruckIcon className="w-5 h-5" /> Delivery Details
											</h3>
											<div className="grid grid-cols-2 gap-y-4 gap-x-8">
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Vehicle Number
													</p>
													<p>{grn.vehicleNumber || "N/A"}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Delivered By
													</p>
													<p>{grn.deliveredBy || "N/A"}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Received By
													</p>
													<p>{grn.receivedBy || "N/A"}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Receipt Date
													</p>
													<p>
														{formatDate(grn.receiptDate)} {grn.receiptTime}
													</p>
												</div>
											</div>
										</div>

										<Separator />

										<div>
											<h3 className="text-lg font-semimedium flex items-center gap-2 mb-4">
												<ClipboardCheckIcon className="w-5 h-5" /> Inspection
											</h3>
											<div className="grid grid-cols-2 gap-y-4 gap-x-8">
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Inspected By
													</p>
													<p>{grn.inspectedBy || "N/A"}</p>
												</div>
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Result
													</p>
													<p>{grn.inspectionResult || "N/A"}</p>
												</div>
												<div className="col-span-2">
													<p className="text-sm font-medium text-muted-foreground">
														Inspection Notes
													</p>
													<p className="text-sm mt-1">
														{grn.inspectionNotes || "No notes recorded."}
													</p>
												</div>
											</div>
										</div>
									</div>

									<div className="space-y-6">
										<div>
											<h3 className="text-lg font-semimedium flex items-center gap-2 mb-4">
												<FileTextIcon className="w-5 h-5" /> Notes & Discrepancies
											</h3>
											<div className="space-y-4">
												{grn.discrepancies && (
													<div className="bg-red-50 p-4 rounded-md border border-red-100">
														<h4 className="text-sm font-semimedium text-red-800 flex items-center gap-2 mb-2">
															<AlertTriangleIcon className="w-4 h-4" />{" "}
															Discrepancies
														</h4>
														<p className="text-sm text-red-700">
															{grn.discrepancies}
														</p>
													</div>
												)}
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														General Notes
													</p>
													<p className="text-sm mt-1">
														{grn.notes || "No general notes."}
													</p>
												</div>
												{grn.returnNote && (
													<div>
														<p className="text-sm font-medium text-muted-foreground">
															Return Note
														</p>
														<p className="text-sm mt-1">{grn.returnNote}</p>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="financials" className="mt-6">
								<div className="max-w-md border rounded-md p-6">
									<h3 className="text-lg font-semimedium mb-4">
										Financial Breakdown
									</h3>
									<div className="space-y-4">
										<div className="flex justify-between items-center py-2 border-b">
											<span className="text-muted-foreground">Total Amount</span>
											<span className="font-medium">
												{formatCurrency(grn.totalAmount)}
											</span>
										</div>
										<div className="flex justify-between items-center py-2 border-b">
											<span className="text-muted-foreground">Tax Amount</span>
											<span className="font-medium">
												{formatCurrency(grn.taxAmount)}
											</span>
										</div>
										<div className="flex justify-between items-center py-2 border-b">
											<span className="text-muted-foreground">Discount</span>
											<span className="font-medium text-green-600">
												-{formatCurrency(grn.discountAmount)}
											</span>
										</div>
										<div className="flex justify-between items-center py-2 pt-4">
											<span className="text-lg font-medium">Net Amount</span>
											<span className="text-lg font-medium text-primary">
												{formatCurrency(grn.netAmount)}
											</span>
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
