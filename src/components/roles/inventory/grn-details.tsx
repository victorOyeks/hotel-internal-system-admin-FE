import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
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
import {
	CheckCircleIcon,
	AlertCircleIcon,
	PackageCheckIcon,
} from "lucide-react";
import type { InventoryGRNResponse } from "@/lib/fetch";

interface GRNDetailsProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	grn: InventoryGRNResponse | null;
	onPostToStock: (id: string) => void;
}

export function GRNDetails({
	open,
	onOpenChange,
	grn,
	onPostToStock,
}: GRNDetailsProps) {
	if (!grn) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>GRN Details - {grn.grnNumber}</DialogTitle>
						{/* Status Badges */}
						<div className="flex gap-2">
							<Badge
								variant={grn.status === "ACCEPTED" ? "default" : "secondary"}
							>
								{grn.status}
							</Badge>
							{grn.stockPosted ? (
								<Badge
									variant="outline"
									className="bg-green-50 text-green-700 border-green-200"
								>
									<CheckCircleIcon className="w-3 h-3 mr-1" /> Posted
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="bg-orange-50 text-orange-700 border-orange-200"
								>
									<AlertCircleIcon className="w-3 h-3 mr-1" /> Unposted
								</Badge>
							)}
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6">
					{/* Header Info Section */}
					<div className="grid grid-cols-2 gap-6">
						{/* ... (Existing Info Logic) ... */}
						<div className="space-y-3">
							<p>
								<strong>Supplier:</strong> {grn.supplierName}
							</p>
							<p>
								<strong>Location:</strong> {grn.storageLocationName}
							</p>
						</div>
						<div className="space-y-3">
							<p>
								<strong>Receipt:</strong>{" "}
								{new Date(grn.receiptDate).toLocaleDateString()} at{" "}
								{grn.receiptTime}
							</p>
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
									<TableHead className="text-center">Received</TableHead>
									<TableHead className="text-center">Accepted</TableHead>
									<TableHead className="text-center">Rejected</TableHead>
									<TableHead className="text-right">Unit Price</TableHead>
									<TableHead className="text-right">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{grn.items.map((item) => (
									<TableRow key={item.id}>
										<TableCell>{item.productName}</TableCell>
										<TableCell className="text-center">
											{item.quantityReceived}
										</TableCell>
										<TableCell className="text-center text-green-600">
											{item.quantityAccepted}
										</TableCell>
										<TableCell className="text-center text-red-600">
											{item.quantityRejected > 0 ? item.quantityRejected : "-"}
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

					{/* Action Footer */}
					{!grn.stockPosted && (
						<div className="flex justify-end gap-2 pt-4 border-t">
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								Close
							</Button>
							<Button onClick={() => onPostToStock(grn.id)}>
								<PackageCheckIcon className="w-4 h-4 mr-2" /> Post to Stock
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
