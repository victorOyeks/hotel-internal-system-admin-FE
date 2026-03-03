"use client";

import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { atom, useAtom, useSetAtom } from "jotai";
import {
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	RotateCcwIcon,
	XIcon,
	TrashIcon,
	UploadIcon,
	DownloadIcon,
	FileSpreadsheetIcon,
	MoreVertical,
	PencilIcon,
	PowerIcon,
} from "lucide-react";
import { useLayoutEffect, useState, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type Table as TableType,
	flexRender,
	useReactTable,
} from "@tanstack/react-table";
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
import { TableFilter } from "@/components/shared/table-filter";
import type { Pagination, RoomDetails } from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import z from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SuccessDialog, ExportDialog, type ExportData } from "@/components/shared/shared-dialogs";
import { addNewRoomToHotel, bulkUploadRooms, updateRoom, toggleRoomActive, exportRooms } from "@/lib/manager-actions";
import { format } from "date-fns";
import { revalidateRoute } from "@/lib/actions";
import { BulkUploadResultDisplay } from "@/components/shared/bulk-upload-result";
import { ListSubmitLoader } from "@/components/shared/list-submit-loader";
import type { BulkUploadResult } from "@/lib/bulk-upload-types";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { RoomDetailsContent } from "@/components/roles/front-desk/room-details-content";
import { GuestDetailsContent } from "@/components/roles/front-desk/guest-details-content";
import { DeactivateRoomDialog } from "@/components/shared/deactivate-room-dialog";

const successDialogAtom = atom({
	show: false,
	message: "",
});

// --- Multi-room form schema ---

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

type RoomResult = {
	roomIdentifier: string;
	success: boolean;
	error?: string;
};

type SubmissionState = "idle" | "submitting" | "complete";

// --- Tab 1: Multi-Room Form ---

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

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "rooms",
	});

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

				const res = await addNewRoomToHotel({
					roomIdentifier: room.roomIdentifier,
					roomType: room.roomType,
					roomPrice: Number(room.roomPrice),
					roomFacility: facilities,
					roomStatus: "AVAILABLE",
				});

				if (!res.success) {
					roomResults.push({
						roomIdentifier: room.roomIdentifier,
						success: false,
						error: res.error,
					});
					continue;
				}

				roomResults.push({
					roomIdentifier: room.roomIdentifier,
					success: true,
				});
			} catch {
				roomResults.push({
					roomIdentifier: room.roomIdentifier,
					success: false,
					error: "Unexpected error occurred",
				});
			}
		}

		setResults(roomResults);
		setSubmissionState("complete");
		revalidateRoute("/manager/rooms");
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
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col flex-1 min-h-0"
			>
				<div className="py-3 flex items-center justify-between border-b">
					<span className="text-sm text-muted-foreground">
						{fields.length} room{fields.length !== 1 && "s"} added
					</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-1.5"
						onClick={() =>
							append({ roomIdentifier: "", roomType: "", roomPrice: "", roomFacilities: "" })
						}
					>
						<PlusIcon className="size-3.5" />
						Add Room
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto min-h-0 max-h-[400px]">
					<div className="py-4 space-y-4">
						{fields.map((field, index) => (
							<div
								key={field.id}
								className="border rounded-xl p-4 space-y-3 bg-muted/30 relative"
							>
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-muted-foreground">
										Room {index + 1}
									</span>
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
					<Button
						type="submit"
						className="w-full font-semibold"
						disabled={fields.length === 0}
					>
						Create {fields.length} Room{fields.length !== 1 && "s"}
					</Button>
				</div>
			</form>
		</Form>
	);
}

// --- Tab 2: File Upload ---

function FileUploadTab({ onDone }: { onDone: () => void }) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadState, setUploadState] = useState<"idle" | "uploading" | "complete">("idle");
	const [uploadResult, setUploadResult] = useState<{
		summary: { totalRows: number; successCount: number; failedCount: number };
		results: Array<{ rowNumber: number; success: boolean; roomIdentifier: string | null; errorMessage: string | null }>;
	} | null>(null);

	function downloadExcelTemplate() {
		import("xlsx").then((XLSX) => {
			const data = [
				["Room Identifier", "Room Type", "Room Price", "Room Facilities"],
				["Room 101", "Executive", 50000, "WiFi, AC, TV"],
				["Room 102", "Standard", 30000, "WiFi, AC"],
				["Room 201", "Deluxe", 75000, "WiFi, AC, TV, Mini Bar, Balcony"],
			];
			const ws = XLSX.utils.aoa_to_sheet(data);
			ws["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 36 }];
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Rooms");
			XLSX.writeFile(wb, "room_upload_template.xlsx");
		});
	}

	async function handleUpload() {
		if (!selectedFile) return;

		setUploadState("uploading");

		const formData = new FormData();
		formData.append("file", selectedFile);

		const res = await bulkUploadRooms(formData);

		if (!res.success) {
			toast.error("Upload failed", { description: res.error });
			setUploadState("idle");
			return;
		}

		setUploadResult(res.data);
		setUploadState("complete");
		revalidateRoute("/manager/rooms");
	}

	function handleReset() {
		setSelectedFile(null);
		setUploadState("idle");
		setUploadResult(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	if (uploadState === "uploading") {
		return (
			<div className="flex flex-col items-center justify-center gap-8 py-10">
				{/* Spinning ring with file icon */}
				<div className="relative size-24">
					<svg className="absolute inset-0 size-24 animate-spin" style={{ animationDuration: "1.2s" }} viewBox="0 0 96 96" fill="none">
						<circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="5" className="text-muted-foreground/10" />
						<path d="M 48 8 A 40 40 0 0 1 88 48" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-primary" />
					</svg>
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
							<FileSpreadsheetIcon className="size-7 text-primary" />
						</div>
					</div>
				</div>

				{/* Title + filename */}
				<div className="text-center space-y-1">
					<p className="font-semibold text-foreground">Processing your file</p>
					{selectedFile && (
						<p className="text-xs text-muted-foreground max-w-[200px] truncate mx-auto">
							{selectedFile.name}
						</p>
					)}
				</div>

				{/* Staggered pulsing steps */}
				<div className="flex flex-col gap-3 w-full max-w-[200px]">
					{["Reading file data", "Validating rooms", "Creating records"].map((step, i) => (
						<div key={step} className="flex items-center gap-3">
							<span
								className="size-2 shrink-0 rounded-full bg-primary animate-pulse"
								style={{ animationDelay: `${i * 350}ms` }}
							/>
							<span className="text-xs text-muted-foreground">{step}</span>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (uploadState === "complete" && uploadResult) {
		return (
			<div className="py-4">
				<BulkUploadResultDisplay
					result={{
						summary: {
							...uploadResult.summary,
							processingTimeMs: 0,
							fileName: selectedFile?.name ?? "",
							uploadedBy: "",
							uploadedAt: "",
						},
						results: uploadResult.results.map((r) => ({
							rowNumber: r.rowNumber,
							success: r.success,
							itemIdentifier: r.roomIdentifier,
							errorMessage: r.errorMessage,
						})),
					}}
					entityName="rooms"
					onClose={onDone}
					onReset={handleReset}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-4 py-4">
			<div className="flex items-center justify-between border rounded-lg px-3 py-2.5 bg-muted/30">
				<p className="text-xs text-muted-foreground">
					Need a template? Download it, fill in your data, then upload.
				</p>
				<Button variant="outline" size="sm" className="gap-1.5 shrink-0 ml-3" onClick={downloadExcelTemplate}>
					<DownloadIcon className="size-3.5" />
					Template
				</Button>
			</div>

			<div>
				<input
					ref={fileInputRef}
					type="file"
					accept=".csv,.xlsx,.xls"
					className="hidden"
					onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
				/>

				{selectedFile ? (
					<div
						className="flex flex-col items-center justify-center gap-2 border rounded-lg h-30 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
						onClick={() => fileInputRef.current?.click()}
					>
						<div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border shadow-sm">
							<FileSpreadsheetIcon className="size-4 text-primary" />
							<span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
							<button
								type="button"
								className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
								onClick={(e) => {
									e.stopPropagation();
									setSelectedFile(null);
									if (fileInputRef.current) fileInputRef.current.value = "";
								}}
							>
								<XIcon className="size-3.5" />
							</button>
						</div>
						<span className="text-[11px] text-muted-foreground">Click to change file</span>
					</div>
				) : (
					<button
						type="button"
						className="w-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg h-30 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
						onClick={() => fileInputRef.current?.click()}
					>
						<UploadIcon className="size-5" />
						<span className="text-sm font-medium">Click to select a file</span>
						<span className="text-[11px]">.csv, .xlsx, .xls</span>
					</button>
				)}
			</div>

			<Button
				className="w-full font-semibold"
				disabled={!selectedFile}
				onClick={handleUpload}
			>
				<UploadIcon className="size-4 mr-2" />
				Upload & Create Rooms
			</Button>
		</div>
	);
}

// --- Add Rooms Dialog ---

function AddNewRoomDialog() {
	const [open, setOpen] = useState(false);

	function handleDone() {
		setOpen(false);
	}

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
					<DialogDescription className="sr-only">
						Add rooms manually or upload a file.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="manual" className="flex-1 flex flex-col min-h-0 px-6 pb-6">
					<TabsList className="w-full">
						<TabsTrigger value="manual" className="flex-1">Add Rooms</TabsTrigger>
						<TabsTrigger value="upload" className="flex-1">Upload File</TabsTrigger>
					</TabsList>

					<TabsContent value="manual" className="flex-1 flex flex-col min-h-0">
						<MultiRoomFormTab onDone={handleDone} />
					</TabsContent>

					<TabsContent value="upload" className="flex-1 flex flex-col min-h-0">
						<FileUploadTab onDone={handleDone} />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

// --- Filter ---

function RoomsFilter({
	rooms,
}: {
	rooms: RoomDetails[];
}) {
	const [queryState, setQueryState] = useQueryStates({
		roomStatus: parseAsString,
		search: parseAsString,
		roomType: parseAsString,
	});

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
	isDeactivatedView,
}: {
	table: TableType<RoomDetails>;
	rooms: RoomDetails[];
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
						<RoomsFilter rooms={rooms} />
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

				<AddNewRoomDialog />
			</div>
		</div>
	);
}

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
	room: RoomDetails;
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

			const res = await updateRoom(room.id, {
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
			revalidateRoute("/manager/rooms");
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
								<FormControl>
									<Input {...field} />
								</FormControl>
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
								<FormControl>
									<Input {...field} />
								</FormControl>
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
								<FormControl>
									<Input type="number" {...field} />
								</FormControl>
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
								<FormControl>
									<Input placeholder="e.g WiFi, AC, TV" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit" className="w-full font-semibold" disabled={isPending}>
						{isPending ? (
							<>
								<Loader2Icon className="animate-spin" />
								<span>Saving...</span>
							</>
						) : (
							"Save Changes"
						)}
					</Button>
				</form>
			</Form>
		</DialogContent>
	);
}

// --- Room Table Actions ---

function RoomTableActions({ row }: { row: RoomDetails }) {
	const [showEdit, setShowEdit] = useState(false);
	const [showRoomDetails, setShowRoomDetails] = useState(false);
	const [showGuestDetails, setShowGuestDetails] = useState(false);
	const [showDeactivate, setShowDeactivate] = useState(false);

	const { mutate: activateRoom, isPending: isActivating } = useMutation({
		mutationFn: async () => {
			const res = await toggleRoomActive(row.id);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: (data) => {
			toast.success(data.message);
			revalidateRoute("/manager/rooms");
		},
		onError: (e) => {
			toast.error("Failed to activate room", { description: e.message });
		},
	});

	const isActive = row.active !== false;
	const isAvailable = row.checkInStatus === "AVAILABLE";
	const canActivate = !isActive;

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon">
					<span className="sr-only">Open menu</span>
					<MoreVertical />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
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
							toggleAction={toggleRoomActive}
							revalidatePath="/manager/rooms"
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
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// --- Columns ---

const columnHelper = createColumnHelper<RoomDetails>();

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
				{info.getValue()}
			</div>
		),
		filterFn: "equalsString",
	}),
	columnHelper.accessor("hotelName", {
		header: "Branch Name",
		cell: (info) => info.getValue(),
		filterFn: "includesString",
	}),
	columnHelper.accessor("checkInStatus", {
		header: "Room Status",
		cell: (info) => {
			const statusToVariant: Record<
				RoomDetails["checkInStatus"],
				BadgeVariant
			> = {
				AVAILABLE: "green",
				RESERVED: "yellow",
				BOOKED: "blue",
				CHECKED_IN: "blue",
				CHECKED_OUT: "secondary",
				BLOCKED: "gray",
				DIRTY: "red",
			};

			const status = info.getValue();
			const isActive = info.row.original.active !== false;
			const statusToLabel = status.replace(/_/g, " ").toLowerCase();
			return (
				<div className="flex items-center gap-1.5">
					<Badge className="capitalize" variant={statusToVariant[status]}>
						{statusToLabel}
					</Badge>
					{!isActive && (
						<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-red-50 text-red-600 border-red-200">
							Inactive
						</Badge>
					)}
				</div>
			);
		},
	}),
	columnHelper.accessor("roomFacility", {
		header: "Room Facilities",
		cell: (info) => {
			const facilities = info.getValue();
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

function RoomsListTable({ table }: { table: TableType<RoomDetails> }) {
	return (
		<div className="overflow-hidden rounded-md border bg-card">
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
							<TableRow key={row.id} className="hover:bg-gray-50">
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

export function ViewRoomsInHotelPage({
	breadcrumbs,
	rooms = [],
	paginationMeta,
	isDeactivatedView = false,
}: {
	breadcrumbs: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
	rooms: RoomDetails[];
	paginationMeta: Pagination;
	isDeactivatedView?: boolean;
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();

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

	const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);
	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useLayoutEffect(() => {
		setBreadcrumb(breadcrumbs);
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumbs]);

	return (
		<div className="space-y-6 px-2">
			<RoomListToolbar table={table} rooms={rooms} isDeactivatedView={isDeactivatedView} />
			<RoomsListTable table={table} />
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
