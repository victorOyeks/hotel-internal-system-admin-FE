import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { formatCurrency } from "@/lib/utils";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import type { InventoryPurchaseOrderResponse } from "@/lib/fetch";

interface PurchaseOrderDetailsProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	order: InventoryPurchaseOrderResponse;
}

export function PurchaseOrderDetails({
	open,
	onOpenChange,
	order,
}: PurchaseOrderDetailsProps) {
	if (!order) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{order.poNumber}</DialogTitle>
					<DialogDescription>Purchase Order Details</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<Badge variant="outline" className="text-base">
							{order.status.replace(/_/g, " ")}
						</Badge>
						{order.status === "PENDING_APPROVAL" && (
							<div className="flex gap-2">
								<Button variant="outline" size="sm">
									<XCircleIcon className="w-4 h-4 mr-2" />
									Reject
								</Button>
								<Button size="sm">
									<CheckCircleIcon className="w-4 h-4 mr-2" />
									Approve
								</Button>
							</div>
						)}
					</div>

					{/* Order Info */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Supplier</p>
							<p className="font-semibold">{order.supplierName}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Order Date</p>
							<p className="font-semibold">
								{new Date(order.orderDate).toLocaleDateString()}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Expected Delivery</p>
							<p className="font-semibold">
								{new Date(order.expectedDeliveryDate).toLocaleDateString()}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Payment Terms</p>
							<p className="font-semibold">{order.paymentTerms || "N/A"}</p>
						</div>
					</div>

					<Separator />

					{/* Items */}
					<div>
						<h3 className="font-semibold mb-3">Order Items</h3>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>SKU</TableHead>
									<TableHead>Product</TableHead>
									<TableHead className="text-right">Quantity</TableHead>
									<TableHead className="text-right">Unit Price</TableHead>
									<TableHead className="text-right">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{order.items.map((item) => (
									<TableRow key={item.id}>
										<TableCell className="font-mono text-sm">
											{item.productSku}
										</TableCell>
										<TableCell>{item.productName}</TableCell>
										<TableCell className="text-right">
											{item.quantityOrdered} {item.unit}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(item.unitPrice)}
										</TableCell>
										<TableCell className="text-right font-semibold">
											{formatCurrency(item.lineTotal)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<Separator />

					{/* Totals */}
					<div className="space-y-2">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Subtotal:</span>
							<span className="font-semibold">
								{formatCurrency(order.subtotal)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Shipping:</span>
							<span className="font-semibold">
								{formatCurrency(order.shippingCost)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tax:</span>
							<span className="font-semibold">
								{formatCurrency(order.taxAmount)}
							</span>
						</div>
						<Separator />
						<div className="flex justify-between text-lg">
							<span className="font-bold">Total:</span>
							<span className="font-bold">
								{formatCurrency(order.totalAmount)}
							</span>
						</div>
					</div>

					{/* Additional Info */}
					{order.approvedBy && (
						<div className="bg-muted/50 p-4 rounded-lg">
							<p className="text-sm text-muted-foreground">Approved By</p>
							<p className="font-semibold">{order.approvedBy}</p>
							<p className="text-xs text-muted-foreground">
								{order.approvedAt &&
									new Date(order.approvedAt).toLocaleString()}
							</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
