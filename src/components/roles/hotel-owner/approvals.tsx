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
import { ownerApproveRequest, ownerRejectRequest } from "@/lib/hotel-owner-actions";
import { toast } from "sonner";
import type { APIOutput } from "@/lib/action-utils";

type SummaryData = APIOutput<"@get/api/hotel-owner/approvals/pending/summary">["data"] | null;
type PendingData = APIOutput<"@get/api/hotel-owner/approvals/pending">["data"] | null;
type PendingItem = NonNullable<PendingData>["content"][number];

const statusVariants: Record<string, BadgeVariant> = {
	PENDING: "yellow",
	APPROVED: "green",
	REJECTED: "destructive",
};

const typeIcons: Record<string, typeof PackageIcon> = {
	PURCHASE_ORDER: FileTextIcon,
	GRN: PackageIcon,
	STOCK_TAKE: ClipboardListIcon,
};

function SummaryCards({ data }: { data: SummaryData }) {
	if (!data) return null;
	const cards = [
		{ title: "Purchase Orders", value: data.pendingPurchaseOrders ?? 0, icon: FileTextIcon },
		{ title: "GRNs", value: data.pendingGRNs ?? 0, icon: PackageIcon },
		{ title: "Stock Takes", value: data.pendingStockTakes ?? 0, icon: ClipboardListIcon },
	];

	return (
		<div className="grid grid-cols-3 gap-3">
			{cards.map((card) => (
				<div
					key={card.title}
					className="bg-white p-4 rounded-2xl flex items-center space-x-3"
				>
					<div className="size-11 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
						<card.icon className="text-amber-600 size-5" />
					</div>
					<div>
						<p className="text-xs text-gray-400">{card.title}</p>
						<p className="text-xl font-semibold text-primary">{card.value}</p>
					</div>
				</div>
			))}
		</div>
	);
}

function ApprovalActionDialog({
	open,
	onOpenChange,
	item,
	action,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: PendingItem | null;
	action: "approve" | "reject";
}) {
	const [comments, setComments] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleSubmit = () => {
		if (!item) return;
		startTransition(async () => {
			const result =
				action === "approve"
					? await ownerApproveRequest(item.id, comments || undefined)
					: await ownerRejectRequest(item.id, comments);

			if (result.success) {
				toast.success(
					action === "approve"
						? "Request approved successfully"
						: "Request rejected successfully",
				);
				onOpenChange(false);
				setComments("");
			} else {
				toast.error(result.error || "Action failed");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{action === "approve" ? "Approve" : "Reject"} Request
					</DialogTitle>
					<DialogDescription>
						{action === "approve"
							? "Are you sure you want to approve this request?"
							: "Please provide a reason for rejection."}
					</DialogDescription>
				</DialogHeader>
				<Textarea
					placeholder={
						action === "approve"
							? "Optional comments..."
							: "Reason for rejection (required)"
					}
					value={comments}
					onChange={(e) => setComments(e.target.value)}
				/>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						variant={action === "approve" ? "default" : "destructive"}
						onClick={handleSubmit}
						disabled={isPending || (action === "reject" && !comments.trim())}
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

function PendingTable({ data }: { data: PendingData }) {
	const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
	const [action, setAction] = useState<"approve" | "reject">("approve");
	const [dialogOpen, setDialogOpen] = useState(false);

	if (!data || data.content.length === 0) {
		return (
			<div className="bg-white p-8 rounded-2xl text-center">
				<p className="text-gray-400">No pending approvals</p>
			</div>
		);
	}

	return (
		<>
			<div className="bg-white rounded-2xl overflow-hidden">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b text-left text-gray-500 bg-gray-50/50">
							<th className="p-3 font-medium">Type</th>
							<th className="p-3 font-medium">Action</th>
							<th className="p-3 font-medium">Reference</th>
							<th className="p-3 font-medium">Requested By</th>
							<th className="p-3 font-medium">Date</th>
							<th className="p-3 font-medium text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{data.content.map((item) => {
							const TypeIcon = typeIcons[item.entityType] ?? FileTextIcon;
							return (
								<tr key={item.id} className="border-b last:border-0">
									<td className="p-3">
										<div className="flex items-center gap-2">
											<TypeIcon className="size-4 text-gray-400" />
											<span className="text-gray-700">
												{item.entityType.replace(/_/g, " ")}
											</span>
										</div>
									</td>
									<td className="p-3 text-gray-600">{item.actionType}</td>
									<td className="p-3 text-gray-600 font-mono text-xs">
										{item.entityReference?.slice(0, 8) ?? "-"}
									</td>
									<td className="p-3 text-gray-600">
										{item.requestedByName ?? "-"}
									</td>
									<td className="p-3 text-gray-500 text-xs">
										{new Date(item.createdAt).toLocaleDateString()}
									</td>
									<td className="p-3 text-right">
										<div className="flex items-center justify-end gap-1.5">
											<Button
												size="sm"
												variant="outline"
												className="text-green-600 border-green-200 hover:bg-green-50"
												onClick={() => {
													setSelectedItem(item);
													setAction("approve");
													setDialogOpen(true);
												}}
											>
												<CheckCircleIcon className="size-3.5 mr-1" />
												Approve
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-red-600 border-red-200 hover:bg-red-50"
												onClick={() => {
													setSelectedItem(item);
													setAction("reject");
													setDialogOpen(true);
												}}
											>
												<XCircleIcon className="size-3.5 mr-1" />
												Reject
											</Button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<ApprovalActionDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				item={selectedItem}
				action={action}
			/>
		</>
	);
}

export function OwnerApprovals({
	breadcrumbs,
	summaryData,
	pendingData,
}: {
	breadcrumbs: Breadcrumb[];
	summaryData: SummaryData;
	pendingData: PendingData;
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
						Pending
					</TabsTrigger>
				</TabsList>
				<TabsContent value="pending">
					<PendingTable data={pendingData} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
