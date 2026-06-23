"use client";

import { useLayoutEffect, useState, useMemo, useCallback } from "react";
import { useSetAtom } from "jotai";
import { PlusIcon, SearchIcon, RotateCcwIcon, XIcon, MoreVerticalIcon, TrashIcon } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { ListSubmitLoader } from "@/components/shared/list-submit-loader";
import { BulkUploadResultDisplay } from "@/components/shared/bulk-upload-result";
import type { BulkUploadResult } from "@/lib/bulk-upload-types";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { addNewRoomToHotelOwner, exportRooms, updateRoomOwner, toggleRoomActiveOwner } from "@/lib/hotel-owner-actions";
import { useMutation } from "@tanstack/react-query";
import { revalidateRoute } from "@/lib/actions";
import { DeactivateRoomDialog } from "@/components/shared/deactivate-room-dialog";
import { toast } from "sonner";
import { ExportDialog, type ExportData } from "@/components/shared/shared-dialogs";
import { format } from "date-fns";
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

// --- Edit Room Dialog ---

const editRoomSchema = z.object({
	roomIdentifier: z.string().min(1, "Required"),
	roomType: z.string().min(1, "Required"),
	roomPrice: z.string().min(1, "Required"),
	roomFacilities: z.string().optional(),
});

function EditRoomDialog({
	room,
	open,
	onOpenChange,
}: {
	room: RoomEntry;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm<z.infer<typeof editRoomSchema>>({
		resolver: zodResolver(editRoomSchema),
		defaultValues: {
			roomIdentifier: room.roomIdentifier,
			roomType: room.roomType,
			roomPrice: String(room.roomPrice),
			roomFacilities: room.roomFacility?.join(", ") ?? "",
		},
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof editRoomSchema>) => {
			const facilities = data.roomFacilities
				? data.roomFacilities.split(",").map((f) => f.trim()).filter(Boolean)
				: [];
			const res = await updateRoomOwner(room.id, {
				roomIdentifier: data.roomIdentifier,
				roomType: data.roomType,
				roomPrice: Number(data.roomPrice),
				roomStatus: room.checkInStatus,
				roomFacility: facilities,
			});
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Room updated successfully");
			onOpenChange(false);
			revalidateRoute("/hotel-owner/rooms");
		},
		onError: (e) => {
			toast.error("Failed to update room", { description: e.message });
		},
	});

	return (
		<DialogContent className="max-w-md">
			<DialogHeader>
				<DialogTitle>Edit Room</DialogTitle>
				<DialogDescription className="sr-only">Edit room details</DialogDescription>
			</DialogHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
					<FormField
						control={form.control}
						name="roomIdentifier"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Room Identifier</FormLabel>
								<FormControl><Input {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="roomType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Room Type</FormLabel>
								<FormControl><Input {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="roomPrice"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Room Price</FormLabel>
								<FormControl><Input type="number" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="roomFacilities"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Facilities (comma separated)</FormLabel>
								<FormControl><Input placeholder="WiFi, AC, TV" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Saving..." : "Save Changes"}
					</Button>
				</form>
			</Form>
		</DialogContent>
	);
}

// --- Add Room Dialog ---

const roomRowSchema = z.object({
	roomIdentifier: z.string().min(1, "Required"),
	roomType: z.string().min(1, "Required"),
	roomPrice: z.string().min(1, "Required"),
	roomFacilities: z.string().optional(),
});

const multiRoomSchema = z.object({
	rooms: z.array(roomRowSchema).min(1, "Add at least one room"),
});

type MultiRoomForm = z.infer<typeof multiRoomSchema>;

type RoomResult = { roomIdentifier: string; success: boolean; error?: string };
type SubmissionState = "idle" | "submitting" | "complete";

function MultiRoomFormTab({ onDone }: { onDone: () => void }) {
	const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
	const [progress, setProgress] = useState({ current: 0, total: 0 });
	const [results, setResults] = useState<RoomResult[]>([]);

	const form = useForm<MultiRoomForm>({
		resolver: zodResolver(multiRoomSchema),
		defaultValues: {
			rooms: [{ roomIdentifier: "", roomType: "", roomPrice: "", roomFacilities: "" }],
		},
	});

	const { fields, append, remove } = useFieldArray({ control: form.control, name: "rooms" });

	async function onSubmit(data: MultiRoomForm) {
		setSubmissionState("submitting");
		setProgress({ current: 0, total: data.rooms.length });
		const roomResults: RoomResult[] = [];

		for (let i = 0; i < data.rooms.length; i++) {
			const room = data.rooms[i];
			setProgress({ current: i + 1, total: data.rooms.length });
			try {
				const facilities = room.roomFacilities
					? room.roomFacilities.split(",").map((f) => f.trim()).filter(Boolean)
					: [];
				const res = await addNewRoomToHotelOwner({
					roomIdentifier: room.roomIdentifier,
					roomType: room.roomType,
					roomPrice: Number(room.roomPrice),
					roomFacility: facilities,
				});
				roomResults.push({
					roomIdentifier: room.roomIdentifier,
					success: res.success,
					error: res.success ? undefined : res.error,
				});
			} catch {
				roomResults.push({ roomIdentifier: room.roomIdentifier, success: false, error: "Unexpected error" });
			}
		}

		setResults(roomResults);
		setSubmissionState("complete");
	}

	function handleReset() {
		setSubmissionState("idle");
		setResults([]);
		setProgress({ current: 0, total: 0 });
		form.reset();
	}

	const successCount = results.filter((r) => r.success).length;
	const failCount = results.filter((r) => !r.success).length;

	if (submissionState === "submitting") {
		return <ListSubmitLoader current={progress.current} total={progress.total} label="room" />;
	}

	if (submissionState === "complete") {
		const bulkResult: BulkUploadResult = {
			summary: {
				totalRows: results.length,
				successCount,
				failedCount: failCount,
				processingTimeMs: 0,
				fileName: "",
				uploadedBy: "",
				uploadedAt: new Date().toISOString(),
			},
			results: results.map((r, i) => ({
				rowNumber: i + 1,
				success: r.success,
				itemIdentifier: r.roomIdentifier,
				errorMessage: r.error ?? null,
			})),
		};
		return (
			<BulkUploadResultDisplay
				result={bulkResult}
				entityName="rooms"
				onClose={onDone}
				onReset={handleReset}
				resetLabel="Add More Rooms"
			/>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
				<div className="py-3 flex items-center justify-between border-b">
					<span className="text-sm text-muted-foreground">
						{fields.length} room{fields.length !== 1 && "s"} added
					</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-1.5"
						onClick={() => append({ roomIdentifier: "", roomType: "", roomPrice: "", roomFacilities: "" })}
					>
						<PlusIcon className="size-3.5" />
						Add Room
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto min-h-0 max-h-[400px]">
					<div className="py-4 space-y-4">
						{fields.map((field, index) => (
							<div key={field.id} className="border rounded-xl p-4 space-y-3 bg-muted/30">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-muted-foreground">Room {index + 1}</span>
									{fields.length > 1 && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="h-8 px-2 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50"
											onClick={() => remove(index)}
										>
											<TrashIcon className="size-4 mr-1" />
											Remove
										</Button>
									)}
								</div>
								<div className="grid grid-cols-[1fr_1fr_auto] gap-3">
									<FormField
										control={form.control}
										name={`rooms.${index}.roomIdentifier`}
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs">Room Identifier</FormLabel>
												<FormControl>
													<Input placeholder="e.g Room 101" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name={`rooms.${index}.roomType`}
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs">Room Type</FormLabel>
												<FormControl>
													<Input placeholder="e.g Executive" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name={`rooms.${index}.roomPrice`}
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs">Price</FormLabel>
												<FormControl>
													<Input type="number" placeholder="e.g 50000" className="w-28" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name={`rooms.${index}.roomFacilities`}
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">Facilities (comma separated)</FormLabel>
											<FormControl>
												<Input placeholder="e.g WiFi, AC, TV, Mini Bar" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						))}
					</div>
				</div>
				<div className="pt-4 border-t mt-auto">
					<Button type="submit" className="w-full font-semibold" disabled={fields.length === 0}>
						Create {fields.length} Room{fields.length !== 1 && "s"}
					</Button>
				</div>
			</form>
		</Form>
	);
}

function AddRoomDialog({ hotelId, roomTypes }: { hotelId: string; roomTypes: any[] }) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="rounded-xl gap-1.5">
					<PlusIcon className="size-4" />
					Add Rooms
				</Button>
			</DialogTrigger>
			<DialogContent className="min-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
				<DialogHeader className="px-6 pt-6 pb-0">
					<DialogTitle className="text-lg">Add Rooms</DialogTitle>
					<DialogDescription className="sr-only">Add one or more rooms manually.</DialogDescription>
				</DialogHeader>
				<div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
					<MultiRoomFormTab onDone={() => setOpen(false)} />
				</div>
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
	setQueryState: (state: { roomStatus?: string | null; search?: string | null; roomType?: string | null }) => void;
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
		{ value: "CANCELLED", label: "Cancelled" },
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

// --- Export ---

function Export({ roomQuery }: { roomQuery: { roomStatus: string | null; search: string | null; roomType: string | null } }) {
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

	const onExport = async (data: ExportData) => {
		try {
			const filters = {
				search: roomQuery.search || undefined,
				roomType: roomQuery.roomType || undefined,
				status: roomQuery.roomStatus || undefined,
				format: data.export_type.toUpperCase() as "CSV" | "PDF" | "EXCEL",
			};

			const response = await exportRooms(filters);

			if (response.success && response.data) {
				const blob = new Blob([response.data as unknown as BlobPart], {
					type:
						data.export_type === "csv"
							? "text/csv"
							: data.export_type === "pdf"
								? "application/pdf"
								: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				});
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				const extension = data.export_type === "excel" ? "xlsx" : data.export_type;
				a.download = `rooms-export-${format(new Date(), "yyyy-MM-dd")}.${extension}`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success("Export downloaded successfully");
				setIsExportDialogOpen(false);
			} else {
				toast.error(response.error || "Failed to export rooms");
			}
		} catch {
			toast.error("An error occurred during export");
		}
	};

	return (
		<ExportDialog
			open={isExportDialogOpen}
			setOpenAction={setIsExportDialogOpen}
			onSubmitAction={onExport}
			showDates={false}
		/>
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
		roomStatus: parseAsString,
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

					<Export roomQuery={queryState} />

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
	const [showEdit, setShowEdit] = useState(false);
	const [showDeactivate, setShowDeactivate] = useState(false);

	const { mutate: activateRoom, isPending: isActivating } = useMutation({
		mutationFn: async () => {
			const res = await toggleRoomActiveOwner(row.id);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (data) => {
			toast.success(data?.message ?? "Room activated");
			revalidateRoute("/hotel-owner/rooms");
		},
		onError: (e) => {
			toast.error("Failed to activate room", { description: e.message });
		},
	});

	const isActive = row.active !== false;
	const isAvailable = row.checkInStatus === "AVAILABLE";

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon">
					<span className="sr-only">Open menu</span>
					<MoreVerticalIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
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

				<DropdownMenuSeparator />

				<Dialog open={showEdit} onOpenChange={setShowEdit}>
					<DialogTrigger asChild>
						<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
							Edit Room
						</DropdownMenuItem>
					</DialogTrigger>
					<EditRoomDialog room={row} open={showEdit} onOpenChange={setShowEdit} />
				</Dialog>

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
							toggleAction={toggleRoomActiveOwner}
							revalidatePath="/hotel-owner/rooms"
							onClose={() => setShowDeactivate(false)}
						/>
					</Dialog>
				)}

				{!isActive && (
					<DropdownMenuItem
						disabled={isActivating}
						onClick={() => activateRoom()}
						className="text-green-600 font-medium focus:!bg-green-50 focus:!text-green-600"
					>
						{isActivating ? "Activating..." : "Activate Room"}
					</DropdownMenuItem>
				)}
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
