"use client";

import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import {
	useReactTable,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	createColumnHelper,
	flexRender,
} from "@tanstack/react-table";
import { useSetAtom, useAtom, atom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Table as TableType } from "@tanstack/react-table";
import {
	EyeIcon,
	SearchIcon,
	User,
	Calendar,
	CreditCard,
	Building,
	Bed,
	Phone,
	Hash,
	ReceiptIcon,
} from "lucide-react";
import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/shared/pagination";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
	type ExportData,
	ExportDialog,
	SuccessDialog,
} from "@/components/shared/shared-dialogs";
import type {
	BookingStatus,
	ManagerBookingViewResponse,
	Pagination,
} from "@/lib/fetch";
import {
	parseAsString,
	parseAsStringLiteral,
	useQueryState,
	useQueryStates,
} from "nuqs";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { formatCurrency } from "@/lib/utils";
import { FolioContent } from "@/components/roles/front-desk/folio-content";
import { getManagerBookingFolio, exportManagerFolioPdf, exportBookings } from "@/lib/manager-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RotateCcwIcon } from "lucide-react";

const successDialogAtom = atom({
	show: false,
	message: "",
});

// Manager Bookings Filter Component
const ManagerBookingsFilter = ({
	queryState,
	setQueryState,
	setOpen,
}: {
	setOpen: (open: boolean) => void;
	queryState: {
		bookingStatus: BookingStatus | null;
		search: string | null;
	};
	setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
	const [tempFilters, setTempFilters] = useState({
		bookingStatus: queryState.bookingStatus || null,
	});

	// Memoized callback functions to prevent unnecessary re-renders
	const applyFilters = useCallback(() => {
		setQueryState({
			...queryState,
			bookingStatus: tempFilters.bookingStatus,
		});
		setOpen(false);
	}, [queryState, tempFilters.bookingStatus, setQueryState, setOpen]);

	const clearFilters = useCallback(() => {
		const clearedFilters = {
			bookingStatus: null,
			search: null,
		};
		setTempFilters(clearedFilters);
		setQueryState({
			...queryState,
			bookingStatus: null,
			search: null,
		});
	}, [queryState, setQueryState]);

	// Memoize filter state computations
	const filterStates = useMemo(() => {
		const hasActiveFilters = !!tempFilters.bookingStatus;
		const hasAppliedFilters = !!queryState.bookingStatus;
		const appliedFiltersCount =
			(queryState.bookingStatus ? 1 : 0) + (queryState.search ? 1 : 0);

		return {
			hasActiveFilters,
			hasAppliedFilters,
			appliedFiltersCount,
		};
	}, [tempFilters.bookingStatus, queryState.bookingStatus, queryState.search]);

	const bookingStatusOptions = useMemo(
		() => [
			{ value: "CHECKED_IN", label: "Checked In", color: "bg-green-500" },
			{ value: "CHECKED_OUT", label: "Checked Out", color: "bg-blue-500" },
			{ value: "RESERVED", label: "Reserved", color: "bg-yellow-500" },
			{ value: "CANCELLED", label: "Cancelled", color: "bg-red-500" },
		],
		[],
	);

	return (
		<div className="space-y-4 w-80">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-sm">Filter Bookings</h4>
				<Button
					variant="ghost"
					size="sm"
					onClick={clearFilters}
					className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
				>
					<RotateCcwIcon className="h-3 w-3 mr-1" />
					Clear all
				</Button>
			</div>

			{/* Booking Status Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Booking Status</Label>
				<Select
					value={tempFilters.bookingStatus || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							bookingStatus: value === "all" ? null : (value as BookingStatus),
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						{bookingStatusOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								<div className="flex items-center gap-2">
									<div className={`w-2 h-2 ${option.color} rounded-full`}></div>
									{option.label}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Filter Summary */}
			{filterStates.hasActiveFilters && (
				<div className="pt-2 border-t">
					<p className="text-xs text-muted-foreground mb-2">Active filters:</p>
					<div className="flex flex-wrap gap-1">
						{tempFilters.bookingStatus && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Status:{" "}
								{
									bookingStatusOptions.find(
										(s) => s.value === tempFilters.bookingStatus,
									)?.label
								}
							</span>
						)}
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex gap-2 pt-2">
				<Button
					variant="outline"
					size="sm"
					onClick={clearFilters}
					className="flex-1"
				>
					Clear
				</Button>
				<Button size="sm" onClick={applyFilters} className="flex-1">
					Apply Filters
				</Button>
			</div>
		</div>
	);
};

function BookingDetailsContent({ booking }: { booking: ManagerBookingViewResponse }) {
	const statusToVariant: Record<BookingStatus, BadgeVariant> = {
		CHECKED_IN: "green",
		CHECKED_OUT: "blue",
		RESERVED: "yellow",
		CANCELLED: "destructive",
	};

	const numberOfNights = booking.numberOfNights ??
		Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));

	return (
		<DialogContent className="sm:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					Booking Details
					<span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border">
						{booking.customId}
					</span>
					<Badge className="capitalize ml-1" variant={statusToVariant[booking.bookingStatus]}>
						{booking.bookingStatus.replace(/_/g, " ").toLowerCase()}
					</Badge>
				</DialogTitle>
			</DialogHeader>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
				{/* Guest Info - Column 1 */}
				<div className="space-y-4">
					<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Guest Information</h4>
					<div className="flex flex-col gap-4 p-4 rounded-lg border bg-card h-full">
						<div className="flex items-center gap-4">
							<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
								<User className="h-6 w-6" />
							</div>
							<div>
								<h3 className="font-semibold text-lg">
									{booking.title ? `${booking.title} ` : ""}{booking.guestName}
								</h3>
								{booking.guestPhoneNumber && (
									<div className="text-sm text-muted-foreground flex items-center gap-1">
										<Phone className="h-3 w-3" />
										{booking.guestPhoneNumber}
									</div>
								)}
							</div>
						</div>

						{booking.organizationName && (
							<div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted p-2 rounded">
								<Building className="h-4 w-4" />
								<span className="font-medium">Org:</span> {booking.organizationName}
							</div>
						)}

						<div className="space-y-3 mt-auto">
							<div className="flex items-center gap-2 text-sm">
								<Bed className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">Room Type:</span>
								<span className="font-medium">{booking.roomType}</span>
							</div>
							{booking.roomIdentifier && (
								<div className="flex items-center gap-2 text-sm">
									<Hash className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground">Room:</span>
									<span className="font-medium">{booking.roomIdentifier}</span>
								</div>
							)}
							<div className="flex items-center gap-2 text-sm">
								<Building className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">Branch:</span>
								<span className="font-medium">{booking.branchName}</span>
							</div>
						</div>

						{(booking.noOfAdults != null || booking.noOfChildren != null) && (
							<div className="grid grid-cols-2 gap-2 pt-4 border-t">
								<div className="bg-muted/50 p-2 rounded text-center">
									<div className="text-xs text-muted-foreground">Adults</div>
									<div className="font-semibold">{booking.noOfAdults || 0}</div>
								</div>
								<div className="bg-muted/50 p-2 rounded text-center">
									<div className="text-xs text-muted-foreground">Children</div>
									<div className="font-semibold">{booking.noOfChildren || 0}</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Stay Info - Column 2 */}
				<div className="space-y-4">
					<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Stay Details</h4>
					<div className="flex flex-col gap-4 h-full">
						<div className="p-4 rounded-lg border bg-muted/30 space-y-3 flex-1">
							<div className="text-sm font-medium flex items-center gap-2 mb-2">
								<Calendar className="h-4 w-4 text-primary" />
								Check-in / Check-out
							</div>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between border-b pb-2">
									<div>
										<div className="text-xs text-muted-foreground">Check In</div>
										<div className="font-medium">
											{new Date(booking.checkInDate).toLocaleDateString("en-US", {
												month: "short", day: "2-digit", year: "numeric",
											})}
										</div>
										<div className="text-xs text-muted-foreground">
											{new Date(booking.checkInDate).toLocaleTimeString("en-US", {
												hour: "2-digit", minute: "2-digit", hour12: true,
											})}
										</div>
									</div>
									<div className="text-right">
										<div className="text-xs text-muted-foreground">{booking.bookingStatus === "CHECKED_OUT" ? "Check Out" : "Expected Check Out"}</div>
										<div className="font-medium">
											{new Date(booking.checkOutDate).toLocaleDateString("en-US", {
												month: "short", day: "2-digit", year: "numeric",
											})}
										</div>
										<div className="text-xs text-muted-foreground">
											{new Date(booking.checkOutDate).toLocaleTimeString("en-US", {
												hour: "2-digit", minute: "2-digit", hour12: true,
											})}
										</div>
									</div>
								</div>
								<div className="flex justify-between items-center pt-1">
									<span className="text-muted-foreground">Duration</span>
									<span className="font-medium">{numberOfNights} Night{numberOfNights !== 1 ? "s" : ""}</span>
								</div>
							</div>
						</div>

						{booking.nightlyRate != null && (
							<div className="p-4 rounded-lg border bg-muted/30 space-y-3 flex-1">
								<div className="text-sm font-medium flex items-center gap-2 mb-2">
									<Bed className="h-4 w-4 text-primary" />
									Accommodation
								</div>
								{(() => {
									const hasDiscount = (booking.discountValue != null && booking.discountValue > 0) ||
										(booking.effectiveNightlyRate != null && booking.nightlyRate != null &&
											booking.effectiveNightlyRate < booking.nightlyRate);
									return (
										<div className="space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Nightly Rate</span>
												<span className={`font-medium ${hasDiscount ? "line-through text-muted-foreground text-xs" : ""}`}>
													{formatCurrency(booking.nightlyRate)}
												</span>
											</div>
											{hasDiscount && (
												<>
													{booking.discountValue != null && booking.discountValue > 0 && (
														<div className="flex justify-between">
															<span className="text-muted-foreground">Discount</span>
															<span className="text-green-600 font-medium text-sm">
																-{booking.discountType === "PERCENTAGE"
																	? `${booking.discountValue}%`
																	: formatCurrency(booking.discountValue)}
															</span>
														</div>
													)}
													<div className="flex justify-between">
														<span className="text-muted-foreground">Effective Rate</span>
														<span className="font-medium">
															{formatCurrency(booking.effectiveNightlyRate ?? booking.nightlyRate)}
														</span>
													</div>
												</>
											)}
											{booking.accommodationCost != null && (
												<div className="flex justify-between">
													<span className="text-muted-foreground">Accommodation Total</span>
													<span className="font-medium">{formatCurrency(booking.accommodationCost)}</span>
												</div>
											)}
											{booking.restaurantOrdersTotal != null && booking.restaurantOrdersTotal > 0 && (
												<div className="flex justify-between">
													<span className="text-muted-foreground">Restaurant Orders</span>
													<span className="font-medium">{formatCurrency(booking.restaurantOrdersTotal)}</span>
												</div>
											)}
										</div>
									);
								})()}
							</div>
						)}
					</div>
				</div>

				{/* Financial - Column 3 */}
				<div className="space-y-4">
					<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Financials</h4>
					<div className="p-5 rounded-lg border bg-card h-full flex flex-col">
						<div className="flex items-center gap-2 font-medium mb-4 text-primary">
							<CreditCard className="h-5 w-5" />
							Payment Summary
						</div>

						<div className="space-y-4 flex-1">
							{booking.totalAmountDue != null && (
								<div className="flex justify-between items-center pb-3 border-b border-dashed">
									<span className="text-muted-foreground">Total Amount Due</span>
									<span className="font-semibold">{formatCurrency(booking.totalAmountDue)}</span>
								</div>
							)}

							<div className="space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Amount Paid</span>
									<span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
										{formatCurrency(booking.amountPaid)}
									</span>
								</div>
							</div>

							{booking.amountRemaining != null && (
								<div className="mt-auto pt-4 border-t">
									<div className="flex flex-col gap-1">
										<span className="text-sm text-muted-foreground">Outstanding Balance</span>
										<span className={`text-2xl font-bold ${booking.amountRemaining > 0 ? "text-red-600" : "text-green-600"}`}>
											{formatCurrency(booking.amountRemaining)}
										</span>
										{booking.amountRemaining > 0 && (
											<span className="text-xs text-red-500 font-medium">Payment Required</span>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</DialogContent>
	);
}

const columnHelper = createColumnHelper<ManagerBookingViewResponse>();

const columns = [
	columnHelper.accessor("customId", {
		header: "ID",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("guestName", {
		header: "Guest Name",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("branchName", {
		header: "Branch Name",
		cell: (info) => info.getValue(),
	}),

	columnHelper.accessor("roomType", {
		header: "Room Type",
		cell: (info) => (
			<div className="flex items-center justify-center bg-[#fff5da] text-[#1c1c1c] p-2 rounded-md">
				{info.getValue()}
			</div>
		),
	}),

	columnHelper.accessor("amountPaid", {
		header: "Amount Paid",
		cell: (info) => formatCurrency(info.getValue()),
	}),

	columnHelper.accessor("bookingStatus", {
		header: "Status",
		cell: (info) => {
			const statusToVariant: Record<BookingStatus, BadgeVariant> = {
				// AVAILABLE: "outline",
				CHECKED_IN: "green",
				CHECKED_OUT: "blue",
				RESERVED: "yellow",
				CANCELLED: "destructive",
			};
			const status = info.getValue();
			const normalizedStatus = status.replace(/_/g, " ").toLowerCase();
			return (
				<Badge className="capitalize" variant={statusToVariant[status]}>
					{normalizedStatus}
				</Badge>
			);
		},
	}),

	columnHelper.accessor("checkInDate", {
		header: "Date",
		cell: (info) => {
			const date = new Date(info.getValue());
			const dateString = date.toLocaleDateString("en-US", {
				month: "short",
				day: "2-digit",
				year: "numeric",
			});
			const timeString = date.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: true,
			});
			return `${dateString} | ${timeString.toLowerCase()}`;
		},
	}),

	columnHelper.display({
		id: "actions",
		cell: (info) => {
			const [open, setOpen] = useState(false);
			const [openFolio, setOpenFolio] = useState(false);

			return (
				<div className="flex gap-1">
					<Dialog open={open} onOpenChange={setOpen}>
						<Button
							variant="ghost"
							size="sm"
							className="gap-1.5"
							onClick={() => setOpen(true)}
						>
							<EyeIcon className="h-4 w-4" />
							View Details
						</Button>
						{open && <BookingDetailsContent booking={info.row.original} />}
					</Dialog>
					<Dialog open={openFolio} onOpenChange={setOpenFolio}>
						<Button
							variant="ghost"
							size="sm"
							className="gap-1.5"
							onClick={() => setOpenFolio(true)}
						>
							<ReceiptIcon className="h-4 w-4" />
							Folio
						</Button>
						{openFolio && (
							<FolioContent
								bookingId={info.row.original.id}
								readOnly
								fetchAction={getManagerBookingFolio}
								exportAction={exportManagerFolioPdf}
							/>
						)}
					</Dialog>
				</div>
			);
		},
	}),
];

function BookingList({
	table,
}: {
	table: TableType<ManagerBookingViewResponse>;
}) {
	return (
		<div className="overflow-hidden rounded-md border">
			<Table>
				<TableHeader className="bg-gray-100">
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id} className="text-gray-500">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>

				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id} className="text-gray-600">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={columns.length}>
							<div className="w-full flex items-center justify-between">
								<p>
									{table.getFilteredSelectedRowModel().rows.length} of{" "}
									{table.getFilteredRowModel().rows.length} row(s) selected.
								</p>

								<DataTablePagination table={table} />
							</div>
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	);
}

function BookingsListToolbar({
	table,
}: {
	table: TableType<ManagerBookingViewResponse>;
}) {
	const [bookingState, setBookingState] = useQueryState(
		"bookingStatus",
		parseAsStringLiteral(["RESERVED", "CHECKED_OUT"]),
	);

	const [filterOpen, setFilterOpen] = useState(false);
	// Filter query states
	const [filterQueryState, setFilterQueryStatus] = useQueryStates({
		bookingStatus: parseAsStringLiteral([
			"CHECKED_IN",
			"CHECKED_OUT",
			"RESERVED",
			"CANCELLED",
		]),
		search: parseAsString,
	});

	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const setSuccessDialogOpen = useSetAtom(successDialogAtom);

	// Memoized applied filters for chips
	const appliedFilters = useMemo(() => {
		const filters: Array<{ key: string; label: string; value: string }> = [];

		if (filterQueryState) {
			const statusLabels = {
				CHECKED_IN: "Checked In",
				CHECKED_OUT: "Checked Out",
				RESERVED: "Reserved",
				CANCELLED: "Cancelled",
			};
			filterQueryState.bookingStatus &&
				filters.push({
					key: "bookingStatus",
					label: "Status",
					value: statusLabels[filterQueryState.bookingStatus],
				});
		}

		return filters;
	}, [filterQueryState]);

	// Handler to remove individual filters
	const removeFilter = useCallback(
		(key: string) => {
			if (key === "bookingStatus") {
				setFilterQueryStatus(null);
			}
		},
		[setFilterQueryStatus],
	);

	const handleExport = useCallback(
		async (data: ExportData) => {
			try {
				const result = await exportBookings({
					search: filterQueryState.search || undefined,
					bookingStatus: filterQueryState.bookingStatus || undefined,
					format: data.export_type.toUpperCase() as "CSV" | "PDF" | "EXCEL",
				});

				if (result.success && result.data) {
					const byteCharacters = atob(result.data.base64);
					const byteNumbers = new Array(byteCharacters.length);
					for (let i = 0; i < byteCharacters.length; i++) {
						byteNumbers[i] = byteCharacters.charCodeAt(i);
					}
					const byteArray = new Uint8Array(byteNumbers);
					const mimeType =
						data.export_type === "csv"
							? "text/csv"
							: data.export_type === "pdf"
								? "application/pdf"
								: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
					const blob = new Blob([byteArray], { type: mimeType });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = result.data.filename;
					document.body.appendChild(a);
					a.click();
					window.URL.revokeObjectURL(url);
					document.body.removeChild(a);
					setExportDialogOpen(false);
					setSuccessDialogOpen({
						show: true,
						message: "Bookings exported successfully!",
					});
				} else {
					setSuccessDialogOpen({
						show: true,
						message: result.error || "Failed to export bookings",
					});
				}
			} catch {
				setSuccessDialogOpen({
					show: true,
					message: "An error occurred during export",
				});
			}
		},
		[filterQueryState, setSuccessDialogOpen],
	);

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div className="flex items-center gap-x-2">
				<Button
					size="sm"
					variant="outline"
					data-active={bookingState === null}
					onClick={() => setBookingState(null)}
					className="shadow-none text-xs hover:border-transparent rounded-full"
				>
					All Bookings{" "}
					{bookingState === null &&
						`(${table.getRowCount() * table.getPageCount()})`}
				</Button>

				<Button
					size="sm"
					variant="outline"
					data-active={bookingState === "RESERVED"}
					onClick={() => setBookingState("RESERVED")}
					className="shadow-none text-xs hover:border-transparent rounded-full"
				>
					Reservations{" "}
					{bookingState === "RESERVED" &&
						`(${table.getFilteredRowModel().rows.length})`}
				</Button>

				<Button
					size="sm"
					variant="outline"
					data-active={bookingState === "CHECKED_OUT"}
					onClick={() => setBookingState("CHECKED_OUT")}
					className="shadow-none text-xs hover:border-transparent rounded-full"
				>
					Booking history{" "}
					{bookingState === "CHECKED_OUT" &&
						`(${table.getFilteredRowModel().rows.length})`}
				</Button>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search bookings"
						value={filterQueryState.search ?? ""}
						onChange={(e) =>
							setFilterQueryStatus({ search: e.target.value || null })
						}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				{/* Applied Filter Chips */}
				{appliedFilters.map((filter) => (
					<Badge
						key={filter.key}
						variant="blue"
						className="px-2 py-1 text-xs flex items-center gap-1"
					>
						{filter.label}: {filter.value}
						<button
							type="button"
							onClick={() => removeFilter(filter.key)}
							className="ml-1 hover:text-red-500"
						>
							×
						</button>
					</Badge>
				))}

				<TableFilter open={filterOpen} setOpen={setFilterOpen}>
					<ManagerBookingsFilter
						queryState={filterQueryState}
						setQueryState={setFilterQueryStatus}
						setOpen={setFilterOpen}
					/>
				</TableFilter>

				{/* <AddNewHotelDialog /> */}

				<ExportDialog
					open={exportDialogOpen}
					setOpenAction={setExportDialogOpen}
					onSubmitAction={handleExport}
				/>
			</div>
		</div>
	);
}

export function BookingsPage({
	breadcrumb,
	paginationMeta,
	bookings,
}: {
	bookings: ManagerBookingViewResponse[];
	paginationMeta: Pagination;
	breadcrumb: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();
	const table = useReactTable({
		data: bookings,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		state: {
			pagination,
		},
	});
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

	useEffect(() => {
		setBreadcrumb(breadcrumb);
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumb]);

	return (
		<div className="p-4 space-y-2 md:space-y-4">
			<BookingsListToolbar table={table} />
			<BookingList table={table} />
			<SuccessDialog
				open={successDialogOpen.show}
				setOpenAction={(show) =>
					setSuccessDialogOpen({ ...successDialogOpen, show })
				}
				message={successDialogOpen.message}
			/>
		</div>
	);
}
