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
const NON_TRANSFERABLE_REF_TYPES = new Set(["BILL_TRANSFER", "BILL_TRANSFER_BALANCE"]);

type BookingSearchItem = {
	id: string;
	roomIdentifier: string;
	guestName: string;
	bookingStatus: string | null;
};

interface TransferEntry {
	id: string;
	entryType: string;
	description: string;
	amount: number;
	voided: boolean;
	referenceType?: string | null;
}

interface BillTransferDialogProps {
	bookingId: string;
	entries: TransferEntry[];
	balance: number; // totalPayments - totalCharges: negative = guest owes
	totalCharges: number;
	totalPayments: number;
	onSuccess: () => void;
	setOpen: (open: boolean) => void;
}

export function BillTransferDialog({
	bookingId,
	entries,
	balance,
	totalCharges,
	totalPayments,
	onSuccess,
	setOpen,
}: BillTransferDialogProps) {
	const queryClient = useQueryClient();

	const transferable = entries.filter(
		(e) =>
			!e.voided &&
			e.amount > 0 &&
			!NON_TRANSFERABLE.has(e.entryType) &&
			!NON_TRANSFERABLE_REF_TYPES.has(e.referenceType ?? ""),
	);

	const outstandingBalance = balance < 0 ? Math.abs(balance) : 0;
	const hasPartialPayment = totalPayments > 0 && outstandingBalance > 0;

	const [mode, setMode] = useState<"charges" | "balance">("charges");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedTarget, setSelectedTarget] = useState<BookingSearchItem | null>(null);
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

	const results: BookingSearchItem[] =
		searchResult?.success && searchResult.data?.data?.content
			? (searchResult.data.data.content as unknown as BookingSearchItem[])
					.filter((b) => b.id !== bookingId)
					.slice(0, 8)
			: [];

	const { mutate: doTransfer, isPending } = useMutation({
		mutationFn: async () => {
			if (!selectedTarget) throw new Error("Select a target booking");
			const res = await transferFolioBill({
				bookingId,
				targetBookingId: selectedTarget.id,
				entryIds: mode === "charges" ? Array.from(selectedIds) : undefined,
				balanceOnly: mode === "balance",
			});
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["folio", bookingId] });
			const room = data?.data?.targetRoomIdentifier ?? selectedTarget?.roomIdentifier;
			if (mode === "balance") {
				const amt = data?.data?.totalTransferred ?? outstandingBalance;
				toast.success(`Balance of ${formatCurrency(amt)} transferred to ${room}`);
			} else {
				const count = data?.data?.transferredCount ?? selectedIds.size;
				toast.success(`${count} charge${count !== 1 ? "s" : ""} transferred to ${room}`);
			}
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
		setSelectedTarget(booking);
		setSearch("");
		setDebouncedSearch("");
	};

	const isTransferDisabled =
		!selectedTarget ||
		isPending ||
		(mode === "charges" && selectedIds.size === 0) ||
		(mode === "balance" && outstandingBalance <= 0);

	return (
		<DialogContent className="sm:max-w-xl">
			<DialogHeader>
				<DialogTitle>Transfer Bill</DialogTitle>
				<DialogDescription>
					Move charges to another booking&apos;s folio.
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-5">
				{/* Mode toggle — only show when there's a partial payment */}
				{hasPartialPayment && (
					<div className="flex rounded-lg border p-0.5 bg-muted/40 text-sm">
						<button
							onClick={() => setMode("charges")}
							className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
								mode === "charges"
									? "bg-background shadow-sm text-foreground"
									: "text-muted-foreground"
							}`}
						>
							Transfer charges
						</button>
						<button
							onClick={() => setMode("balance")}
							className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
								mode === "balance"
									? "bg-background shadow-sm text-foreground"
									: "text-muted-foreground"
							}`}
						>
							Transfer balance
						</button>
					</div>
				)}

				{/* Charge list — charges mode */}
				{mode === "charges" && (
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
										className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer min-w-0 overflow-hidden"
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
				)}

				{/* Balance mode */}
				{mode === "balance" && (
					<div>
						<span className="text-sm font-medium block mb-2">
							Outstanding balance to transfer
						</span>
						{outstandingBalance > 0 ? (
							<div className="rounded-lg border bg-muted/20 p-4 space-y-2">
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>Total charges</span>
									<span>{formatCurrency(totalCharges)}</span>
								</div>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>Amount paid</span>
									<span className="text-green-600">
										− {formatCurrency(totalPayments)}
									</span>
								</div>
								<div className="border-t pt-2 flex justify-between text-sm font-semibold">
									<span>Outstanding balance</span>
									<span className="text-red-600">
										{formatCurrency(outstandingBalance)}
									</span>
								</div>
							</div>
						) : (
							<p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
								This folio has no outstanding balance.
							</p>
						)}
					</div>
				)}

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

					{debouncedSearch.length >= 2 && !selectedTarget && (
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
								results.map((booking: BookingSearchItem) => (
									<button
										key={booking.id}
										onClick={() => pickTarget(booking)}
										className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted/40 flex items-center justify-between gap-2 border-b last:border-0 transition-colors"
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
						disabled={isTransferDisabled}
						onClick={() => doTransfer()}
					>
						{isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
						{isPending
							? "Transferring…"
							: mode === "balance"
								? `Transfer ${formatCurrency(outstandingBalance)}`
								: `Transfer ${selectedIds.size} charge${selectedIds.size !== 1 ? "s" : ""}`}
					</Button>
				</div>
			</div>
		</DialogContent>
	);
}
