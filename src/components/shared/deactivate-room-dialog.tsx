"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { revalidateRoute } from "@/lib/actions";

interface DeactivateRoomDialogProps {
	roomId: string;
	roomIdentifier: string;
	toggleAction: (roomId: string, reason?: string) => Promise<{ success: boolean; error?: string; data?: { message: string } }>;
	revalidatePath: string;
	onClose: () => void;
}

export function DeactivateRoomDialog({
	roomId,
	roomIdentifier,
	toggleAction,
	revalidatePath,
	onClose,
}: DeactivateRoomDialogProps) {
	const [reason, setReason] = useState("");

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (!reason.trim()) {
				throw new Error("Please provide a reason for deactivation");
			}
			const res = await toggleAction(roomId, reason.trim());
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (data) => {
			toast.success(data?.message || "Room deactivated successfully");
			revalidateRoute(revalidatePath);
			onClose();
		},
		onError: (e) => {
			toast.error("Failed to deactivate room", { description: e.message });
		},
	});

	return (
		<DialogContent className="sm:max-w-md">
			<DialogHeader>
				<DialogTitle>Deactivate Room</DialogTitle>
				<DialogDescription>
					You are about to deactivate room <strong>{roomIdentifier}</strong>. Please provide a reason.
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-3 py-2">
				<div className="space-y-2">
					<Label htmlFor="deactivation-reason">Reason for deactivation</Label>
					<Textarea
						id="deactivation-reason"
						placeholder="e.g. Under maintenance, renovation, plumbing issues..."
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={3}
					/>
				</div>
			</div>

			<DialogFooter>
				<Button variant="outline" onClick={onClose} disabled={isPending}>
					Cancel
				</Button>
				<Button
					variant="destructive"
					onClick={() => mutate()}
					disabled={isPending || !reason.trim()}
				>
					{isPending ? (
						<>
							<Loader2Icon className="size-4 animate-spin mr-1" />
							Deactivating...
						</>
					) : (
						"Deactivate Room"
					)}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
