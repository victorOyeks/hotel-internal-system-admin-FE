"use client";

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
import { formatCurrency } from "@/lib/utils";
import type { InventoryStockTakeResponse } from "@/lib/fetch";
import { Progress } from "@/components/ui/progress";

interface StockTakeDetailsProps {
	stockTake: InventoryStockTakeResponse | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onComplete: (id: string) => void;
	onPostAdjustments: (id: string) => void;
}

export function StockTakeDetails({
	stockTake,
	open,
	onOpenChange,
	onComplete,
	onPostAdjustments,
}: StockTakeDetailsProps) {
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

				<div className="grid grid-cols-3 gap-6 py-4">
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Location
						</p>
						<p className="text-lg font-semibold">{stockTake.locationName}</p>
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">Type</p>
						<p className="text-lg font-semibold">{stockTake.stockTakeType}</p>
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Scheduled Date
						</p>
						<p className="text-lg font-semibold">
							{new Date(stockTake.scheduledDate).toLocaleDateString()}
						</p>
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Supervisor
						</p>
						<p className="text-lg font-semibold">{stockTake.supervisorName}</p>
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Progress
						</p>
						<div className="space-y-1 mt-1">
							<div className="flex justify-between text-xs">
								<span>
									{stockTake.countedItems}/{stockTake.totalItems} Items
								</span>
								<span>{progress.toFixed(0)}%</span>
							</div>
							<Progress value={progress} className="h-2" />
						</div>
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">
							Total Variance
						</p>
						<p
							className={`text-lg font-semibold ${
								stockTake.totalVarianceValue < 0
									? "text-red-600"
									: stockTake.totalVarianceValue > 0
										? "text-orange-600"
										: "text-green-600"
							}`}
						>
							{formatCurrency(stockTake.totalVarianceValue)}
						</p>
					</div>
				</div>

				<Separator />

				<div className="space-y-4">
					<h3 className="font-semibold text-lg">Items</h3>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Product</TableHead>
									<TableHead className="text-right">System Qty</TableHead>
									<TableHead className="text-right">Actual Qty</TableHead>
									<TableHead className="text-right">Variance</TableHead>
									<TableHead className="text-right">Value</TableHead>
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
											</div>
										</TableCell>
										<TableCell className="text-right">
											{item.systemQuantity}
										</TableCell>
										<TableCell className="text-right">
											{item.actualQuantity ?? "-"}
										</TableCell>
										<TableCell className="text-right">
											{item.variance !== 0 ? (
												<span
													className={
														item.variance < 0
															? "text-red-600"
															: "text-orange-600"
													}
												>
													{item.variance > 0 ? "+" : ""}
													{item.variance}
												</span>
											) : (
												"-"
											)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(item.varianceValue)}
										</TableCell>
										<TableCell>
											{item.isCounted ? (
												<Badge variant="outline" className="text-green-600">
													Counted
												</Badge>
											) : (
												<Badge variant="outline" className="text-gray-500">
													Pending
												</Badge>
											)}
											{item.requiresInvestigation && (
												<Badge
													variant="outline"
													className="ml-2 text-red-600 border-red-200 bg-red-50"
												>
													Investigate
												</Badge>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-4">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
					{stockTake.status === "PENDING_REVIEW" && (
						<Button onClick={() => onComplete(stockTake.id)}>
							Complete & Approve
						</Button>
					)}
					{stockTake.status === "COMPLETED" && (
						<Button onClick={() => onPostAdjustments(stockTake.id)}>
							Post Adjustments
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
