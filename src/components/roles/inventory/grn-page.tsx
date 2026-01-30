"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { GRNDetails } from "./grn-details";
import { CreateGRNForm } from "./grn-form";
import { GRNStats } from "./grns";
import { GRNToolbar } from "./grn-filters";
import {
	createColumnHelper,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { GRNTable } from "./grn-table";
import { formatDate } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	EditIcon,
	MoreVerticalIcon,
	TrashIcon,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { deleteGRN } from "@/lib/inventory-actions";
import { toast } from "sonner";
import { revalidateRoute } from "@/lib/actions";
import type {
	InventoryGRNResponse,
	InventoryGRNStatistics,
	InventoryLocationResponse,
	InventoryProduct,
	InventorySupplierMini,
	PurchaseOrderListItem,
} from "@/lib/fetch";

const columnHelper = createColumnHelper<InventoryGRNResponse>();

function GRNActions({
	grn,
	grnLocations,
	suppliers,
	products,
	purchaseOrders,
}: {
	grn: InventoryGRNResponse;
	grnLocations: InventoryLocationResponse[];
	suppliers: InventorySupplierMini[];
	products: InventoryProduct[];
	purchaseOrders: PurchaseOrderListItem[];
}) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);

	const { mutate: deleteMutate } = useMutation({
		mutationKey: ["delete-grn"],
		mutationFn: async (grnId: string) => {
			const res = await deleteGRN(grnId);
			if (!res.success) {
				throw new Error(res.error);
			}
			return res;
		},
		onSuccess: async (res) => {
			await revalidateRoute("/dashboard/grn");
			//@ts-ignore
			toast.success(res.data?.message || "GRN deleted successfully");
			setShowDeleteDialog(false);
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	if (grn.status === "ACCEPTED" || grn.stockPosted) {
		return null; // Cannot edit/delete posted GRNs
	}

	return (
		<>
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the GRN.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutate(grn.id)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Goods Receipt Note</DialogTitle>
					</DialogHeader>
					<CreateGRNForm
						grnLocations={grnLocations}
						suppliers={suppliers}
						products={products}
						purchaseOrders={purchaseOrders}
						onClose={() => setShowEditDialog(false)}
						initialData={grn}
					/>
				</DialogContent>
			</Dialog>

			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon">
						<span className="sr-only">Open menu</span>
						<MoreVerticalIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => setShowEditDialog(true)}>
						<EditIcon />
						Edit
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={() => setShowDeleteDialog(true)}
						className="text-red-600"
					>
						<TrashIcon />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}

export function GRNPage({
	grnsData,
	statsData,
	grnLocations,
	suppliers,
	products,
	purchaseOrders,
}: {
	grnsData: InventoryGRNResponse[];
	statsData: InventoryGRNStatistics;
	grnLocations: InventoryLocationResponse[];
	suppliers: InventorySupplierMini[];
	products: InventoryProduct[];
	purchaseOrders: PurchaseOrderListItem[];
}) {
	const columnDefs = [
		columnHelper.accessor("grnNumber", {
			header: "GRN Number",
			cell: (info) => info.getValue(),
		}),
		columnHelper.accessor("supplierName", {
			header: "Supplier",
			cell: (info) => {
				const selectedGRN = info.row.original;

				return (
					<GRNDetails
						grn={selectedGRN}
					/>
				);
			},
		}),
		columnHelper.accessor("purchaseOrderNumber", {
			header: "PO Number",
			cell: (info) => info.getValue(),
		}),
		columnHelper.accessor("status", {
			header: "Status",
			cell: (info) => {
				const value = info.getValue();

				if (value === "ACCEPTED") {
					return <Badge variant={"green"}>Accepted</Badge>;
				}

				return <Badge variant={"yellow"}>Draft</Badge>;
			},
		}),
		columnHelper.accessor("stockPosted", {
			header: "Posted",
			cell: (info) => info.getValue(),
		}),
		columnHelper.accessor("totalAmount", {
			header: "Total Amount",
			cell: (info) => formatCurrency(info.getValue()),
		}),
		columnHelper.accessor("updatedAt", {
			header: "Created Date",
			cell: (info) => {
				const value = formatDate(new Date(info.getValue()), "PPpp");
				return value;
			},
		}),
		columnHelper.display({
			id: "actions",
			cell: ({ row }) => (
				<GRNActions
					grn={row.original}
					grnLocations={grnLocations}
					suppliers={suppliers}
					products={products}
					purchaseOrders={purchaseOrders}
				/>
			),
		}),
	];

	const table = useReactTable({
		columns: columnDefs,
		data: grnsData,
		getCoreRowModel: getCoreRowModel(),
	});

	// UI State
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Goods Receipt Notes
					</h1>
					<p className="text-muted-foreground mt-1">
						Record and manage goods received from suppliers
					</p>
				</div>

				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen} modal>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" /> Create GRN
						</Button>
					</DialogTrigger>
					<DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create Goods Receipt Note</DialogTitle>
						</DialogHeader>
						<CreateGRNForm
							grnLocations={grnLocations}
							suppliers={suppliers}
							products={products}
							purchaseOrders={purchaseOrders}
							onClose={() => setIsCreateOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats */}
			<GRNStats
				totalValue={statsData.totalValue}
				postedCount={statsData.stockPostedGRNs}
				recentCount={statsData.grnsToday}
			/>

			{/* Filters */}
			<GRNToolbar table={table} />

			{/* Table */}
			<GRNTable table={table} />
		</div>
	);
}
