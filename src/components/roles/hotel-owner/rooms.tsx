"use client";

import { useLayoutEffect, useState, useTransition, useMemo, useCallback } from "react";
import { useSetAtom } from "jotai";
import { PlusIcon, SearchIcon, RotateCcwIcon, XIcon, MoreVerticalIcon } from "lucide-react";
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { DataTablePagination } from "@/components/shared/pagination";
import { TableFilter } from "@/components/shared/table-filter";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { addNewRoomToHotelOwner } from "@/lib/hotel-owner-actions";
import { toast } from "sonner";
import type { APIOutput } from "@/lib/action-utils";
import type { Pagination } from "@/lib/fetch";
import { formatCurrency } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoomDetailsContent } from "@/components/roles/front-desk/room-details-content";
import { GuestDetailsContent } from "@/components/roles/front-desk/guest-details-content";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type Table as TableType,
} from "@tanstack/react-table";

type RoomEntry = APIOutput<"@get/api/hotel-owners/hotels/:hotelId/rooms">["data"]["content"][number];

const ROOM_STATUSES = [
	"AVAILABLE",
	"RESERVED",
	"BOOKED",
	"CHECKED_IN",
	"CHECKED_OUT",
	"BLOCKED",
	"DIRTY",
] as const;

const statusVariants: Record<string, BadgeVariant> = {
	AVAILABLE: "green",
	RESERVED: "yellow",
	BOOKED: "blue",
	CHECKED_IN: "blue",
	CHECKED_OUT: "secondary",
	BLOCKED: "destructive",
	DIRTY: "red",
};

// --- Add Room Dialog ---

function AddRoomDialog({ hotelId, roomTypes }: { hotelId: string; roomTypes: any[] }) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const payload = {
			roomName: formData.get("roomName") as string,
			roomNumber: formData.get("roomNumber") as string,
			roomType: formData.get("roomType") as string,
			price: Number(formData.get("price")),
			facilities: (formData.get("facilities") as string)
				.split(",")
				.map((f) => f.trim())
				.filter(Boolean),
		};

		startTransition(async () => {
			const result = await addNewRoomToHotelOwner(payload);
			if (result.success) {
				toast.success("Room added successfully");
				setOpen(false);
			} else {
				toast.error(result.error || "Failed to add room");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="rounded-xl gap-1.5">
					<PlusIcon className="size-4" />
					Add New Room
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Room</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label htmlFor="roomName">Room Name</Label>
							<Input id="roomName" name="roomName" required />
						</div>
						<div>
							<Label htmlFor="roomNumber">Room Number</Label>
							<Input id="roomNumber" name="roomNumber" required />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label htmlFor="roomType">Room Type</Label>
							<Input
								id="roomType"
								name="roomType"
								placeholder="e.g. Standard, Deluxe"
								list="room-types-list"
								required
							/>
							<datalist id="room-types-list">
								{roomTypes.map((rt: any) => (
									<option key={rt.id} value={rt.name} />
								))}
							</datalist>
						</div>
						<div>
							<Label htmlFor="price">Price per Night</Label>
							<Input
								id="price"
								name="price"
								type="number"
								min="0"
								step="0.01"
								required
							/>
						</div>
					</div>
					<div>
						<Label htmlFor="facilities">
							Facilities (comma-separated)
						</Label>
						<Input
							id="facilities"
							name="facilities"
							placeholder="WiFi, AC, TV, Mini Bar"
						/>
					</div>
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Adding..." : "Add Room"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// --- Filter ---

function RoomsFilter({
	rooms,
	queryState,
	setQueryState,
}: {
	rooms: RoomEntry[];
	queryState: {
		roomStatus: string | null;
		search: string | null;
		roomType: string | null;
	};
	setQueryState: (state: Partial<typeof queryState>) => void;
}) {
	const [tempFilters, setTempFilters] = useState({
		roomType: queryState.roomType,
		status: queryState.roomStatus,
	});

	const roomTypes = useMemo(() => {
		return Array.from(new Set(rooms.map((room) => room.roomType))).filter(
			Boolean,
		);
	}, [rooms]);

	const filterStates = useMemo(() => {
		const hasActiveFilters = tempFilters.roomType || tempFilters.status;
		return { hasActiveFilters };
	}, [tempFilters.roomType, tempFilters.status]);

	const applyFilters = useCallback(() => {
		setQueryState({
			...queryState,
			roomStatus: tempFilters.status,
			roomType: tempFilters.roomType,
		});
	}, [queryState, tempFilters.status, tempFilters.roomType, setQueryState]);

	const clearFilters = useCallback(() => {
		setTempFilters({ roomType: null, status: null });
		setQueryState({
			search: queryState.search,
			roomStatus: null,
			roomType: null,
		});
	}, [queryState.search, setQueryState]);

	const roomStatusOptions = [
		{ value: "AVAILABLE", label: "Available" },
		{ value: "RESERVED", label: "Reserved" },
		{ value: "CHECKED_IN", label: "Checked In" },
		{ value: "CHECKED_OUT", label: "Checked Out" },
		{ value: "BLOCKED", label: "Blocked" },
		{ value: "DIRTY", label: "Dirty" },
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-sm">Filter Rooms</h4>
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

			<div className="space-y-2">
				<Label className="text-sm font-medium">Status</Label>
				<Select
					value={tempFilters.status || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							status: value === "all" ? null : value,
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{roomStatusOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label className="text-sm font-medium">Room Type</Label>
				<Select
					value={tempFilters.roomType || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							roomType: value === "all" ? null : value,
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All room types" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All room types</SelectItem>
						{roomTypes.map((roomType) => (
							<SelectItem key={roomType} value={roomType}>
								{roomType}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{filterStates.hasActiveFilters && (
				<div className="pt-2 border-t">
					<p className="text-xs text-muted-foreground mb-2">Active filters:</p>
					<div className="flex flex-wrap gap-1">
						{tempFilters.status && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Status: {tempFilters.status.toLowerCase().replace("_", " ")}
							</span>
						)}
						{tempFilters.roomType && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Type: {tempFilters.roomType}
							</span>
						)}
					</div>
				</div>
			)}

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
}

// --- Toolbar ---

function RoomListToolbar({
	table,
	rooms,
	hotelId,
	roomTypes,
	isDeactivatedView,
}: {
	table: TableType<RoomEntry>;
	rooms: RoomEntry[];
	hotelId: string;
	roomTypes: any[];
	isDeactivatedView: boolean;
}) {
	const [queryState, setQueryState] = useQueryStates({
		roomStatus: parseAsStringLiteral(["AVAILABLE"]),
		search: parseAsString,
		roomType: parseAsString,
		active: parseAsBoolean,
	});

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div className="flex items-center gap-x-2">
				<Button
					size="sm"
					variant="outline"
					onClick={() => setQueryState({ active: null, roomStatus: null })}
					className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
						!isDeactivatedView
							? "bg-primary text-primary-foreground border-primary"
							: ""
					}`}
				>
					Active Rooms
				</Button>

				<Button
					size="sm"
					variant="outline"
					onClick={() => setQueryState({ active: false, roomStatus: null })}
					className={`shadow-none text-xs hover:border-transparent rounded-full transition-colors ${
						isDeactivatedView
							? "bg-primary text-primary-foreground border-primary"
							: ""
					}`}
				>
					Deactivated Rooms
				</Button>
			</div>

			<div className="flex items-center gap-x-2">
				<div className="relative">
					<input
						type="text"
						placeholder="Search Rooms"
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
						value={queryState.search ?? ""}
						onChange={(e) =>
							setQueryState({ search: e.target.value || null })
						}
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				<div className="flex items-center gap-2">
					<TableFilter>
						<RoomsFilter
							rooms={rooms}
							queryState={queryState}
							setQueryState={setQueryState}
						/>
					</TableFilter>

					{queryState.roomType && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<span>Type:</span>
							<span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
								{queryState.roomType}
							</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
								onClick={() => setQueryState({ roomType: null })}
							>
								<XIcon className="h-3 w-3" />
							</Button>
						</div>
					)}
				</div>

				<AddRoomDialog hotelId={hotelId} roomTypes={roomTypes} />
			</div>
		</div>
	);
}

// --- Room Table Actions ---

function RoomTableActions({ row }: { row: RoomEntry }) {
	const [showRoomDetails, setShowRoomDetails] = useState(false);
	const [showGuestDetails, setShowGuestDetails] = useState(false);

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon">
					<span className="sr-only">Open menu</span>
					<MoreVerticalIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Actions</DropdownMenuLabel>

				<DropdownMenuItem
					onClick={() => navigator.clipboard.writeText(row.customId)}
				>
					Copy Room ID
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<Dialog open={showRoomDetails} onOpenChange={setShowRoomDetails}>
					<DialogTrigger asChild>
						<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
							View Room Details
						</DropdownMenuItem>
					</DialogTrigger>
					<RoomDetailsContent room={row} />
				</Dialog>

				<Dialog open={showGuestDetails} onOpenChange={setShowGuestDetails}>
					<DialogTrigger asChild>
						<DropdownMenuItem
							disabled={!row.guestDetails}
							onSelect={(e) => e.preventDefault()}
						>
							{row.checkInStatus === "AVAILABLE" ? "View Last Guest" : "View Guest Details"}
						</DropdownMenuItem>
					</DialogTrigger>
					<GuestDetailsContent
						guestDetails={row.guestDetails}
						roomIdentifier={row.roomIdentifier}
					/>
				</Dialog>

				</DropdownMenuContent>
		</DropdownMenu>
	);
}

// --- Columns ---

const columnHelper = createColumnHelper<RoomEntry>();

const columns = [
	columnHelper.accessor("customId", {
		header: "ID",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("roomIdentifier", {
		header: "Room Name/No",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("roomType", {
		header: "Room Type",
		cell: (info) => (
			<div className="flex items-center justify-center bg-[#fff5da] text-[#1c1c1c] p-2 rounded-md">
				{info.getValue() || "-"}
			</div>
		),
		filterFn: "equalsString",
	}),
	columnHelper.accessor("roomPrice", {
		header: "Price",
		cell: (info) => {
			const price = info.getValue();
			return price ? formatCurrency(Number(price)) : "-";
		},
	}),
	columnHelper.accessor("checkInStatus", {
		header: "Room Status",
		cell: (info) => {
			const status = info.getValue();
			const statusToLabel = status.replace(/_/g, " ").toLowerCase();
			return (
				<Badge
					className="capitalize"
					variant={statusVariants[status] ?? "outline"}
				>
					{statusToLabel}
				</Badge>
			);
		},
	}),
	columnHelper.accessor("roomFacility", {
		header: "Room Facilities",
		cell: (info) => {
			const facilities = info.getValue() ?? [];
			const limit = 2;
			const displayed = facilities.slice(0, limit);
			const remaining = facilities.length - limit;

			return (
				<div className="flex flex-wrap gap-1 text-xs">
					{displayed.map((facility) => (
						<span
							key={facility}
							className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200"
						>
							{facility}
						</span>
					))}
					{remaining > 0 && (
						<span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-500 border border-gray-200 text-[10px]">
							+{remaining} more
						</span>
					)}
				</div>
			);
		},
	}),
	columnHelper.accessor("deactivationReason", {
		header: "Deactivation Reason",
		cell: (info) => {
			const reason = info.getValue();
			if (!reason) return <span className="text-gray-400">-</span>;
			return <span className="text-sm text-gray-700">{reason}</span>;
		},
	}),
	columnHelper.display({
		id: "actions",
		cell: ({ row }) => <RoomTableActions row={row.original} />,
	}),
];

// --- Table ---

function RoomListTable({ table }: { table: TableType<RoomEntry> }) {
	return (
		<div className="overflow-hidden rounded-md border bg-card">
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
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} className="hover:bg-gray-50">
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
								colSpan={columns.length}
								className="h-24 text-center"
							>
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={columns.length}>
							<div className="w-full flex items-center justify-between">
								<span className="text-sm text-gray-500">
									Page {table.getState().pagination.pageIndex + 1} of{" "}
									{table.getPageCount()}
								</span>
								<DataTablePagination table={table} />
							</div>
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	);
}

// --- Page ---

export function OwnerRooms({
	rooms,
	paginationMeta,
	roomTypes,
	hotelId,
	isDeactivatedView = false,
}: {
	rooms: RoomEntry[];
	paginationMeta: Pagination;
	roomTypes: any[];
	hotelId: string;
	isDeactivatedView?: boolean;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const [pagination, onPaginationChange] = usePaginationSearchParams();

	const breadcrumbs: Breadcrumb[] = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Rooms", href: "/dashboard/rooms" },
	];

	const columnVisibility = useMemo(() => ({
		deactivationReason: isDeactivatedView,
		checkInStatus: !isDeactivatedView,
	}), [isDeactivatedView]);

	const table = useReactTable({
		data: rooms,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		state: {
			pagination,
			columnVisibility,
		},
	});

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Room Management",
			breadcrumbs,
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb]);

	return (
		<div className="space-y-6 px-2">
			<RoomListToolbar
				table={table}
				rooms={rooms}
				hotelId={hotelId}
				roomTypes={roomTypes}
				isDeactivatedView={isDeactivatedView}
			/>
			<RoomListTable table={table} />
		</div>
	);
}
