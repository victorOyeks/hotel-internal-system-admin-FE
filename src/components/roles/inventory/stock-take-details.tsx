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

import { formatCurrency } from "@/lib/utils";
import type { StockTake } from "@/lib/fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	Calendar,
	User,
	ClipboardList,
	Loader2,
	MapPin,
} from "lucide-react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStockTake } from "@/lib/inventory-actions";
import { StockTakeItemsTable } from "./stock-take-items-table";
import { useState } from "react";
import { toast } from "sonner";

export interface StockTakeDetailsProps {
	stockTake?: StockTake | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onComplete: (id: string) => Promise<any>;
	onPostAdjustments: (id: string) => Promise<any>;
	onStart: (id: string) => Promise<any>;
	onCancel: (id: string) => Promise<any>;
	onRecordCount: (stockTakeId: string, itemId: string, quantity: number) => Promise<any>;
}

export function StockTakeDetails({
	stockTake: initialStockTake,
	open,
	onOpenChange,
	onComplete,
	onPostAdjustments,
	onStart,
	onCancel,
	onRecordCount,
}: StockTakeDetailsProps) {
	const isMobile = useIsMobile();
	const queryClient = useQueryClient();

	const { data: stockTakeResponse, isPending } = useQuery({
		queryKey: ["stock-take", initialStockTake?.id],
		queryFn: async () => {
			if (!initialStockTake?.id) throw new Error("No ID");
			const res = await getStockTake(initialStockTake.id);
			if (!res.success || !res.data) throw new Error(res.error);
			return res.data;
		},
	});

	const stockTake = stockTakeResponse || initialStockTake;

	const handleRecordCount = async (stockTakeId: string, itemId: string, quantity: number) => {
		const res = await onRecordCount(stockTakeId, itemId, quantity);
		if (res && !res.success) {
			toast.error(res.error || "Failed to record count");
		}
		await queryClient.invalidateQueries({ queryKey: ["stock-take", stockTakeId] });
	};

	const handleStart = async (id: string) => {
		const res = await onStart(id);
		if (res && !res.success) {
			toast.error(res.error || "Failed to start stock take");
		} else {
			toast.success("Stock take started");
		}
		await queryClient.invalidateQueries({ queryKey: ["stock-take", id] });
	};

	const handleCancel = async (id: string) => {
		const res = await onCancel(id);
		if (res && !res.success) {
			toast.error(res.error || "Failed to cancel stock take");
		} else {
			toast.success("Stock take cancelled");
		}
		await queryClient.invalidateQueries({ queryKey: ["stock-take", id] });
	};

	// Note: handling Complete and PostAdjustments might also require invalidation or closing dialog.
	// The parent closes the dialog on complete/post.

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
						onStart={handleStart}
						onCancel={handleCancel}
						onRecordCount={handleRecordCount}
						isMobile={true}
						isLoading={isPending}
					/>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl! max-h-[90vh] overflow-y-auto">
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
					onStart={handleStart}
					onCancel={handleCancel}
					onRecordCount={handleRecordCount}
					isMobile={false}
					isLoading={isPending}
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
					? "green"
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
	onComplete: (id: string) => Promise<any>;
	onPostAdjustments: (id: string) => Promise<any>;
	onStart: (id: string) => Promise<any>;
	onCancel: (id: string) => Promise<any>;
	onRecordCount: (stockTakeId: string, itemId: string, quantity: number) => Promise<any>;
	isMobile: boolean;
	isLoading: boolean;
}

function StockTakeContent({
	stockTake,
	onClose,
	onComplete,
	onPostAdjustments,
	onStart,
	onCancel,
	onRecordCount,
	isMobile,
	isLoading,
}: StockTakeContentProps) {
	const isEditing = stockTake.status === "IN_PROGRESS";

	const [isStarting, setIsStarting] = useState(false);
	const [isCanceling, setIsCanceling] = useState(false);
	const [isCompleting, setIsCompleting] = useState(false);
	const [isPosting, setIsPosting] = useState(false);

	if (isLoading) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground">Loading stock take details...</p>
				</div>
			</div>
		);
	}

	const handleStart = async () => {
		setIsStarting(true);
		try {
			const res = await onStart(stockTake.id);
			if (res && !res.success) {
				toast.error(res.error || "Failed to start stock take");
			} else {
				toast.success("Stock take started");
			}
		} finally {
			setIsStarting(false);
		}
	};

	const handleCancel = async () => {
		setIsCanceling(true);
		try {
			const res = await onCancel(stockTake.id);
			if (res && !res.success) {
				toast.error(res.error || "Failed to cancel stock take");
			} else {
				toast.success("Stock take cancelled");
			}
		} finally {
			setIsCanceling(false);
		}
	};

	const handleComplete = async () => {
		setIsCompleting(true);
		try {
			const res = await onComplete(stockTake.id);
			if (res && !res.success) {
				toast.error(res.error || "Failed to complete stock take");
			} else {
				toast.success("Stock take completed");
			}
		} finally {
			setIsCompleting(false);
		}
	};

	const handlePostAdjustments = async () => {
		setIsPosting(true);
		try {
			const res = await onPostAdjustments(stockTake.id);
			if (res && !res.success) {
				toast.error(res.error || "Failed to post adjustments");
			} else {
				toast.success("Adjustments posted");
			}
		} finally {
			setIsPosting(false);
		}
	};

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
											{/* <p>{item.actualQuantity ?? "-"}</p> */}
											{isEditing ? (
												<input
													type="number"
													defaultValue={item.actualQuantity ?? ""}
													className="w-20 border rounded px-1"
													onBlur={(e) => {
														const val = parseFloat(e.target.value);
														if (!Number.isNaN(val)) {
															onRecordCount(stockTake.id, item.id, val);
														}
													}}
												/>
											) : (
												<p>{item.actualQuantity ?? "-"}</p>
											)}
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
					<StockTakeItemsTable
						data={stockTake.items || []}
						isEditing={isEditing}
						onRecordCount={(itemId, quantity) =>
							onRecordCount(stockTake.id, itemId, quantity)
						}
					/>
				)}
			</div>

			<div className="flex justify-end gap-2 pt-4">
				<Button variant="outline" onClick={onClose} disabled={isStarting || isCanceling || isCompleting || isPosting}>
					Close
				</Button>
				{stockTake.status === "SCHEDULED" && (
					<>
						<Button
							variant="destructive"
							onClick={handleCancel}
							disabled={isCanceling || isStarting}
						>
							{isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Cancel
						</Button>
						<Button
							onClick={handleStart}
							disabled={isStarting || isCanceling}
						>
							{isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Start Stock Take
						</Button>
					</>
				)}
				{stockTake.status === "IN_PROGRESS" && (
					<Button
						variant="destructive"
						onClick={handleCancel}
						disabled={isCanceling}
					>
						{isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Cancel (Stop)
					</Button>
				)}
				{stockTake.status === "PENDING_REVIEW" && (
					<Button
						onClick={handleComplete}
						disabled={isCompleting}
					>
						{isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Complete & Approve
					</Button>
				)}
				{stockTake.status === "COMPLETED" && (
					<Button
						onClick={handlePostAdjustments}
						disabled={isPosting}
					>
						{isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Post Adjustments
					</Button>
				)}
			</div>
		</div >
	);
}
