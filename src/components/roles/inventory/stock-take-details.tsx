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
import { Textarea } from "@/components/ui/textarea";

import { formatCurrency } from "@/lib/utils";
import type { StockTake } from "@/lib/fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	Calendar,
	User,
	ClipboardList,
	Loader2,
	MapPin,
	// RefreshCw,
} from "lucide-react";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStockTake } from "@/lib/inventory-actions";
import { StockTakeItemsTable } from "./stock-take-items-table";
import { toast } from "sonner";

export interface StockTakeDetailsProps {
	stockTake?: StockTake | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onComplete: (id: string) => Promise<any>;
	onReview: (id: string) => Promise<any>;
	onPostAdjustments: (id: string) => Promise<any>;
	onStart: (id: string) => Promise<any>;
	onCancel: (id: string, reason: string) => Promise<any>;
	onRecordCount: (stockTakeId: string, itemId: string, quantity: number) => Promise<any>;
}

export function StockTakeDetails({
	stockTake: initialStockTake,
	open,
	onOpenChange,
	onComplete,
	onReview,
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
		enabled: !!initialStockTake?.id && open,
	});

	const stockTake = stockTakeResponse || initialStockTake;

	const recordCountMutation = useMutation({
		mutationFn: async ({
			stockTakeId,
			itemId,
			quantity,
		}: {
			stockTakeId: string;
			itemId: string;
			quantity: number;
		}) => {
			const res = await onRecordCount(stockTakeId, itemId, quantity);
			if (res && !res.success) {
				throw new Error(res.error || "Failed to record count");
			}
			return res;
		},
		onSuccess: (_, { stockTakeId }) => {
			// toast.success("Count recorded"); // Optional, simpler if quiet
			queryClient.invalidateQueries({ queryKey: ["stock-take", stockTakeId] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const startMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await onStart(id);
			if (res && !res.success) {
				throw new Error(res.error || "Failed to start stock take");
			}
			return res;
		},
		onSuccess: (_, id) => {
			toast.success("Stock take started");
			queryClient.invalidateQueries({ queryKey: ["stock-take", id] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
			const res = await onCancel(id, reason);
			if (res && !res.success) {
				throw new Error(res.error || "Failed to cancel stock take");
			}
			return res;
		},
		onSuccess: (_, { id }) => {
			toast.success("Stock take cancelled");
			queryClient.invalidateQueries({ queryKey: ["stock-take", id] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const completeMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await onComplete(id);
			if (res && !res.success) {
				throw new Error(res.error || "Failed to complete stock take");
			}
			return res;
		},
		onSuccess: (_, id) => {
			toast.success("Stock take completed");
			queryClient.invalidateQueries({ queryKey: ["stock-take", id] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const postAdjustmentsMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await onPostAdjustments(id);
			if (res && !res.success) {
				throw new Error(res.error || "Failed to post adjustments");
			}
			return res;
		},
		onSuccess: (_, id) => {
			toast.success("Adjustments posted successfully");
			queryClient.invalidateQueries({ queryKey: ["stock-take", id] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const reviewMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await onReview(id);
			if (res && !res.success) {
				throw new Error(res.error || "Failed to review stock take");
			}
			return res;
		},
		onSuccess: (_, id) => {
			toast.success("Stock take reviewed and approved");
			queryClient.invalidateQueries({ queryKey: ["stock-take", id] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	if (!stockTake) return null;

	const contentProps: Omit<StockTakeContentProps, "isMobile"> = {
		stockTake,
		onClose: () => onOpenChange(false),
		isLoading: isPending,
		isStarting: startMutation.isPending,
		isCanceling: cancelMutation.isPending,
		isCompleting: completeMutation.isPending,
		isReviewing: reviewMutation.isPending,
		isPosting: postAdjustmentsMutation.isPending,
		startStockTake: (id) => startMutation.mutate(id),
		cancelStockTake: (id, reason) => cancelMutation.mutate({ id, reason }),
		completeStockTake: (id) => completeMutation.mutate(id),
		reviewStockTake: (id) => reviewMutation.mutate(id),
		postAdjustments: (id) => postAdjustmentsMutation.mutate(id),
		recordCount: (stockTakeId, itemId, quantity) =>
			recordCountMutation.mutate({ stockTakeId, itemId, quantity }),
	};

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
					<StockTakeContent {...contentProps} isMobile={true} />
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
				<StockTakeContent {...contentProps} isMobile={false} />
			</DialogContent>
		</Dialog>
	);
}

function StatusBadge({ status }: { status: string }) {
	const statusStyles: Record<string, string> = {
		SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
		IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
		PENDING_REVIEW: "bg-orange-50 text-orange-700 border-orange-200",
		REVIEWED: "bg-purple-50 text-purple-700 border-purple-200",
		COMPLETED: "bg-green-50 text-green-700 border-green-200",
		CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
	};
	return (
		<Badge variant="outline" className={statusStyles[status] ?? ""}>
			{status.replace(/_/g, " ")}
		</Badge>
	);
}

interface StockTakeContentProps {
	stockTake: StockTake;
	onClose: () => void;
	isLoading: boolean;
	isMobile: boolean;

	// Mutations state & handlers
	isStarting: boolean;
	isCanceling: boolean;
	isCompleting: boolean;
	isReviewing: boolean;
	isPosting: boolean;

	startStockTake: (id: string) => void;
	cancelStockTake: (id: string, reason: string) => void;
	completeStockTake: (id: string) => void;
	reviewStockTake: (id: string) => void;
	postAdjustments: (id: string) => void;
	recordCount: (stockTakeId: string, itemId: string, quantity: number) => void;
}

function StockTakeContent({
	stockTake,
	onClose,
	isLoading,
	isMobile,

	isStarting,
	isCanceling,
	isCompleting,
	isReviewing,
	isPosting,

	startStockTake,
	cancelStockTake,
	completeStockTake,
	reviewStockTake,
	postAdjustments,
	recordCount,
}: StockTakeContentProps) {
	const isEditing = stockTake.status === "IN_PROGRESS";
	const [showCancelPanel, setShowCancelPanel] = useState(false);
	const [cancelReason, setCancelReason] = useState("");

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

	return (
		<div className="space-y-6">
			<div
				className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-3 gap-8"} py-6`}
			>
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
						{stockTake.totalValueVariance.toFixed(2)}
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-lg">Items</h3>
				</div>

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
											{isEditing ? (
												<input
													type="number"
													defaultValue={item.actualQuantity ?? ""}
													className="w-20 border rounded px-1"
													onBlur={(e) => {
														const val = parseFloat(e.target.value);
														if (!Number.isNaN(val)) {
															recordCount(stockTake.id, item.id, val);
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
							recordCount(stockTake.id, itemId, quantity)
						}
					/>
				)}
			</div>

			{/* Cancel reason panel */}
			{showCancelPanel && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
					<p className="text-sm font-medium text-red-800">Reason for Cancellation</p>
					<Textarea
						placeholder="Enter a reason for cancelling this stock take..."
						value={cancelReason}
						onChange={(e) => setCancelReason(e.target.value)}
						rows={3}
						className="bg-white"
					/>
					<div className="flex gap-2 justify-end">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setShowCancelPanel(false);
								setCancelReason("");
							}}
							disabled={isCanceling}
						>
							Back
						</Button>
						<Button
							variant="destructive"
							size="sm"
							disabled={!cancelReason.trim() || isCanceling}
							onClick={() => {
								cancelStockTake(stockTake.id, cancelReason.trim());
								setShowCancelPanel(false);
								setCancelReason("");
							}}
						>
							{isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Confirm Cancel
						</Button>
					</div>
				</div>
			)}

			<div className="flex justify-end gap-2 pt-4">
				<Button
					variant="outline"
					onClick={onClose}
					disabled={isStarting || isCanceling || isCompleting || isReviewing || isPosting}
				>
					Close
				</Button>
				{/* SCHEDULED → start or cancel */}
				{stockTake.status === "SCHEDULED" && !showCancelPanel && (
					<>
						<Button
							variant="outline"
							className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
							onClick={() => setShowCancelPanel(true)}
							disabled={isStarting}
						>
							Cancel
						</Button>
						<Button onClick={() => startStockTake(stockTake.id)} disabled={isStarting || isCanceling}>
							{isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Start Stock Take
						</Button>
					</>
				)}
				{/* IN_PROGRESS → mark complete (moves to PENDING_REVIEW) or cancel */}
				{stockTake.status === "IN_PROGRESS" && !showCancelPanel && (
					<>
						<Button
							variant="outline"
							className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
							onClick={() => setShowCancelPanel(true)}
							disabled={isCompleting}
						>
							Cancel
						</Button>
						<Button
							onClick={() => completeStockTake(stockTake.id)}
							disabled={isCompleting || isCanceling}
						>
							{isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Mark as Complete
						</Button>
					</>
				)}
				{/* PENDING_REVIEW → review (moves to REVIEWED) */}
				{stockTake.status === "PENDING_REVIEW" && (
					<Button
						onClick={() => reviewStockTake(stockTake.id)}
						disabled={isReviewing}
					>
						{isReviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Review & Approve
					</Button>
				)}
				{/* REVIEWED → post adjustments (moves to COMPLETED) */}
				{stockTake.status === "REVIEWED" && (
					<Button
						onClick={() => postAdjustments(stockTake.id)}
						disabled={isPosting}
					>
						{isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Post Adjustments
					</Button>
				)}
				{/* COMPLETED / CANCELLED: no further actions */}
			</div>
		</div>
	);
}
