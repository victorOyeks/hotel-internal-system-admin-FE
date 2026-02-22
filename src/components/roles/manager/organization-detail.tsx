"use client";

import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowLeftIcon,
	FileDownIcon,
	Loader2Icon,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
	SearchIcon,
} from "lucide-react";
import { BookGuestsSheet } from "./book-guests-sheet";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { useSetAtom } from "jotai";
import { useLayoutEffect, useMemo, useState } from "react";
import { DataTablePagination } from "@/components/shared/pagination";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { OrganizationResponse } from "@/lib/api-routes/corporate";
import type {
	GuestSpendingDetails,
	OrgTransactionListItem,
	StaffBreakdown,
} from "@/lib/api-routes/corporate";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
	getOrganizationGuests,
	getOrganizationTransactions,
	getOrganizationReport,
	exportOrganizationReport,
} from "@/lib/corporate-actions";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Guests Tab ---

const guestColumnHelper = createColumnHelper<GuestSpendingDetails>();

const guestColumns = [
	guestColumnHelper.accessor("guestName", {
		header: "Guest Name",
		cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
	}),
	guestColumnHelper.accessor("bookingCustomId", {
		header: "Booking ID",
		cell: (info) => (
			<span className="font-mono text-xs">{info.getValue()}</span>
		),
	}),
	guestColumnHelper.accessor("roomIdentifier", {
		header: "Room",
		cell: (info) => <span>{info.getValue()}</span>,
	}),
	guestColumnHelper.accessor("roomType", {
		header: "Room Type",
		cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
	}),
	guestColumnHelper.accessor("bookingStatus", {
		header: "Status",
		cell: (info) => {
			const status = info.getValue();
			const variant = status === "CHECKED_IN" ? "green" : status === "RESERVED" ? "yellow" : "gray";
			const label = status === "CHECKED_IN" ? "Checked In" : status === "RESERVED" ? "Reserved" : status === "CHECKED_OUT" ? "Checked Out" : status;
			return <Badge variant={variant}>{label}</Badge>;
		},
	}),
	guestColumnHelper.accessor("checkInDate", {
		header: "Check-In",
		cell: (info) => {
			const val = info.getValue();
			if (!val) return <span>-</span>;
			return (
				<span>
					{new Date(val).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					})}
				</span>
			);
		},
	}),
	guestColumnHelper.accessor("dailySpendingCap", {
		header: "Daily Cap",
		cell: (info) => {
			const val = info.getValue();
			return (
				<span className="font-mono">
					{val != null ? `${val.toLocaleString()}` : "No cap"}
				</span>
			);
		},
	}),
	guestColumnHelper.accessor("amountSpentToday", {
		header: "Spent Today",
		cell: (info) => (
			<span className="font-mono">{info.getValue().toLocaleString()}</span>
		),
	}),
	guestColumnHelper.accessor("amountLeftToday", {
		header: "Remaining",
		cell: (info) => (
			<span className="font-mono">{info.getValue().toLocaleString()}</span>
		),
	}),
	guestColumnHelper.accessor("totalAmountSpent", {
		header: "Total Spent",
		cell: (info) => (
			<span className="font-mono font-semibold">{info.getValue().toLocaleString()}</span>
		),
	}),
	guestColumnHelper.accessor("capExceeded", {
		header: "Status",
		cell: (info) => (
			<Badge variant={info.getValue() ? "red" : "green"}>
				{info.getValue() ? "Cap Exceeded" : "Within Cap"}
			</Badge>
		),
	}),
];

function OrganizationGuestsTab({
	organizationId,
	hotelId,
}: {
	organizationId: string;
	hotelId: string;
}) {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["organization-guests", organizationId, hotelId, search, page],
		queryFn: () =>
			getOrganizationGuests(organizationId, hotelId, {
				search: search || undefined,
				page,
				size: 10,
			}),
		placeholderData: keepPreviousData,
	});

	const guests = data?.content ?? [];
	const totalPages = data?.totalPages ?? 0;

	const table = useReactTable({
		data: guests,
		columns: guestColumns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
		pageCount: totalPages,
		state: {
			pagination: { pageIndex: page, pageSize: 10 },
		},
		onPaginationChange: (updater) => {
			const newState =
				typeof updater === "function"
					? updater({ pageIndex: page, pageSize: 10 })
					: updater;
			setPage(newState.pageIndex);
		},
	});

	if (isLoading && !data) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2Icon className="animate-spin size-6 text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<div className="relative flex-1 max-w-sm">
					<input
						type="text"
						placeholder="Search guests.."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(0);
						}}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary size-4" />
				</div>
			</div>

			<div className={cn("overflow-hidden rounded-md border", isFetching && "opacity-60 transition-opacity")}>
				<Table>
					<TableHeader className="bg-gray-100">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="text-gray-500">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className={cn(
										row.original.capExceeded && "bg-red-50/50",
									)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="text-gray-600">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={guestColumns.length}
									className="h-24 text-center"
								>
									No guests assigned to this organization.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
					{totalPages > 1 && (
						<TableFooter>
							<TableRow>
								<TableCell colSpan={guestColumns.length}>
									<div className="w-full flex items-center justify-end">
										<DataTablePagination table={table} />
									</div>
								</TableCell>
							</TableRow>
						</TableFooter>
					)}
				</Table>
			</div>
		</div>
	);
}

// --- Transactions Tab ---

const transactionColumnHelper = createColumnHelper<OrgTransactionListItem>();

const transactionTypeColors: Record<string, BadgeVariant> = {
	ROOM: "blue",
	RESTAURANT: "green",
	BAR: "yellow",
	LAUNDRY: "purple",
	RENTAL: "orange",
	MANUAL: "gray",
};

const transactionColumns = [
	transactionColumnHelper.accessor("staffName", {
		header: "Staff Name",
		cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
	}),
	transactionColumnHelper.accessor("type", {
		header: "Type",
		cell: (info) => {
			const type = info.getValue();
			return (
				<Badge variant={transactionTypeColors[type] ?? "gray"}>{type}</Badge>
			);
		},
	}),
	transactionColumnHelper.accessor("reference", {
		header: "Reference",
		cell: (info) => (
			<span className="font-mono text-xs">{info.getValue()}</span>
		),
	}),
	transactionColumnHelper.accessor("description", {
		header: "Description",
		cell: (info) => (
			<span className="max-w-[250px] truncate block" title={info.getValue()}>
				{info.getValue()}
			</span>
		),
	}),
	transactionColumnHelper.accessor("amount", {
		header: "Amount",
		cell: (info) => (
			<span className="font-mono font-semibold">
				{info.getValue().toLocaleString()}
			</span>
		),
	}),
	transactionColumnHelper.accessor("dateTime", {
		header: "Date",
		cell: (info) => {
			const val = info.getValue();
			if (!val) return <span>-</span>;
			return (
				<span>
					{new Date(val).toLocaleString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
						hour: "numeric",
						minute: "numeric",
						hour12: true,
					})}
				</span>
			);
		},
	}),
];

function OrganizationTransactionsTab({
	organizationId,
	hotelId,
}: {
	organizationId: string;
	hotelId: string;
}) {
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("ALL");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [page, setPage] = useState(0);

	const { data, isLoading, isFetching } = useQuery({
		queryKey: [
			"organization-transactions",
			organizationId,
			hotelId,
			search,
			typeFilter,
			startDate,
			endDate,
			page,
		],
		queryFn: () =>
			getOrganizationTransactions(organizationId, hotelId, {
				search: search || undefined,
				type: typeFilter !== "ALL" ? typeFilter : undefined,
				start: startDate || undefined,
				end: endDate || undefined,
				page,
				size: 10,
			}),
		placeholderData: keepPreviousData,
	});

	const items = data?.items ?? [];
	const totalPages = data?.totalPages ?? 0;

	const table = useReactTable({
		data: items,
		columns: transactionColumns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
		pageCount: totalPages,
		state: {
			pagination: { pageIndex: page, pageSize: 10 },
		},
		onPaginationChange: (updater) => {
			const newState =
				typeof updater === "function"
					? updater({ pageIndex: page, pageSize: 10 })
					: updater;
			setPage(newState.pageIndex);
		},
	});

	if (isLoading && !data) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2Icon className="animate-spin size-6 text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative flex-1 max-w-sm">
					<input
						type="text"
						placeholder="Search by staff name..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(0);
						}}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary size-4" />
				</div>

				<Select
					value={typeFilter}
					onValueChange={(v) => {
						setTypeFilter(v);
						setPage(0);
					}}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">All Types</SelectItem>
						<SelectItem value="ROOM">Room</SelectItem>
						<SelectItem value="RESTAURANT">Restaurant</SelectItem>
						<SelectItem value="BAR">Bar</SelectItem>
						<SelectItem value="LAUNDRY">Laundry</SelectItem>
						<SelectItem value="RENTAL">Rental</SelectItem>
						<SelectItem value="MANUAL">Manual</SelectItem>
					</SelectContent>
				</Select>

				<Input
					type="date"
					value={startDate}
					onChange={(e) => {
						setStartDate(e.target.value);
						setPage(0);
					}}
					className="w-auto"
					placeholder="Start date"
				/>
				<Input
					type="date"
					value={endDate}
					onChange={(e) => {
						setEndDate(e.target.value);
						setPage(0);
					}}
					className="w-auto"
					placeholder="End date"
				/>
			</div>

			<div className={cn("overflow-hidden rounded-md border", isFetching && "opacity-60 transition-opacity")}>
				<Table>
					<TableHeader className="bg-gray-100">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="text-gray-500">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="text-gray-600">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={transactionColumns.length}
									className="h-24 text-center"
								>
									No transactions found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
					{totalPages > 1 && (
						<TableFooter>
							<TableRow>
								<TableCell colSpan={transactionColumns.length}>
									<div className="w-full flex items-center justify-end">
										<DataTablePagination table={table} />
									</div>
								</TableCell>
							</TableRow>
						</TableFooter>
					)}
				</Table>
			</div>
		</div>
	);
}

// --- Reports Tab ---

const staffBreakdownColumnHelper = createColumnHelper<StaffBreakdown>();

const staffBreakdownColumns = [
	staffBreakdownColumnHelper.accessor("staffName", {
		header: "Staff Name",
		cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
	}),
	staffBreakdownColumnHelper.accessor("bookingCustomId", {
		header: "Booking ID",
		cell: (info) => (
			<span className="font-mono text-xs">{info.getValue()}</span>
		),
	}),
	staffBreakdownColumnHelper.accessor("roomCharges", {
		header: "Room",
		cell: (info) => (
			<span className="font-mono">{info.getValue().toLocaleString()}</span>
		),
	}),
	staffBreakdownColumnHelper.accessor("restaurantCharges", {
		header: "Restaurant",
		cell: (info) => (
			<span className="font-mono">{info.getValue().toLocaleString()}</span>
		),
	}),
staffBreakdownColumnHelper.accessor("laundryCharges", {
		header: "Laundry",
		cell: (info) => (
			<span className="font-mono">{info.getValue().toLocaleString()}</span>
		),
	}),
	staffBreakdownColumnHelper.accessor("rentalCharges", {
		header: "Rental",
		cell: (info) => (
			<span className="font-mono">{info.getValue().toLocaleString()}</span>
		),
	}),
	staffBreakdownColumnHelper.accessor("manualCharges", {
		header: "Manual",
		cell: (info) => (
			<span className="font-mono">{info.getValue().toLocaleString()}</span>
		),
	}),
	staffBreakdownColumnHelper.accessor("total", {
		header: "Total",
		cell: (info) => (
			<span className="font-mono font-bold">
				{info.getValue().toLocaleString()}
			</span>
		),
	}),
];

function SummaryCard({
	label,
	value,
	variant = "default",
}: {
	label: string;
	value: number;
	variant?: "default" | "highlight";
}) {
	return (
		<div
			className={cn(
				"rounded-xl border p-4 space-y-1",
				variant === "highlight"
					? "bg-primary/5 border-primary/20"
					: "bg-white",
			)}
		>
			<p className="text-sm text-muted-foreground">{label}</p>
			<p
				className={cn(
					"text-xl font-bold font-mono",
					variant === "highlight" && "text-primary",
				)}
			>
				{value.toLocaleString()}
			</p>
		</div>
	);
}

function OrganizationReportsTab({
	organizationId,
	organizationName,
	hotelId,
}: {
	organizationId: string;
	organizationName: string;
	hotelId: string;
}) {
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [isExporting, setIsExporting] = useState(false);
	const [includeTransactions, setIncludeTransactions] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: [
			"organization-report",
			organizationId,
			hotelId,
			startDate,
			endDate,
		],
		queryFn: () =>
			getOrganizationReport(organizationId, hotelId, {
				start: startDate || undefined,
				end: endDate || undefined,
			}),
	});

	const breakdowns = data?.staffBreakdowns ?? [];

	const table = useReactTable({
		data: breakdowns,
		columns: staffBreakdownColumns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const handleDownload = async () => {
		setIsExporting(true);
		try {
			const result = await exportOrganizationReport({
				organizationId,
				hotelId,
				start: startDate || undefined,
				end: endDate || undefined,
				includeTransactions,
			});
			if (result.success && result.data) {
				const url = window.URL.createObjectURL(result.data as Blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `billing_statement_${organizationName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
				a.click();
				window.URL.revokeObjectURL(url);
				toast.success("Billing statement downloaded");
			} else {
				toast.error(result.error || "Failed to export");
			}
		} catch {
			toast.error("Failed to download statement");
		} finally {
			setIsExporting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2Icon className="animate-spin size-6 text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-2">
				<Input
					type="date"
					value={startDate}
					onChange={(e) => setStartDate(e.target.value)}
					className="w-auto"
					placeholder="Start date"
				/>
				<Input
					type="date"
					value={endDate}
					onChange={(e) => setEndDate(e.target.value)}
					className="w-auto"
					placeholder="End date"
				/>

				<div className="ml-auto flex items-center gap-3">
					<label className="flex items-center gap-1.5 text-sm cursor-pointer">
						<Checkbox
							checked={includeTransactions}
							onCheckedChange={(checked) =>
								setIncludeTransactions(checked === true)
							}
						/>
						Include transactions
					</label>
					<Button
						variant="outline"
						size="sm"
						onClick={handleDownload}
						disabled={isExporting}
						className="gap-1.5"
					>
						{isExporting ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							<FileDownIcon className="size-4" />
						)}
						Download Statement
					</Button>
				</div>
			</div>

			{data && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
					<SummaryCard
						label="Room Charges"
						value={data.totalRoomCharges}
					/>
					<SummaryCard
						label="Restaurant Charges"
						value={data.totalRestaurantCharges}
					/>
		<SummaryCard
						label="Laundry Charges"
						value={data.totalLaundryCharges}
					/>
					<SummaryCard
						label="Rental Charges"
						value={data.totalRentalCharges}
					/>
					<SummaryCard
						label="Manual Charges"
						value={data.totalManualCharges}
					/>
					<SummaryCard
						label="Grand Total"
						value={data.grandTotal}
						variant="highlight"
					/>
				</div>
			)}

			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeader className="bg-gray-100">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="text-gray-500">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="text-gray-600">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={staffBreakdownColumns.length}
									className="h-24 text-center"
								>
									No staff breakdowns available.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

// --- Main Detail Page ---

export function OrganizationDetailPage({
	breadcrumb,
	organization,
	hotelId,
	canBookGuests = false,
}: {
	breadcrumb: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
	organization: OrganizationResponse;
	hotelId: string;
	canBookGuests?: boolean;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const router = useRouter();
	const [tab, setTab] = useQueryState(
		"tab",
		parseAsString.withDefault("guests"),
	);

	useLayoutEffect(() => {
		setBreadcrumb(breadcrumb);
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumb]);

	return (
		<div className="p-4 space-y-4">
			{/* Header */}
			<div className="space-y-3">
				<Button
					variant="ghost"
					size="sm"
					className="gap-1"
					onClick={() => router.push("/dashboard/organizations")}
				>
					<ArrowLeftIcon className="size-4" />
					Back to Organizations
				</Button>

				<div className="bg-white rounded-xl border p-4 md:p-6">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-xl font-bold">{organization.name}</h1>
								<Badge variant="outline" className="font-mono text-xs">
									{organization.customId}
								</Badge>
							</div>
							<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
								<span className="flex items-center gap-1">
									<MailIcon className="size-3.5" />
									{organization.email}
								</span>
								<span className="flex items-center gap-1">
									<PhoneIcon className="size-3.5" />
									{organization.phoneNumber}
								</span>
								<span className="flex items-center gap-1">
									<MapPinIcon className="size-3.5" />
									{organization.address}
								</span>
							</div>
						</div>
						{canBookGuests && (
							<BookGuestsSheet
								organizationId={organization.id}
								organizationName={organization.name}
								hotelId={hotelId}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Tabs */}
			<Tabs value={tab} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="guests">Guests</TabsTrigger>
					<TabsTrigger value="transactions">Transactions</TabsTrigger>
					<TabsTrigger value="reports">Billing Report</TabsTrigger>
				</TabsList>

				<TabsContent value="guests">
					<OrganizationGuestsTab
						organizationId={organization.id}
						hotelId={hotelId}
					/>
				</TabsContent>

				<TabsContent value="transactions">
					<OrganizationTransactionsTab
						organizationId={organization.id}
						hotelId={hotelId}
					/>
				</TabsContent>

				<TabsContent value="reports">
					<OrganizationReportsTab
						organizationId={organization.id}
						organizationName={organization.name}
						hotelId={hotelId}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
