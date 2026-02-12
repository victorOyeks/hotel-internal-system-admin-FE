/** biome-ignore-all lint/suspicious/noExplicitAny: any is used for the table */
"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	PlusIcon,
	SearchIcon,
	XIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	Check,
	ChevronsUpDown,
	MoreHorizontal,
} from "lucide-react";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
	type Table as TableType,
} from "@tanstack/react-table";
import type {
	Pagination,
	StockAdjustmentResponse,
	InventoryProduct,
	InventoryLocationListResponse,
} from "@/lib/fetch";
import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { parseAsString, useQueryState } from "nuqs";
import {
	ExportDialog,
	type ExportData,
} from "@/components/shared/shared-dialogs";
import { exportStockAdjustments, approveStockAdjustment, postStockAdjustment } from "@/lib/inventory-actions";
import { toast } from "sonner";
import { TableFilter } from "@/components/shared/table-filter";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DataTablePagination } from "@/components/shared/pagination";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/shared/date-picker";
import { createStockAdjustment } from "@/lib/inventory-actions";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
	productId: z.string().min(1, "Product is required"),
	locationId: z.string().min(1, "Location is required"),
	adjustmentType: z.enum(["INCREASE", "DECREASE"]),
	reason: z.enum([
		"DAMAGED",
		"OTHER",
		"RETURNED_TO_SUPPLIER",
		"EXPIRED",
		"THEFT",
		"LOSS",
		"FOUND",
		"STOCK_TAKE_VARIANCE",
		"INTERNAL_USE",
		"PROMOTION",
		"TRANSFER",
	]),
	adjustmentQuantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
	unitCost: z.number().min(0).optional(),
	description: z.string().min(1, "Description is required"),
	notes: z.string().optional(),
	adjustmentDate: z.string().min(1, "Date is required"),
});

function ProductServerCombobox({
	value,
	onSelect,
	products,
}: {
	value: string;
	onSelect: (value: string) => void;
	products: InventoryProduct[];
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useQueryState("productSearch", parseAsString.withDefault("").withOptions({ throttleMs: 500 }));
	const [selectedName, setSelectedName] = useState("");

	useEffect(() => {
		if (value) {
			const product = products.find((p) => p.id === value);
			if (product) {
				setSelectedName(product.name);
			}
		}
	}, [value, products]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					<span className="truncate">
						{selectedName || "Select product..."}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search product..."
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>No product found.</CommandEmpty>
						<CommandGroup>
							{products.map((product) => (
								<CommandItem
									key={product.id}
									value={product.id}
									onSelect={() => {
										onSelect(product.id === value ? "" : product.id);
										setSelectedName(product.name);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === product.id ? "opacity-100" : "opacity-0"
										)}
									/>
									{product.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

function LocationServerCombobox({
	value,
	onSelect,
	locations,
}: {
	value: string;
	onSelect: (value: string) => void;
	locations: InventoryLocationListResponse[];
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useQueryState("locationSearch", parseAsString.withDefault("").withOptions({ throttleMs: 500 }));
	const [selectedName, setSelectedName] = useState("");

	useEffect(() => {
		if (value) {
			const location = locations.find((l) => l.id === value);
			if (location) {
				setSelectedName(location.locationName);
			}
		}
	}, [value, locations]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					<span className="truncate">
						{selectedName || "Select location..."}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search location..."
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>No location found.</CommandEmpty>
						<CommandGroup>
							{locations.map((location) => (
								<CommandItem
									key={location.id}
									value={location.id}
									onSelect={() => {
										onSelect(location.id === value ? "" : location.id);
										setSelectedName(location.locationName);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === location.id ? "opacity-100" : "opacity-0"
										)}
									/>
									{location.locationName}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

function CreateAdjustmentForm({
	onClose,
	products,
	locations,
}: {
	onClose: () => void;
	products: InventoryProduct[];
	locations: InventoryLocationListResponse[];
}) {
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			adjustmentType: "DECREASE",
			reason: "DAMAGED",
			adjustmentDate: new Date().toISOString(),
			adjustmentQuantity: 0,
			description: "",
		},
	});



	const { mutate, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof formSchema>) => {
			const res = await createStockAdjustment(data);
			if (!res.success) {
				throw new Error(res.error);
			}
			return res.data;
		},
		onSuccess: () => {
			toast.success("Stock adjustment created successfully");
			onClose();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create stock adjustment");
		},
	});

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		mutate(values);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="productId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Product</FormLabel>
								<FormControl>
									<ProductServerCombobox
										value={field.value}
										onSelect={field.onChange}
										products={products}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="locationId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Location</FormLabel>
								<FormControl>
									<LocationServerCombobox
										value={field.value}
										onSelect={field.onChange}
										locations={locations}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<FormField
						control={form.control}
						name="adjustmentType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="INCREASE">Increase</SelectItem>
										<SelectItem value="DECREASE">Decrease</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="adjustmentQuantity"
						render={() => (
							<FormItem>
								<FormLabel>Quantity</FormLabel>
								<FormControl>
									<Input type="number" step="0.01" {...form.register("adjustmentQuantity", { valueAsNumber: true })} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="reason"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Reason</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select reason" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="DAMAGED">Damaged</SelectItem>
										<SelectItem value="EXPIRED">Expired</SelectItem>
										<SelectItem value="THEFT">Theft</SelectItem>
										<SelectItem value="LOSS">Loss</SelectItem>
										<SelectItem value="FOUND">Found</SelectItem>
										<SelectItem value="OTHER">Other</SelectItem>
										<SelectItem value="RETURNED_TO_SUPPLIER">Returned to Supplier</SelectItem>
										<SelectItem value="STOCK_TAKE_VARIANCE">Stock Take Variance</SelectItem>
										<SelectItem value="INTERNAL_USE">Internal Use</SelectItem>
										<SelectItem value="PROMOTION">Promotion</SelectItem>
										<SelectItem value="TRANSFER">Transfer</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="adjustmentDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date</FormLabel>
								<FormControl>
									<DatePicker
										initialDate={field.value}
										onChange={(date) => {
											const current = new Date();
											const newDate = new Date(date);
											newDate.setHours(current.getHours(), current.getMinutes(), current.getSeconds());
											field.onChange(newDate.toISOString());
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="unitCost"
						render={() => (
							<FormItem>
								<FormLabel>Unit Cost (Optional)</FormLabel>
								<FormControl>
									<Input type="number" step="0.01" {...form.register("unitCost", { valueAsNumber: true })} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea placeholder="Enter description..." {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Notes (Optional)</FormLabel>
							<FormControl>
								<Textarea placeholder="Enter notes..." {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Create Adjustment
					</Button>
				</div>
			</form>
		</Form >
	);
}

// Mocking StockAdjustmentStatistics if not in fetch
export type StockAdjustmentStatsMock = {
	pendingApprovalCount: number;
	pendingApprovalValue: number;
	approvedCount: number;
	postedCount: number;
	totalAdjustments: number;
};

// --- Mock Data moved to parent in next step, but need interfaces here ---

function StockAdjustmentActions({ adjustment }: { adjustment: StockAdjustmentResponse }) {
	const { mutate: approve, isPending: isApproving } = useMutation({
		mutationFn: async () => {
			const res = await approveStockAdjustment(adjustment.id);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => toast.success("Stock adjustment approved"),
		onError: (err) => toast.error(err.message),
	});

	const { mutate: post, isPending: isPosting } = useMutation({
		mutationFn: async () => {
			const res = await postStockAdjustment(adjustment.id);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => toast.success("Stock adjustment posted"),
		onError: (err) => toast.error(err.message),
	});

	if (adjustment.posted || adjustment.cancelled) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Actions</DropdownMenuLabel>
				{adjustment.requiresApproval && !adjustment.approved && (
					<DropdownMenuItem onClick={() => approve()} disabled={isApproving}>
						{isApproving ? "Approving..." : "Approve"}
					</DropdownMenuItem>
				)}
				{(!adjustment.requiresApproval || adjustment.approved) && !adjustment.posted && (
					<DropdownMenuItem onClick={() => post()} disabled={isPosting}>
						{isPosting ? "Posting..." : "Post"}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const columnHelper = createColumnHelper<StockAdjustmentResponse>();

const columns = [
	columnHelper.accessor("adjustmentNumber", {
		header: "Adjustment #",
		cell: (info) => <span className="font-medium">{info.getValue()}</span>,
	}),
	columnHelper.accessor("adjustmentDate", {
		header: "Date",
		cell: (info) => format(new Date(info.getValue()), "MMM dd, yyyy"),
	}),
	columnHelper.accessor("productName", {
		header: "Product",
		cell: (info) => (
			<div>
				<p className="font-medium">{info.getValue()}</p>
				<p className="text-xs text-muted-foreground">
					{info.row.original.productSku}
				</p>
			</div>
		),
	}),
	columnHelper.accessor("locationName", {
		header: "Location",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("reason", {
		header: "Reason",
		cell: (info) => (
			<Badge variant="outline">{info.getValue().replace(/_/g, " ")}</Badge>
		),
	}),
	columnHelper.accessor("adjustmentType", {
		header: "Type",
		cell: (info) =>
			info.getValue() === "INCREASE" ? (
				<Badge
					variant="outline"
					className="bg-green-50 text-green-700 border-green-200"
				>
					<TrendingUpIcon className="w-3 h-3 mr-1" />
					Increase
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="bg-red-50 text-red-700 border-red-200"
				>
					<TrendingDownIcon className="w-3 h-3 mr-1" />
					Decrease
				</Badge>
			),
	}),
	columnHelper.accessor("adjustmentQuantity", {
		header: "Qty",
		cell: (info) => (
			<span className="font-medium">{info.getValue()}</span>
		),
		meta: {
			align: "right",
		}
	}),
	columnHelper.accessor("totalCostImpact", {
		header: "Cost Impact",
		cell: (info) => formatCurrency(Math.abs(info.getValue())),
		meta: {
			align: "right",
		}
	}),
	columnHelper.display({
		id: "status",
		header: "Status",
		cell: (info) => {
			const adj = info.row.original;
			let status = "PENDING";
			let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

			if (adj.posted) {
				status = "POSTED";
				variant = "default";
			} else if (adj.cancelled) {
				status = "CANCELLED";
				variant = "destructive"; // or gray
			} else if (adj.approved) {
				status = "APPROVED";
				variant = "secondary";
			} else if (adj.requiresApproval && !adj.approved) {
				status = "PENDING APPROVAL";
				variant = "outline"; // or yellow
			}

			return (
				<Badge
					variant={variant}
				>
					{status}
				</Badge>
			);
		},
	}),
	columnHelper.display({
		id: "actions",
		cell: (info) => <StockAdjustmentActions adjustment={info.row.original} />,
	}),
];

function _StatCard({
	icon,
	bgClass,
	title,
	value,
	subtitle,
}: {
	icon: React.ReactNode;
	bgClass: string;
	title: string;
	value: string | number;
	subtitle?: string;
}) {
	return (
		<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
			<div
				className={cn`size-10 aspect-square ${bgClass} rounded-full flex items-center justify-center`}
			>
				{icon}
			</div>
			<div className="flex flex-col flex-1">
				<h3 className="text-xs text-muted-foreground">{title}</h3>
				<p className="text-xl font-semibold leading-tight">
					{value}{" "}
					{subtitle && (
						<span className="text-xs text-muted-foreground font-light">
							{subtitle}
						</span>
					)}
				</p>
			</div>
		</div>
	);
}

export function StockAdjustmentPage({
	adjustments,
	// stats,
	paginationMeta,
	products,
	locations,
}: {
	adjustments: StockAdjustmentResponse[];
	stats: StockAdjustmentStatsMock;
	paginationMeta: Pagination;
	products: InventoryProduct[];
	locations: InventoryLocationListResponse[];
}) {
	const [pagination, setPagination] = usePaginationSearchParams();
	const table = useReactTable({
		data: adjustments,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		state: {
			pagination,
		},
	});

	const [isCreateOpen, setIsCreateOpen] = useState(false);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">
						Stock Adjustments
					</h1>
					<p className="text-muted-foreground mt-1">
						Manage stock corrections for damages, theft, and variances
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon />
							Create Adjustment
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-4xl">
						<DialogHeader>
							<DialogTitle>Create Stock Adjustment</DialogTitle>
						</DialogHeader>
						<CreateAdjustmentForm
							onClose={() => setIsCreateOpen(false)}
							products={products}
							locations={locations}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			{/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
				<StatCard
					icon={<ClockIcon className="text-orange-600" />}
					bgClass="bg-orange-50"
					title="Pending Approval"
					value={stats.pendingApprovalCount}
					subtitle={`${formatCurrency(stats.pendingApprovalValue)} impact`}
				/>
				<StatCard
					icon={<CheckCircleIcon className="text-green-600" />}
					bgClass="bg-green-50"
					title="Approved"
					value={stats.approvedCount}
					subtitle="Ready to post"
				/>
				<StatCard
					icon={<FileTextIcon className="text-blue-600" />}
					bgClass="bg-blue-50"
					title="Posted"
					value={stats.postedCount}
					subtitle="Stock updated"
				/>
				<StatCard
					icon={<AlertCircleIcon className="text-purple-600" />}
					bgClass="bg-purple-50"
					title="Total Adjustments"
					value={stats.totalAdjustments}
					subtitle="All time"
				/>
			</div> */}

			{/* Toolbar */}
			<StockAdjustmentToolbar table={table} />

			{/* Table */}
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
										<TableCell key={cell.id} className={cn("text-gray-600", (cell.column.columnDef.meta as any)?.align === "right" && "text-right")}>
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
		</div>
	);
}

// Toolbar Component
function StockAdjustmentToolbar({
	table,
}: {
	table: TableType<StockAdjustmentResponse>;
}) {
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const [search, setSearch] = useQueryState("search", {
		defaultValue: "",
		throttleMs: 500,
	});
	const [status, setStatus] = useQueryState("status", { defaultValue: "all" });
	const [type, setType] = useQueryState("type", { defaultValue: "all" });

	const [openFilter, setOpenFilter] = useState(false);

	const activeFilterCount = [status !== "all", type !== "all"].filter(Boolean).length;

	const onExport = async (data: ExportData) => {
		try {
			// Map filters
			const filters = {
				adjustmentType: type !== "all" ? type : undefined,
				approved: status === "APPROVED" ? true : undefined,
				posted: status === "POSTED" ? true : undefined,
				startDate: data.from_date?.toISOString(),
				endDate: data.to_date?.toISOString(),
				format: data.export_type.toUpperCase() as "CSV" | "PDF" | "EXCEL",
			};

			const response = await exportStockAdjustments(filters);

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
				const extension =
					data.export_type === "excel" ? "xlsx" : data.export_type;
				a.download = `stock-adjustments-${format(new Date(), "yyyy-MM-dd")}.${extension}`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success("Export downloaded successfully");
				setIsExportDialogOpen(false);
			} else {
				toast.error(response.error || "Failed to export adjustments");
			}
		} catch {
			toast.error("An error occurred during export");
		}
	};

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div>
				<p className="pl-2">All Adjustments ({table.getRowCount()})</p>
			</div>

			<div className="flex items-center gap-x-2">
				<div className="relative">
					<input
						type="text"
						placeholder="Search adjustments..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
				</div>

				<div className="flex items-center gap-2">
					<TableFilter open={openFilter} setOpen={setOpenFilter} count={activeFilterCount}>
						<div className="space-y-4 w-[200px]">
							<div className="space-y-2">
								<Label>Status</Label>
								<Select value={status} onValueChange={setStatus}>
									<SelectTrigger>
										<SelectValue placeholder="All Statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										<SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
										<SelectItem value="APPROVED">Approved</SelectItem>
										<SelectItem value="POSTED">Posted</SelectItem>
										<SelectItem value="REJECTED">Rejected</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Type</Label>
								<Select value={type} onValueChange={setType}>
									<SelectTrigger>
										<SelectValue placeholder="All Types" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Types</SelectItem>
										<SelectItem value="INCREASE">Increase</SelectItem>
										<SelectItem value="DECREASE">Decrease</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{(status !== "all" || type !== "all") && (
								<Button
									variant="ghost"
									className="w-full justify-start text-muted-foreground"
									onClick={() => {
										setStatus("all");
										setType("all");
									}}
								>
									<XIcon className="mr-2 h-4 w-4" />
									Clear Filters
								</Button>
							)}
						</div>
					</TableFilter>
				</div>

				<ExportDialog
					open={isExportDialogOpen}
					setOpenAction={setIsExportDialogOpen}
					onSubmitAction={onExport}
				/>
			</div>
		</div>
	);
}
