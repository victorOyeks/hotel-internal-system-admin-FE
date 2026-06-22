"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
	searchBookingsForTransfer,
	transferFolioBill,
} from "@/lib/front-desk-actions";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const NON_TRANSFERABLE = new Set(["PAYMENT", "REFUND", "ADJUSTMENT"]);

interface TransferEntry {
	id: string;
	entryType: string;
	description: string;
	amount: number;
	voided: boolean;
}

interface BillTransferDialogProps {
	bookingId: string;
	entries: TransferEntry[];
	onSuccess: () => void;
	setOpen: (open: boolean) => void;
}

export function BillTransferDialog({
	bookingId,
	entries,
	onSuccess,
	setOpen,
}: BillTransferDialogProps) {
	const queryClient = useQueryClient();

	const transferable = entries.filter(
		(e) => !e.voided && e.amount > 0 && !NON_TRANSFERABLE.has(e.entryType),
	);

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedTarget, setSelectedTarget] = useState<{
		id: string;
		roomIdentifier: string;
		guestName: string;
		bookingStatus: string | null;
	} | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(
		new Set(transferable.map((e) => e.id)),
	);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search), 400);
		return () => clearTimeout(t);
	}, [search]);

	const { data: searchResult, isLoading: searching } = useQuery({
		queryKey: ["bookings-transfer-search", debouncedSearch],
		queryFn: () => searchBookingsForTransfer({ search: debouncedSearch }),
		enabled: debouncedSearch.length >= 2,
	});

	type BookingSearchItem = {
		id: string;
		roomIdentifier: string;
		guestName: string;
		bookingStatus: string | null;
	};

	const results: BookingSearchItem[] =
		searchResult?.success && searchResult.data?.data?.content
			? (
					searchResult.data.data.content as unknown as Array<{
						id: string;
						roomIdentifier: string;
						guestName: string;
						bookingStatus: string | null;
					}>
				)
					.filter((b) => b.id !== bookingId)
					.slice(0, 8)
			: [];

	const { mutate: doTransfer, isPending } = useMutation({
		mutationFn: async () => {
			if (!selectedTarget) throw new Error("Select a target booking");
			const res = await transferFolioBill({
				bookingId,
				targetBookingId: selectedTarget.id,
				entryIds: Array.from(selectedIds),
			});
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["folio", bookingId] });
			const count = data?.data?.transferredCount ?? selectedIds.size;
			const room = data?.data?.targetRoomIdentifier ?? selectedTarget?.roomIdentifier;
			toast.success(`${count} charge${count !== 1 ? "s" : ""} transferred to ${room}`);
			onSuccess();
			setOpen(false);
		},
		onError: (e) => {
			toast.error("Transfer failed", { description: e.message });
		},
	});

	const totalSelected = transferable
		.filter((e) => selectedIds.has(e.id))
		.reduce((sum, e) => sum + e.amount, 0);

	const toggleEntry = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleAll = () => {
		if (selectedIds.size === transferable.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(transferable.map((e) => e.id)));
		}
	};

	const pickTarget = (booking: BookingSearchItem) => {
		setSelectedTarget({
			id: booking.id,
			roomIdentifier: booking.roomIdentifier,
			guestName: booking.guestName,
			bookingStatus: booking.bookingStatus ?? null,
		});
		setSearch(`${booking.roomIdentifier} — ${booking.guestName}`);
	};

	return (
		<DialogContent className="sm:max-w-lg">
			<DialogHeader>
				<DialogTitle>Transfer Bill</DialogTitle>
				<DialogDescription>
					Move selected charges to another booking&apos;s folio.
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-5">
				{/* Charge list */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium">Charges to transfer</span>
						{transferable.length > 0 && (
							<button
								onClick={toggleAll}
								className="text-xs text-primary hover:underline"
							>
								{selectedIds.size === transferable.length
									? "Deselect all"
									: "Select all"}
							</button>
						)}
					</div>

					{transferable.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
							No transferable charges on this folio.
						</p>
					) : (
						<div className="space-y-0.5 max-h-48 overflow-y-auto rounded-lg border p-1.5">
							{transferable.map((entry) => (
								<label
									key={entry.id}
									className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer"
								>
									<input
										type="checkbox"
										checked={selectedIds.has(entry.id)}
										onChange={() => toggleEntry(entry.id)}
										className="accent-primary shrink-0"
									/>
									<span className="flex-1 text-xs text-foreground truncate">
										{entry.description}
									</span>
									<span className="text-xs font-mono font-medium shrink-0">
										{formatCurrency(entry.amount)}
									</span>
								</label>
							))}
						</div>
					)}

					{selectedIds.size > 0 && (
						<div className="flex justify-between text-xs text-muted-foreground mt-1.5 px-1">
							<span>
								{selectedIds.size} charge{selectedIds.size !== 1 ? "s" : ""}{" "}
								selected
							</span>
							<span className="font-medium">{formatCurrency(totalSelected)}</span>
						</div>
					)}
				</div>

				{/* Target booking search */}
				<div>
					<span className="text-sm font-medium block mb-2">Transfer to</span>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
						<Input
							placeholder="Search by room number or guest name…"
							className="pl-8 text-sm"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setSelectedTarget(null);
							}}
						/>
					</div>

					{debouncedSearch.length >= 2 && (
						<div className="mt-1 rounded-lg border bg-card shadow-sm max-h-44 overflow-y-auto">
							{searching ? (
								<div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
									<Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
								</div>
							) : results.length === 0 ? (
								<p className="text-xs text-muted-foreground p-3">
									No bookings found
								</p>
							) : (
								results.map((booking) => (
									<button
										key={booking.id}
										onClick={() => pickTarget(booking)}
										className={`w-full text-left px-3 py-2.5 text-xs hover:bg-muted/40 flex items-center justify-between gap-2 border-b last:border-0 transition-colors ${
											selectedTarget?.id === booking.id ? "bg-primary/5" : ""
										}`}
									>
										<div className="min-w-0">
											<span className="font-semibold">
												{booking.roomIdentifier}
											</span>
											<span className="text-muted-foreground ml-2 truncate">
												{booking.guestName}
											</span>
										</div>
										<span
											className={`px-1.5 py-0.5 rounded border text-[10px] shrink-0 ${
												booking.bookingStatus === "CHECKED_IN"
													? "bg-blue-50 text-blue-700 border-blue-200"
													: "bg-gray-50 text-gray-600 border-gray-200"
											}`}
										>
											{booking.bookingStatus?.replace(/_/g, " ") ?? "—"}
										</span>
									</button>
								))
							)}
						</div>
					)}

					{selectedTarget && (
						<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground px-1">
							<ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
							<span>
								Transferring to{" "}
								<strong className="text-foreground">
									{selectedTarget.roomIdentifier}
								</strong>{" "}
								— {selectedTarget.guestName}
							</span>
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="flex gap-2 pt-1">
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => setOpen(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						className="flex-1"
						disabled={!selectedTarget || selectedIds.size === 0 || isPending}
						onClick={() => doTransfer()}
					>
						{isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
						{isPending
							? "Transferring…"
							: `Transfer ${selectedIds.size} charge${selectedIds.size !== 1 ? "s" : ""}`}
					</Button>
				</div>
			</div>
		</DialogContent>
	);
}
