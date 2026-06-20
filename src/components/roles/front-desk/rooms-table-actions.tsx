"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Loader2Icon, MoreVertical } from "lucide-react";
import { useState } from "react";
import type { RoomDetails } from "@/lib/fetch";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { RoomDetailsContent } from "./room-details-content";
import { DeactivateRoomDialog } from "@/components/shared/deactivate-room-dialog";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	assignBookingToOrganization,
	getOrganizationsForCurrentUser,
} from "@/lib/corporate-actions";
import { toggleRoomActive } from "@/lib/front-desk-actions";
import { revalidateRoute } from "@/lib/actions";
import { toast } from "sonner";

interface RoomsTableActionsProps {
	row: RoomDetails;
}

export function AssignToOrgContent({
	bookingId,
	guestName,
	setOpen,
}: {
	bookingId: string;
	guestName: string;
	setOpen: (open: boolean) => void;
}) {
	const [selectedOrgId, setSelectedOrgId] = useState("");
	const [spendingCap, setSpendingCap] = useState(0);

	const { data: orgData } = useQuery({
		queryKey: ["front-desk", "organizations"],
		queryFn: () => getOrganizationsForCurrentUser(),
	});
	const organizations = orgData?.organizations ?? [];
	const hotelId = orgData?.hotelId ?? "";

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (!selectedOrgId || !hotelId) {
				throw new Error("Please select an organization");
			}
			const result = await assignBookingToOrganization({
				hotelId,
				bookingId,
				organizationId: selectedOrgId,
				dailySpendingCap: spendingCap,
			});
			if (!result.success) {
				throw new Error(result.error);
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("Guest assigned to organization successfully");
			setOpen(false);
			revalidateRoute("/front-desk");
		},
		onError: (e) => {
			toast.error("Failed to assign organization", {
				description: e.message,
			});
		},
	});

	return (
		<DialogContent className="p-4 rounded-2xl">
			<DialogTitle>Assign to Organization</DialogTitle>
			<DialogDescription>
				Assign <strong>{guestName}</strong> to a corporate organization.
			</DialogDescription>

			<div className="space-y-4 mt-2">
				<div className="space-y-2">
					<Label>Organization</Label>
					<Combobox
						options={organizations.map((org) => ({
							label: org.name,
							value: org.id,
						}))}
						value={selectedOrgId}
						onSelect={setSelectedOrgId}
						placeholder="Select organization..."
						emptyText="No organizations found"
					/>
				</div>

				<div className="space-y-2">
					<Label>Daily Spending Cap</Label>
					<Input
						type="number"
						min="0"
						step="0.01"
						placeholder="0.00"
						value={spendingCap || ""}
						onChange={(e) => setSpendingCap(Number(e.target.value) || 0)}
					/>
				</div>

				<Button
					className="w-full font-semibold"
					disabled={!selectedOrgId || isPending}
					onClick={() => mutate()}
				>
					{isPending ? (
						<>
							<Loader2Icon className="animate-spin" />
							<span>Assigning...</span>
						</>
					) : (
						"Assign to Organization"
					)}
				</Button>
			</div>
		</DialogContent>
	);
}

export function RoomsTableActions({ row }: RoomsTableActionsProps) {
	const [showRoomDetails, setShowRoomDetails] = useState(false);
	const [showAssignOrg, setShowAssignOrg] = useState(false);
	const [showDeactivate, setShowDeactivate] = useState(false);

	const isCheckedIn = row.checkInStatus === "CHECKED_IN";
	const hasGuest = !!row.guestDetails;
	const alreadyAssigned = !!row.guestDetails?.organizationName;

	const isActive = row.active !== false;
	const isAvailable = row.checkInStatus === "AVAILABLE";
	const canActivate = !isActive;

	const { mutate: activateRoom, isPending: isActivating } = useMutation({
		mutationFn: async () => {
			const res = await toggleRoomActive(row.id);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (data) => {
			toast.success(data.message);
			revalidateRoute("/front-desk");
		},
		onError: (e) => {
			toast.error("Failed to activate room", { description: e.message });
		},
	});

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size={"icon"}>
					<span className="sr-only">Open menu</span>
					<MoreVertical />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Actions</DropdownMenuLabel>

				<Dialog open={showRoomDetails} onOpenChange={setShowRoomDetails}>
					<DialogTrigger asChild>
						<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
							View Room Details
						</DropdownMenuItem>
					</DialogTrigger>
					<RoomDetailsContent room={row} />
				</Dialog>

				{isCheckedIn && hasGuest && !alreadyAssigned && (
					<>
						<DropdownMenuSeparator />
						<Dialog open={showAssignOrg} onOpenChange={setShowAssignOrg}>
							<DialogTrigger asChild>
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									Assign to Organization
								</DropdownMenuItem>
							</DialogTrigger>
							<AssignToOrgContent
								bookingId={row.guestDetails!.bookingId}
								guestName={row.guestDetails!.guestName}
								setOpen={setShowAssignOrg}
							/>
						</Dialog>
					</>
				)}

				{(isActive || canActivate) && (
					<>
						<DropdownMenuSeparator />
						{isActive && (
							<Dialog open={showDeactivate} onOpenChange={setShowDeactivate}>
								<DialogTrigger asChild>
									<DropdownMenuItem
										variant="destructive"
										disabled={!isAvailable}
										onSelect={(e) => e.preventDefault()}
										className="font-medium"
									>
										Deactivate Room
									</DropdownMenuItem>
								</DialogTrigger>
								<DeactivateRoomDialog
									roomId={row.id}
									roomIdentifier={row.roomIdentifier}
									toggleAction={toggleRoomActive}
									revalidatePath="/front-desk"
									onClose={() => setShowDeactivate(false)}
								/>
							</Dialog>
						)}
						{canActivate && (
							<DropdownMenuItem
								disabled={isActivating}
								onClick={() => activateRoom()}
								className="text-green-600 font-medium focus:!bg-green-50 focus:!text-green-600"
							>
								{isActivating ? "Activating..." : "Activate Room"}
							</DropdownMenuItem>
						)}
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
