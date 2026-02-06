"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { EditIcon, MoreVerticalIcon, TrashIcon, CheckCircle2Icon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { deleteGRN, postGRNToStock } from "@/lib/inventory-actions";
import { toast } from "sonner";
import { revalidateRoute } from "@/lib/actions";
import { CreateGRNForm } from "./grn-form";
import type {
    InventoryGRNResponse,
    InventoryLocationResponse,
    InventoryProduct,
    InventorySupplierMini,
    PurchaseOrderListItem,
} from "@/lib/fetch";

interface GRNActionsProps {
    grn: InventoryGRNResponse;
    grnLocations: InventoryLocationResponse[];
    suppliers: InventorySupplierMini[];
    products: InventoryProduct[];
    purchaseOrders: PurchaseOrderListItem[];
}

export function GRNActions({
    grn,
    grnLocations,
    suppliers,
    products,
    purchaseOrders,
}: GRNActionsProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showPostDialog, setShowPostDialog] = useState(false);

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

    const { mutate: postMutate, isPending: isPosting } = useMutation({
        mutationKey: ["post-grn"],
        mutationFn: async (grnId: string) => {
            const res = await postGRNToStock(grnId);
            if (!res.success) {
                throw new Error(res.error);
            }
            return res;
        },
        onSuccess: async (res) => {
            await revalidateRoute("/dashboard/grn");
            toast.success("GRN posted to stock successfully");
            setShowPostDialog(false);
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

            <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Post GRN to Stock?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will update inventory levels and finalize this GRN. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => postMutate(grn.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isPosting}
                        >
                            {isPosting ? "Posting..." : "Confirm Post"}
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

                    <DropdownMenuItem onClick={() => setShowPostDialog(true)}>
                        <CheckCircle2Icon />
                        Post to Stock
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        variant="destructive"
                    >
                        <TrashIcon />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
