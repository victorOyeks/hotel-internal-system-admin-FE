"use client";

import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { getBookingFolio, voidFolioEntry, exportFolioPdf } from "@/lib/front-desk-actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Receipt, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ExportResult =
	| { success: true; data: { base64: string; filename: string } }
	| { success: false; error: string };

interface FolioContentProps {
	bookingId: string;
	readOnly?: boolean;
	fetchAction?: (args: { bookingId: string }) => Promise<any>;
	exportAction?: (args: { bookingId: string }) => Promise<ExportResult>;
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
	ACCOMMODATION: "Accommodation",
	RESTAURANT: "Restaurant",
	BAR: "Bar",
	LAUNDRY: "Laundry",
	RENTAL: "Rental",
	MANUAL_CHARGE: "Manual Charge",
	OTHER_INCOME: "Other Income",
	PAYMENT: "Payment",
	REFUND: "Refund",
	ADJUSTMENT: "Adjustment",
};

const ENTRY_TYPE_COLORS: Record<string, string> = {
	ACCOMMODATION: "bg-blue-50 text-blue-700 border-blue-200",
	RESTAURANT: "bg-orange-50 text-orange-700 border-orange-200",
	BAR: "bg-purple-50 text-purple-700 border-purple-200",
	LAUNDRY: "bg-cyan-50 text-cyan-700 border-cyan-200",
	RENTAL: "bg-amber-50 text-amber-700 border-amber-200",
	MANUAL_CHARGE: "bg-gray-50 text-gray-700 border-gray-200",
	PAYMENT: "bg-green-50 text-green-700 border-green-200",
	REFUND: "bg-red-50 text-red-700 border-red-200",
	ADJUSTMENT: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const STATUS_COLORS: Record<string, string> = {
	OPEN: "bg-blue-50 text-blue-700 border-blue-200",
	SETTLED: "bg-green-50 text-green-700 border-green-200",
	BALANCE_DUE: "bg-red-50 text-red-700 border-red-200",
};

export function FolioContent({
	bookingId,
	readOnly = false,
	fetchAction,
	exportAction,
}: FolioContentProps) {
	const queryClient = useQueryClient();
	const [voidReason, setVoidReason] = useState("");
	const [isExporting, setIsExporting] = useState(false);

	const action = fetchAction ?? getBookingFolio;
	const doExport = exportAction ?? exportFolioPdf;

	const handleExportPdf = async () => {
		setIsExporting(true);
		try {
			const result = await doExport({ bookingId });
			if (!result.success) {
				toast.error(result.error || "Failed to export folio");
				return;
			}
			const byteCharacters = atob(result.data.base64);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: "application/pdf" });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.data.filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success("Folio PDF downloaded");
		} catch {
			toast.error("Failed to export folio PDF");
		} finally {
			setIsExporting(false);
		}
	};

	const { data: folioResult, isLoading } = useQuery({
		queryKey: ["folio", bookingId],
		queryFn: () => action({ bookingId }),
	});

	const { mutate: doVoid, isPending: isVoiding } = useMutation({
		mutationFn: async ({
			entryId,
			reason,
		}: { entryId: string; reason: string }) => {
			const res = await voidFolioEntry({ bookingId, entryId, reason });
			if (!res.success) throw new Error(res.error);
			return res;
		},
		onSuccess: () => {
			toast.success("Folio entry voided successfully");
			setVoidReason("");
			queryClient.invalidateQueries({ queryKey: ["folio", bookingId] });
		},
		onError: (e) => {
			toast.error("Failed to void entry", { description: e.message });
		},
	});

	if (isLoading) {
		return (
			<DialogContent className="sm:max-w-5xl">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</DialogContent>
		);
	}

	if (!folioResult?.success || !folioResult.data) {
		return (
			<DialogContent className="sm:max-w-5xl">
				<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
					<Receipt className="h-12 w-12 mb-2" />
					<p>No folio data available for this booking.</p>
				</div>
			</DialogContent>
		);
	}

	const folio = folioResult.data.data;
	const entries = folio.entries ?? [];

	return (
		<DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
			<DialogHeader>
				<div className="flex items-center justify-between gap-3">
					<DialogTitle className="flex items-center gap-3">
						<Receipt className="h-5 w-5" />
						Guest Folio
						<span className="text-muted-foreground font-normal text-base">
							- {folio.guestName}
						</span>
						<Badge
							variant="outline"
							className={STATUS_COLORS[folio.folioStatus] ?? ""}
						>
							{folio.folioStatus?.replace(/_/g, " ")}
						</Badge>
					</DialogTitle>
					<Button
						variant="outline"
						size="sm"
						className="mr-6"
						onClick={handleExportPdf}
						disabled={isExporting}
					>
						{isExporting ? (
							<Loader2 className="h-4 w-4 animate-spin mr-1" />
						) : (
							<Download className="h-4 w-4 mr-1" />
						)}
						Export PDF
					</Button>
				</div>
			</DialogHeader>

			{/* Guest & Booking Info */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
				<div className="text-sm">
					<span className="text-muted-foreground">Booking</span>
					<div className="font-mono font-medium">{folio.customId}</div>
				</div>
				<div className="text-sm">
					<span className="text-muted-foreground">Room</span>
					<div className="font-medium">
						{folio.roomIdentifier} ({folio.roomType})
					</div>
				</div>
				<div className="text-sm">
					<span className="text-muted-foreground">Check In</span>
					<div className="font-medium">
						{new Date(folio.checkInDate).toLocaleDateString()}
					</div>
				</div>
				<div className="text-sm">
					<span className="text-muted-foreground">{folio.bookingStatus === "CHECKED_OUT" ? "Check Out" : "Expected Check Out"}</span>
					<div className="font-medium">
						{folio.checkOutDate
							? new Date(folio.checkOutDate).toLocaleDateString()
							: "—"}
					</div>
				</div>
			</div>

			{/* Entries Table */}
			<div className="border rounded-lg overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/50">
							<TableHead className="w-[140px]">Date</TableHead>
							<TableHead>Description</TableHead>
							<TableHead className="w-[100px]">Type</TableHead>
							<TableHead className="w-[120px] text-right">
								Charge
							</TableHead>
							<TableHead className="w-[120px] text-right">
								Payment
							</TableHead>
							<TableHead className="w-[120px] text-right">
								Balance
							</TableHead>
							{!readOnly && (
								<TableHead className="w-[60px]" />
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{entries.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={readOnly ? 6 : 7}
									className="text-center text-muted-foreground py-8"
								>
									No folio entries yet
								</TableCell>
							</TableRow>
						) : (
							entries.map((entry) => {
								const isCharge = entry.amount > 0;
								const isVoided = entry.voided;

								return (
									<TableRow
										key={entry.id}
										className={
											isVoided
												? "line-through opacity-50"
												: ""
										}
									>
										<TableCell className="text-sm text-muted-foreground">
											{new Date(
												entry.postedAt,
											).toLocaleDateString("en-GB", {
												day: "2-digit",
												month: "short",
												year: "numeric",
											})}
											<div className="text-xs">
												{new Date(
													entry.postedAt,
												).toLocaleTimeString("en-GB", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm font-medium">
												{entry.description}
											</div>
											{entry.postedBy && (
												<div className="text-xs text-muted-foreground">
													by {entry.postedBy}
												</div>
											)}
											{isVoided && entry.voidReason && (
												<div className="text-xs text-red-500">
													Void: {entry.voidReason}
												</div>
											)}
										</TableCell>
										<TableCell>
											<span
												className={`text-xs px-1.5 py-0.5 rounded border ${ENTRY_TYPE_COLORS[entry.entryType] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}
											>
												{ENTRY_TYPE_LABELS[
													entry.entryType
												] ?? entry.entryType}
											</span>
										</TableCell>
										<TableCell className="text-right font-mono text-sm">
											{isCharge
												? formatCurrency(entry.amount)
												: ""}
										</TableCell>
										<TableCell className="text-right font-mono text-sm text-green-600">
											{!isCharge
												? formatCurrency(
														Math.abs(entry.amount),
													)
												: ""}
										</TableCell>
										<TableCell className="text-right font-mono text-sm font-medium">
											{formatCurrency(
												entry.runningBalance,
											)}
										</TableCell>
										{!readOnly && (
											<TableCell>
												{!isVoided &&
													entry.entryType !==
														"ADJUSTMENT" && (
														<AlertDialog>
															<AlertDialogTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="sm"
																	className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
																>
																	<XCircle className="h-4 w-4" />
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Void
																		Folio
																		Entry
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		This
																		will
																		void
																		the
																		entry &quot;
																		{
																			entry.description
																		}
																		&quot;
																		and
																		create a
																		reversal
																		adjustment.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<Input
																	placeholder="Reason for voiding..."
																	value={
																		voidReason
																	}
																	onChange={(
																		e,
																	) =>
																		setVoidReason(
																			e
																				.target
																				.value,
																		)
																	}
																/>
																<AlertDialogFooter>
																	<AlertDialogCancel
																		onClick={() =>
																			setVoidReason(
																				"",
																			)
																		}
																	>
																		Cancel
																	</AlertDialogCancel>
																	<AlertDialogAction
																		disabled={
																			!voidReason.trim() ||
																			isVoiding
																		}
																		onClick={() =>
																			doVoid(
																				{
																					entryId:
																						entry.id,
																					reason: voidReason,
																				},
																			)
																		}
																	>
																		{isVoiding
																			? "Voiding..."
																			: "Void Entry"}
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													)}
											</TableCell>
										)}
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			{/* Summary Footer */}
			<div className="grid grid-cols-3 gap-4 pt-2">
				<div className="p-3 rounded-lg border bg-muted/30 text-center">
					<div className="text-xs text-muted-foreground uppercase tracking-wider">
						Total Charges
					</div>
					<div className="text-lg font-bold font-mono">
						{formatCurrency(folio.totalCharges)}
					</div>
				</div>
				<div className="p-3 rounded-lg border bg-green-50 text-center">
					<div className="text-xs text-muted-foreground uppercase tracking-wider">
						Total Payments
					</div>
					<div className="text-lg font-bold font-mono text-green-600">
						{formatCurrency(Math.abs(folio.totalPayments))}
					</div>
				</div>
				<div
					className={`p-3 rounded-lg border text-center ${folio.balance > 0 ? "bg-red-50" : "bg-green-50"}`}
				>
					<div className="text-xs text-muted-foreground uppercase tracking-wider">
						Outstanding Balance
					</div>
					<div
						className={`text-lg font-bold font-mono ${folio.balance > 0 ? "text-red-600" : "text-green-600"}`}
					>
						{formatCurrency(folio.balance)}
					</div>
				</div>
			</div>
		</DialogContent>
	);
}
