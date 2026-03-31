"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { useSetAtom } from "jotai";
import {
	CheckCircleIcon,
	ClipboardListIcon,
	ClockIcon,
	FileTextIcon,
	InboxIcon,
	PackageIcon,
	WineIcon,
	XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import {
	approveRequest,
	rejectRequest,
	reviewBarRestockRequest,
} from "@/lib/manager-actions";
import { toast } from "sonner";
import type { APIOutput } from "@/lib/action-utils";
import { revalidateRoute } from "@/lib/actions";

type SummaryData =
	APIOutput<"@get/api/manager/approvals/pending/summary">["data"];
type PendingPage = APIOutput<"@get/api/manager/approvals/pending">["data"];
type ApprovalItem = PendingPage["content"][number];
type BarRestockItem =
	APIOutput<"@get/api/restaurants/bar-restock-requests">["data"]["content"][number];

// ==================== Summary Cards ====================
function SummaryCards({
	data,
	barRestockCount,
}: {
	data: SummaryData;
	barRestockCount: number;
}) {
	const cards = [
		{
			title: "Purchase Orders",
			value: data.pendingPurchaseOrders,
			icon: PackageIcon,
			bgClass: "bg-blue-50",
			textClass: "text-blue-600",
			ringClass: "ring-blue-100",
		},
		{
			title: "Goods Receipt Notes",
			value: data.pendingGRNs,
			icon: FileTextIcon,
			bgClass: "bg-amber-50",
			textClass: "text-amber-600",
			ringClass: "ring-amber-100",
		},
		{
			title: "Stock Takes",
			value: data.pendingStockTakes,
			icon: ClipboardListIcon,
			bgClass: "bg-violet-50",
			textClass: "text-violet-600",
			ringClass: "ring-violet-100",
		},
		{
			title: "Bar Restock",
			value: barRestockCount,
			icon: WineIcon,
			bgClass: "bg-rose-50",
			textClass: "text-rose-600",
			ringClass: "ring-rose-100",
		},
	];

	const total = data.totalPending + barRestockCount;

	return (
		<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
			<div className="bg-white p-4 rounded-2xl flex flex-col justify-between md:col-span-1">
				<div className="flex items-center justify-between">
					<span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
						Total Pending
					</span>
					<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
						<ClockIcon className="size-4 text-primary" />
					</div>
				</div>
				<div className="mt-2">
					<p className="text-3xl font-bold text-primary">{total}</p>
					<p className="text-xs text-gray-400 mt-0.5">
						{total === 0
							? "all clear"
							: total === 1
								? "request awaiting review"
								: "requests awaiting review"}
					</p>
				</div>
			</div>
			{cards.map((card) => (
				<div
					key={card.title}
					className="bg-white p-4 rounded-2xl flex flex-col justify-between"
				>
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
							{card.title}
						</span>
						<div
							className={`size-8 rounded-lg ${card.bgClass} ring-1 ${card.ringClass} flex items-center justify-center`}
						>
							<card.icon className={`size-4 ${card.textClass}`} />
						</div>
					</div>
					<div className="mt-2">
						<p className="text-3xl font-bold text-primary">{card.value}</p>
						<p className="text-xs text-gray-400 mt-0.5">pending</p>
					</div>
				</div>
			))}
		</div>
	);
}

// ==================== Approval Actions Dialog ====================
function ApprovalActionDialog({
	item,
	action,
	open,
	onClose,
}: {
	item: ApprovalItem | null;
	action: "approve" | "reject";
	open: boolean;
	onClose: () => void;
}) {
	const [comments, setComments] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleSubmit = () => {
		if (!item) return;
		if (action === "reject" && !comments.trim()) {
			toast.error("Please provide a reason for rejection");
			return;
		}

		startTransition(async () => {
			const result =
				action === "approve"
					? await approveRequest(item.id, comments || undefined)
					: await rejectRequest(item.id, comments);

			if (result.success) {
				toast.success(
					`Request ${action === "approve" ? "approved" : "rejected"} successfully`,
				);
				onClose();
				setComments("");
				await revalidateRoute("/dashboard/approvals");
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{action === "approve" ? "Approve" : "Reject"} Request
					</DialogTitle>
					<DialogDescription>
						{action === "approve"
							? "Are you sure you want to approve this request?"
							: "Please provide a reason for rejecting this request."}
					</DialogDescription>
				</DialogHeader>
				{item && (
					<div className="space-y-3 py-2">
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span className="text-gray-500">Type:</span>{" "}
								<span className="font-medium">
									{item.entityType.replace(/_/g, " ")}
								</span>
							</div>
							<div>
								<span className="text-gray-500">Action:</span>{" "}
								<span className="font-medium">
									{item.actionType.replace(/_/g, " ")}
								</span>
							</div>
							<div>
								<span className="text-gray-500">Requested by:</span>{" "}
								<span className="font-medium">
									{item.requestedByName || item.requestedBy}
								</span>
							</div>
							{item.entityReference && (
								<div>
									<span className="text-gray-500">Reference:</span>{" "}
									<span className="font-medium">{item.entityReference}</span>
								</div>
							)}
						</div>
						<Textarea
							placeholder={
								action === "approve"
									? "Optional comments..."
									: "Reason for rejection (required)..."
							}
							value={comments}
							onChange={(e) => setComments(e.target.value)}
							rows={3}
						/>
					</div>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isPending}>
						Cancel
					</Button>
					<Button
						variant={action === "approve" ? "default" : "destructive"}
						onClick={handleSubmit}
						disabled={isPending}
					>
						{isPending
							? "Processing..."
							: action === "approve"
								? "Approve"
								: "Reject"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ==================== Pending Requests Table ====================
function PendingRequestsTable({ data }: { data: ApprovalItem[] }) {
	const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
	const [dialogAction, setDialogAction] = useState<"approve" | "reject">(
		"approve",
	);
	const [dialogOpen, setDialogOpen] = useState(false);

	const openDialog = (item: ApprovalItem, action: "approve" | "reject") => {
		setSelectedItem(item);
		setDialogAction(action);
		setDialogOpen(true);
	};

	if (data.length === 0) {
		return (
			<div className="bg-white p-10 rounded-2xl text-center">
				<div className="size-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
					<InboxIcon className="size-6 text-green-500" />
				</div>
				<p className="text-sm font-medium text-gray-700">You're all caught up</p>
				<p className="text-xs text-gray-400 mt-1">
					No pending approval requests at the moment
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="bg-white rounded-2xl overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-gray-50 text-left text-gray-500">
								<th className="px-4 py-3 font-medium">Type</th>
								<th className="px-4 py-3 font-medium">Action</th>
								<th className="px-4 py-3 font-medium">Reference</th>
								<th className="px-4 py-3 font-medium">Requested By</th>
								<th className="px-4 py-3 font-medium">Date</th>
								<th className="px-4 py-3 font-medium text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{data.map((item) => (
								<tr key={item.id} className="border-b last:border-0">
									<td className="px-4 py-3">
										<Badge variant="outline" className="capitalize">
											{item.entityType.replace(/_/g, " ").toLowerCase()}
										</Badge>
									</td>
									<td className="px-4 py-3 text-gray-700 capitalize">
										{item.actionType.replace(/_/g, " ").toLowerCase()}
									</td>
									<td className="px-4 py-3 text-gray-500">
										{item.entityReference || "-"}
									</td>
									<td className="px-4 py-3 text-gray-700">
										{item.requestedByName || item.requestedBy}
									</td>
									<td className="px-4 py-3 text-gray-500">
										{new Date(item.createdAt).toLocaleDateString("en-US", {
											month: "short",
											day: "2-digit",
											year: "numeric",
										})}
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex items-center justify-end gap-2">
											<Button
												size="sm"
												variant="outline"
												className="text-green-600 border-green-200 hover:bg-green-50"
												onClick={() => openDialog(item, "approve")}
											>
												<CheckCircleIcon className="size-4 mr-1" />
												Approve
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-red-600 border-red-200 hover:bg-red-50"
												onClick={() => openDialog(item, "reject")}
											>
												<XCircleIcon className="size-4 mr-1" />
												Reject
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<ApprovalActionDialog
				item={selectedItem}
				action={dialogAction}
				open={dialogOpen}
				onClose={() => {
					setDialogOpen(false);
					setSelectedItem(null);
				}}
			/>
		</>
	);
}

// ==================== Bar Restock Requests Table ====================
function BarRestockTable({ data, hotelId }: { data: BarRestockItem[]; hotelId: string }) {
	const [selectedItem, setSelectedItem] = useState<BarRestockItem | null>(null);
	const [dialogAction, setDialogAction] = useState<"approve" | "reject">(
		"approve",
	);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [isPending, startTransition] = useTransition();

	const openDialog = (item: BarRestockItem, action: "approve" | "reject") => {
		setSelectedItem(item);
		setDialogAction(action);
		setRejectReason("");
		setDialogOpen(true);
	};

	const handleSubmit = () => {
		if (!selectedItem) return;
		if (dialogAction === "reject" && !rejectReason.trim()) {
			toast.error("Please provide a reason for rejection");
			return;
		}

		startTransition(async () => {
			const res = await reviewBarRestockRequest(
				selectedItem.id,
				dialogAction === "approve" ? "APPROVED" : "REJECTED",
				hotelId,
			);

			if (res.success) {
				toast.success(res.data);
				setDialogOpen(false);
				setSelectedItem(null);
				await revalidateRoute("/dashboard/approvals");
			} else {
				toast.error(res.error);
			}
		});
	};

	if (data.length === 0) {
		return (
			<div className="bg-white p-10 rounded-2xl text-center">
				<div className="size-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
					<InboxIcon className="size-6 text-green-500" />
				</div>
				<p className="text-sm font-medium text-gray-700">No pending restock requests</p>
				<p className="text-xs text-gray-400 mt-1">
					Bar attendants haven't submitted any restock requests yet
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="bg-white rounded-2xl overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-gray-50 text-left text-gray-500">
								<th className="px-4 py-3 font-medium">Item</th>
								<th className="px-4 py-3 font-medium">Item ID</th>
								<th className="px-4 py-3 font-medium">In Stock</th>
								<th className="px-4 py-3 font-medium">Qty Requested</th>
								<th className="px-4 py-3 font-medium">Requested By</th>
								<th className="px-4 py-3 font-medium">Date</th>
								<th className="px-4 py-3 font-medium text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{data.map((item) => (
								<tr key={item.id} className="border-b last:border-0">
									<td className="px-4 py-3 font-medium text-gray-800">
										{item.barItemName}
									</td>
									<td className="px-4 py-3 text-gray-500">
										{item.barItemCustomId}
									</td>
									<td className="px-4 py-3">
										<span className={item.currentStock === 0 ? "text-red-500 font-medium" : item.currentStock <= 5 ? "text-amber-500 font-medium" : "text-gray-700"}>
											{item.currentStock} units
										</span>
									</td>
									<td className="px-4 py-3">
										<Badge variant="outline">{item.requestedQuantity} units</Badge>
									</td>
									<td className="px-4 py-3 text-gray-700">{item.requestedBy}</td>
									<td className="px-4 py-3 text-gray-500">
										{new Date(item.requestedAt).toLocaleDateString("en-US", {
											month: "short",
											day: "2-digit",
											year: "numeric",
										})}
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex items-center justify-end gap-2">
											<Button
												size="sm"
												variant="outline"
												className="text-green-600 border-green-200 hover:bg-green-50"
												onClick={() => openDialog(item, "approve")}
											>
												<CheckCircleIcon className="size-4 mr-1" />
												Approve
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-red-600 border-red-200 hover:bg-red-50"
												onClick={() => openDialog(item, "reject")}
											>
												<XCircleIcon className="size-4 mr-1" />
												Reject
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{dialogAction === "approve" ? "Approve" : "Reject"} Restock Request
						</DialogTitle>
						<DialogDescription>
							{dialogAction === "approve"
								? `Approve restock of ${selectedItem?.requestedQuantity} units of "${selectedItem?.barItemName}"?`
								: "Provide a reason for rejecting this restock request."}
						</DialogDescription>
					</DialogHeader>
					{dialogAction === "reject" && (
						<Textarea
							placeholder="Reason for rejection (required)..."
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={3}
						/>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDialogOpen(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							variant={dialogAction === "approve" ? "default" : "destructive"}
							onClick={handleSubmit}
							disabled={isPending}
						>
							{isPending
								? "Processing..."
								: dialogAction === "approve"
									? "Approve"
									: "Reject"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

// ==================== Bar Restock History Table ====================
function BarRestockHistoryTable({ data }: { data: BarRestockItem[] }) {
	const statusVariant: Record<string, BadgeVariant> = {
		APPROVED: "green",
		REJECTED: "destructive",
	};

	return (
		<div className="bg-white rounded-2xl overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-gray-50 text-left text-gray-500">
							<th className="px-4 py-3 font-medium">Item</th>
							<th className="px-4 py-3 font-medium">Item ID</th>
							<th className="px-4 py-3 font-medium">Qty Requested</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Requested By</th>
							<th className="px-4 py-3 font-medium">Date</th>
						</tr>
					</thead>
					<tbody>
						{data.map((item) => (
							<tr key={item.id} className="border-b last:border-0">
								<td className="px-4 py-3 font-medium text-gray-800">{item.barItemName}</td>
								<td className="px-4 py-3 text-gray-500">{item.barItemCustomId}</td>
								<td className="px-4 py-3">{item.requestedQuantity} units</td>
								<td className="px-4 py-3">
									<Badge variant={statusVariant[item.status] ?? "outline"} className="capitalize">
										{item.status.toLowerCase()}
									</Badge>
								</td>
								<td className="px-4 py-3 text-gray-700">{item.requestedBy}</td>
								<td className="px-4 py-3 text-gray-500">
									{new Date(item.requestedAt).toLocaleDateString("en-US", {
										month: "short",
										day: "2-digit",
										year: "numeric",
									})}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// ==================== History Table ====================
function HistoryTable({ data }: { data: ApprovalItem[] }) {
	const statusVariant: Record<string, BadgeVariant> = {
		APPROVED: "green",
		REJECTED: "destructive",
		PENDING: "yellow",
	};

	if (data.length === 0) {
		return (
			<div className="bg-white p-10 rounded-2xl text-center">
				<div className="size-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
					<ClipboardListIcon className="size-6 text-gray-400" />
				</div>
				<p className="text-sm font-medium text-gray-700">No history yet</p>
				<p className="text-xs text-gray-400 mt-1">
					Approved and rejected requests will appear here
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-2xl overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-gray-50 text-left text-gray-500">
							<th className="px-4 py-3 font-medium">Type</th>
							<th className="px-4 py-3 font-medium">Action</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Requested By</th>
							<th className="px-4 py-3 font-medium">Reviewed By</th>
							<th className="px-4 py-3 font-medium">Date</th>
						</tr>
					</thead>
					<tbody>
						{data.map((item) => (
							<tr key={item.id} className="border-b last:border-0">
								<td className="px-4 py-3">
									<Badge variant="outline" className="capitalize">
										{item.entityType.replace(/_/g, " ").toLowerCase()}
									</Badge>
								</td>
								<td className="px-4 py-3 text-gray-700 capitalize">
									{item.actionType.replace(/_/g, " ").toLowerCase()}
								</td>
								<td className="px-4 py-3">
									<Badge
										variant={statusVariant[item.status] ?? "outline"}
										className="capitalize"
									>
										{item.status.toLowerCase()}
									</Badge>
								</td>
								<td className="px-4 py-3 text-gray-700">
									{item.requestedByName || item.requestedBy}
								</td>
								<td className="px-4 py-3 text-gray-500">
									{item.reviewedByName || item.reviewedBy || "-"}
								</td>
								<td className="px-4 py-3 text-gray-500">
									{new Date(item.createdAt).toLocaleDateString("en-US", {
										month: "short",
										day: "2-digit",
										year: "numeric",
									})}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// ==================== Main Approvals ====================
export function Approvals({
	breadcrumbs,
	summaryData,
	pendingData,
	historyData,
	barRestockData,
	barRestockHistory,
	hotelId,
}: {
	breadcrumbs: Breadcrumb[];
	summaryData: SummaryData;
	pendingData: PendingPage;
	historyData: ApprovalItem[];
	barRestockData: BarRestockItem[];
	barRestockHistory: BarRestockItem[];
	hotelId: string;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Approvals",
			breadcrumbs,
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	const totalPending = summaryData.totalPending + barRestockData.length;

	return (
		<div className="p-4 md:p-6 space-y-5">
			<SummaryCards data={summaryData} barRestockCount={barRestockData.length} />

			<Tabs defaultValue="pending" className="space-y-4">
				<TabsList className="bg-white border p-1 rounded-xl">
					<TabsTrigger value="pending" className="rounded-lg gap-1.5">
						<ClockIcon className="size-3.5" />
						Inventory
						{summaryData.totalPending > 0 && (
							<span className="ml-0.5 size-5 rounded-full bg-primary text-white text-[10px] font-medium flex items-center justify-center">
								{summaryData.totalPending}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="bar-restock" className="rounded-lg gap-1.5">
						<WineIcon className="size-3.5" />
						Bar Restock
						{barRestockData.length > 0 && (
							<span className="ml-0.5 size-5 rounded-full bg-rose-500 text-white text-[10px] font-medium flex items-center justify-center">
								{barRestockData.length}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value="history" className="rounded-lg gap-1.5">
						<ClipboardListIcon className="size-3.5" />
						History
						{(historyData.length + barRestockHistory.length) > 0 && (
							<span className="ml-0.5 size-5 rounded-full bg-gray-400 text-white text-[10px] font-medium flex items-center justify-center">
								{historyData.length + barRestockHistory.length}
							</span>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="pending">
					<PendingRequestsTable data={pendingData.content} />
				</TabsContent>

				<TabsContent value="bar-restock">
					<BarRestockTable data={barRestockData} hotelId={hotelId} />
				</TabsContent>

				<TabsContent value="history" className="space-y-4">
					{(historyData.length > 0 || barRestockHistory.length > 0) ? (
						<>
							{barRestockHistory.length > 0 && (
								<div className="space-y-2">
									<p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">Bar Restock</p>
									<BarRestockHistoryTable data={barRestockHistory} />
								</div>
							)}
							{historyData.length > 0 && (
								<div className="space-y-2">
									<p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">Inventory Approvals</p>
									<HistoryTable data={historyData} />
								</div>
							)}
						</>
					) : (
						<div className="bg-white p-10 rounded-2xl text-center">
							<div className="size-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
								<ClipboardListIcon className="size-6 text-gray-400" />
							</div>
							<p className="text-sm font-medium text-gray-700">No history yet</p>
							<p className="text-xs text-gray-400 mt-1">Approved and rejected requests will appear here</p>
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
