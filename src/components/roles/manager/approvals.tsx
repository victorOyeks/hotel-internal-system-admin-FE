"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { useSetAtom } from "jotai";
import {
	CheckCircleIcon,
	ClipboardListIcon,
	FileTextIcon,
	PackageIcon,
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
import { approveRequest, rejectRequest } from "@/lib/manager-actions";
import { toast } from "sonner";
import type { APIOutput } from "@/lib/action-utils";

type SummaryData =
	APIOutput<"@get/api/manager/approvals/pending/summary">["data"];
type PendingPage = APIOutput<"@get/api/manager/approvals/pending">["data"];
type ApprovalItem =
	PendingPage["content"][number];

// ==================== Summary Cards ====================
function SummaryCards({ data }: { data: SummaryData }) {
	const cards = [
		{
			title: "Purchase Orders",
			value: data.pendingPurchaseOrders,
			icon: PackageIcon,
			color: "bg-blue-50 text-blue-600",
		},
		{
			title: "Goods Receipt Notes",
			value: data.pendingGRNs,
			icon: FileTextIcon,
			color: "bg-amber-50 text-amber-600",
		},
		{
			title: "Stock Takes",
			value: data.pendingStockTakes,
			icon: ClipboardListIcon,
			color: "bg-violet-50 text-violet-600",
		},
	];

	return (
		<div className="grid grid-cols-3 gap-3">
			{cards.map((card) => {
				const [bgClass, textClass] = card.color.split(" ");
				return (
					<div key={card.title} className="bg-white p-4 rounded-2xl">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-gray-500">{card.title}</span>
							<div
								className={`size-8 rounded-lg ${bgClass} flex items-center justify-center`}
							>
								<card.icon className={`size-4 ${textClass}`} />
							</div>
						</div>
						<p className="text-2xl font-bold text-primary">{card.value}</p>
						<p className="text-xs text-gray-400">pending approval</p>
					</div>
				);
			})}
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
function PendingRequestsTable({
	data,
}: {
	data: ApprovalItem[];
}) {
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
			<div className="bg-white p-8 rounded-2xl text-center">
				<CheckCircleIcon className="size-12 text-green-300 mx-auto mb-3" />
				<p className="text-gray-500">No pending approval requests</p>
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

// ==================== History Table ====================
function HistoryTable({ data }: { data: ApprovalItem[] }) {
	const statusVariant: Record<string, BadgeVariant> = {
		APPROVED: "green",
		REJECTED: "destructive",
		PENDING: "yellow",
	};

	if (data.length === 0) {
		return (
			<div className="bg-white p-8 rounded-2xl text-center">
				<p className="text-gray-500">No approval history yet</p>
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
	hotelId,
}: {
	breadcrumbs: Breadcrumb[];
	summaryData: SummaryData;
	pendingData: PendingPage;
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

	return (
		<div className="p-4 md:p-6 space-y-4">
			<SummaryCards data={summaryData} />

			<Tabs defaultValue="pending" className="space-y-4">
				<TabsList className="bg-white border p-1 rounded-xl">
					<TabsTrigger value="pending" className="rounded-lg">
						Pending ({summaryData.totalPending})
					</TabsTrigger>
					<TabsTrigger value="history" className="rounded-lg">
						History
					</TabsTrigger>
				</TabsList>

				<TabsContent value="pending">
					<PendingRequestsTable data={pendingData.content} />
				</TabsContent>

				<TabsContent value="history">
					<div className="bg-white p-8 rounded-2xl text-center">
						<p className="text-gray-500 text-sm">
							History is loaded on demand. Switch to this tab to view approval
							history.
						</p>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
