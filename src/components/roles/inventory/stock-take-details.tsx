import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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
import type { StockTake } from "@/lib/fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	MapPin,
	Calendar,
	User,
	ClipboardList,
} from "lucide-react";

interface StockTakeDetailsProps {
	stockTake: StockTake | null;
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
	const isMobile = useIsMobile();

	if (!stockTake) return null;

	if (isMobile) {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
					<SheetHeader>
						<div className="flex items-center justify-between mr-4">
							<SheetTitle>Stock Take - {stockTake.stockTakeNumber}</SheetTitle>
							<StatusBadge status={stockTake.status} />
						</div>
					</SheetHeader>
					<StockTakeContent
						stockTake={stockTake}
						onClose={() => onOpenChange(false)}
						onComplete={onComplete}
						onPostAdjustments={onPostAdjustments}
						isMobile={true}
					/>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl! max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between mr-8">
						<DialogTitle>Stock Take - {stockTake.stockTakeNumber}</DialogTitle>
						<StatusBadge status={stockTake.status} />
					</div>
				</DialogHeader>
				<StockTakeContent
					stockTake={stockTake}
					onClose={() => onOpenChange(false)}
					onComplete={onComplete}
					onPostAdjustments={onPostAdjustments}
					isMobile={false}
				/>
			</DialogContent>
		</Dialog>
	);
}

function StatusBadge({ status }: { status: string }) {
	return (
		<Badge
			variant={
				status === "COMPLETED"
					? "default"
					: status === "IN_PROGRESS"
						? "secondary"
						: "outline"
			}
		>
			{status.replace(/_/g, " ")}
		</Badge>
	);
}

interface StockTakeContentProps {
	stockTake: StockTake;
	onClose: () => void;
	onComplete: (id: string) => void;
	onPostAdjustments: (id: string) => void;
	isMobile: boolean;
}

function StockTakeContent({
	stockTake,
	onClose,
	onComplete,
	onPostAdjustments,
	isMobile,
}: StockTakeContentProps) {
	return (
		<div className="space-y-6">
			<div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-3 gap-8"} py-6`}>
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-muted-foreground">
						<MapPin className="w-4 h-4" />
						<span className="text-sm font-medium">Location</span>
					</div>
					<p className="text-lg font-medium tracking-tight">
						{stockTake.locationName}
					</p>
				</div>

				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-muted-foreground">
						<ClipboardList className="w-4 h-4" />
						<span className="text-sm font-medium">Type</span>
					</div>
					<p className="text-lg font-medium tracking-tight">
						{stockTake.stockTakeType}
					</p>
				</div>

				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Calendar className="w-4 h-4" />
						<span className="text-sm font-medium">Scheduled Date</span>
					</div>
					<p className="text-lg font-medium tracking-tight">
						{new Date(stockTake.scheduledDate).toLocaleDateString()}
					</p>
				</div>

				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-muted-foreground">
						<User className="w-4 h-4" />
						<span className="text-sm font-medium">Supervisor</span>
					</div>
					<p className="text-lg font-medium tracking-tight">
						{stockTake.supervisorName}
					</p>
				</div>

				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-muted-foreground">
						<span className="text-sm font-medium">Total Variance</span>
					</div>
					<p
						className={`text-lg font-medium tracking-tight ${stockTake.totalValueVariance < 0
							? "text-red-600"
							: stockTake.totalValueVariance > 0
								? "text-orange-600"
								: "text-green-600"
							}`}
					>
						{(stockTake.totalValueVariance).toFixed(2)}
					</p>
				</div>
			</div>

			<Separator />

			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Items</h3>
				{isMobile ? (
					<div className="space-y-4">
						{(stockTake.items || []).map((item) => (
							<Card key={item.id}>
								<CardContent className="pt-6">
									<div className="flex justify-between items-start mb-4">
										<div>
											<p className="font-medium">{item.productName}</p>
											<p className="text-sm text-muted-foreground">
												{item.productSku}
											</p>
										</div>
										<div>
											{item.counted ? (
												<Badge variant="outline" className="text-green-600">
													Counted
												</Badge>
											) : (
												<Badge variant="outline" className="text-gray-500">
													Pending
												</Badge>
											)}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<p className="text-muted-foreground">System Qty</p>
											<p>{item.systemQuantity}</p>
										</div>
										<div>
											<p className="text-muted-foreground">Actual Qty</p>
											<p>{item.actualQuantity ?? "-"}</p>
										</div>
										<div>
											<p className="text-muted-foreground">Variance</p>
											<p
												className={
													item.varianceQuantity !== 0
														? item.varianceQuantity < 0
															? "text-red-600"
															: "text-orange-600"
														: ""
												}
											>
												{item.varianceQuantity !== 0
													? (item.varianceQuantity > 0 ? "+" : "") +
													item.varianceQuantity
													: "-"}
											</p>
										</div>
										<div>
											<p className="text-muted-foreground">Value</p>
											<p>{formatCurrency(item.varianceValue)}</p>
										</div>
									</div>

									{item.requiresInvestigation && (
										<div className="mt-4">
											<Badge
												variant="outline"
												className="text-red-600 border-red-200 bg-red-50 w-full justify-center"
											>
												Requires Investigation
											</Badge>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="rounded-md border overflow-x-auto">
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
								{(stockTake.items || []).map((item) => (
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
											{item.varianceQuantity !== 0 ? (
												<span
													className={
														item.varianceQuantity < 0
															? "text-red-600"
															: "text-orange-600"
													}
												>
													{item.varianceQuantity > 0 ? "+" : ""}
													{item.varianceQuantity}
												</span>
											) : (
												"-"
											)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(item.varianceValue)}
										</TableCell>
										<TableCell>
											{item.counted ? (
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
				)}
			</div>

			<div className="flex justify-end gap-2 pt-4">
				<Button variant="outline" onClick={onClose}>
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
		</div>
	);
}
