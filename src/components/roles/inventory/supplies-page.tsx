"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { DataTablePagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogTrigger,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogContent,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
	TableFooter,
} from "@/components/ui/table";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	MultiSelect,
	MultiSelectContent,
	MultiSelectItem,
	MultiSelectTrigger,
	MultiSelectValue,
} from "@/components/ui/multi-select";
import { toast } from "sonner";
import type {
	InventoryProduct,
	InventorySuppliers,
	Pagination,
} from "@/lib/fetch";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useSetAtom } from "jotai";
import {
	EditIcon,
	Loader2Icon,
	MoreVerticalIcon,
	PlusIcon,
	SearchIcon,
	TrashIcon,
	UploadIcon,
	DownloadIcon,
	FileSpreadsheetIcon,
	XIcon,
	CheckCircle2Icon,
	XCircleIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { BulkUploadResult } from "@/lib/bulk-upload-types";
import { BulkUploadResultDisplay } from "@/components/shared/bulk-upload-result";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import {
	bulkUploadSuppliers,
	deleteSupplier,
	editSupplier,
	exportSuppliers,
} from "@/lib/inventory-actions";
import { parseAsString, useQueryState } from "nuqs";
import { revalidateRoute } from "@/lib/actions";
import { type ExportData, ExportDialog } from "@/components/shared/shared-dialogs";
import { format } from "date-fns";


const addSupplierFormSchema = z.object({
	name: z.string().nonempty(),
	email: z.email().nonempty(),
	phone: z.string().nonempty(),
	productIds: z.string().array(),
});

// --- File Upload ---

function SupplierFileUploadTab({ onDone }: { onDone: () => void }) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadState, setUploadState] = useState<"idle" | "uploading" | "complete">("idle");
	const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);

	function downloadExcelTemplate() {
		import("xlsx").then((XLSX) => {
			const data = [
				["Name", "Email", "Phone"],
				["ABC Suppliers", "abc@email.com", "08012345678"],
				["XYZ Distributors", "xyz@email.com", "08098765432"],
				["Global Supplies Ltd", "info@globalsupplies.com", "07011223344"],
			];
			const ws = XLSX.utils.aoa_to_sheet(data);
			ws["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 16 }];
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
			XLSX.writeFile(wb, "supplier_upload_template.xlsx");
		});
	}

	async function handleUpload() {
		if (!selectedFile) return;

		setUploadState("uploading");

		const formData = new FormData();
		formData.append("file", selectedFile);

		const res = await bulkUploadSuppliers(formData);

		if (!res.success) {
			toast.error("Upload failed", { description: res.error });
			setUploadState("idle");
			return;
		}

		setUploadResult(res.data ?? null);
		setUploadState("complete");
		revalidateRoute("/dashboard/supplies");
	}

	function handleReset() {
		setSelectedFile(null);
		setUploadState("idle");
		setUploadResult(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	if (uploadState === "uploading") {
		return (
			<div className="flex flex-col items-center justify-center gap-6 py-12">
				<Loader2Icon className="size-12 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Uploading and processing file...</p>
			</div>
		);
	}

	if (uploadState === "complete" && uploadResult) {
		return (
			<div className="py-4">
				<BulkUploadResultDisplay
					result={uploadResult}
					entityName="suppliers"
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
					Download the template, fill in your data, then upload.
				</p>
				<Button variant="outline" size="sm" className="gap-1.5 shrink-0 ml-3" onClick={downloadExcelTemplate}>
					<DownloadIcon className="size-3.5" />
					Download Template
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
				Upload & Add Suppliers
			</Button>
		</div>
	);
}

// --- Add Supplier Dialog ---

function AddSupplierDialog() {
	const [open, setOpen] = useState(false);

	function handleDone() {
		setOpen(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant={"secondary"}
					className="rounded-md md:rounded-xl transition-[width,contents] will-change-contents duration-300"
				>
					<PlusIcon />
					<span className="hidden md:inline">Add Supplier</span>
				</Button>
			</DialogTrigger>

			<DialogContent className="min-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
				<DialogHeader className="px-6 pt-6 pb-0">
					<DialogTitle className="text-lg">Add Suppliers</DialogTitle>
				</DialogHeader>

				<div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
					<SupplierFileUploadTab onDone={handleDone} />
				</div>
			</DialogContent>
		</Dialog>
	);
}

function AddSupplierForm({
	initialData,
	onSuccess,
	products = []
}: {
	initialData?: InventorySuppliers;
	onSuccess: () => void;
	products?: InventoryProduct[];
}) {
	// If we are in edit mode, products might come from the parent or need to be fetched.
	// For simplicity, we assume products are passed or available. 
	// Since Edit is called from the table row, we might not have the full list of products handy unless passed down.
	// But `productsList` is available in `SuppliesPage`. 
	// We might need to context or pass it down.
	// However, for now, let's assume `products` prop or rely on what we have. 

	// Actually, `SuppliesActions` is outside `AddSupplier` scope where `products` is known.
	// We need to pass `products` to `SuppliesActions` or fetch them.
	// Let's check `SuppliesPage` - it has `productsList`.
	// We should pass `productsList` to `SuppliesTable` then to `SuppliesActions`.

	const form = useForm({
		resolver: zodResolver(addSupplierFormSchema),
		defaultValues: {
			name: initialData?.name || "",
			email: initialData?.email || "",
			phone: initialData?.phone || "",
			productIds: initialData?.products?.map((p) => p.id) || [],
		},
	});

	const { mutateAsync } = useMutation({
		mutationKey: ["add-supplier"],
		mutationFn: async (data: z.infer<typeof addSupplierFormSchema>) => {
			if (initialData) {
				const res = await editSupplier(initialData.id, data);
				if (!res.success) throw new Error(res.error);
			} else {
				const res = await addSupplier(data);
				if (!res.success) throw new Error(res.error);
			}
		},
		onSuccess: () => {
			toast.success(initialData ? "Supplier updated" : "Supplier added");
			revalidateRoute("/dashboard/supplies")
			onSuccess();
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Unable to save supplier",
			);
		},
	});

	const [search, setSearch] = useQueryState(
		"product-list:search",
		parseAsString.withDefault(""),
	);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((data) => mutateAsync(data))}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Supplier Name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									placeholder="supplier@example.com"
									type="email"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Phone</FormLabel>
							<FormControl>
								<Input placeholder="+1234567890" type="tel" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="productIds"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Products</FormLabel>
							<FormControl>
								<MultiSelect
									values={field.value}
									onValuesChange={field.onChange}
								>
									<MultiSelectTrigger className="w-full">
										<MultiSelectValue placeholder="Select products" />
									</MultiSelectTrigger>
									<MultiSelectContent
										shouldFilter={false}
										searchValue={search}
										onSearchValueChange={setSearch}
										search={{
											emptyMessage: "No products found.",
											placeholder: "Search products",
										}}
									>
										{products.map((product) => (
											<MultiSelectItem key={product.id} value={product.id}>
												{product.name}
											</MultiSelectItem>
										))}
									</MultiSelectContent>
								</MultiSelect>
							</FormControl>
							{/* <p className="text-xs text-muted-foreground">Select products supplied by this vendor</p> */}
							<FormMessage />
						</FormItem>
					)}
				/>
				<DialogFooter>
					<Button
						type="submit"
						disabled={
							!form.formState.isValid || form.formState.isSubmitting
						}
					>
						{form.formState.isSubmitting ? (
							<>
								<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								Please wait...
							</>
						) : (
							initialData ? "Update Supplier" : "Add Supplier"
						)}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}

function SuppliersListToolbar() {
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [search, setSearch] = useQueryState(
		"search",
		parseAsString.withDefault(""),
	);

	const handleExport = async (data: ExportData) => {
		try {
			const filters = {
				search: search || undefined,
				format: data.export_type.toUpperCase() as "CSV" | "PDF" | "EXCEL",
			};

			const response = await exportSuppliers(filters);

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
				a.download = `suppliers-${format(new Date(), "yyyy-MM-dd")}.${extension}`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success("Export downloaded successfully");
				setExportDialogOpen(false);
			} else {
				toast.error(response.error || "Failed to export suppliers");
			}
		} catch {
			toast.error("An error occurred during export");
		}
	};

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div className="flex items-center gap-x-2">
				<div className="relative">
					<input
						type="text"
						placeholder="Search"
						value={search ?? ""}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>
			</div>

			<div className="flex items-center gap-x-2 ">
				<AddSupplierDialog />

				<ExportDialog
					open={exportDialogOpen}
					setOpenAction={setExportDialogOpen}
					onSubmitAction={handleExport}
				/>
			</div>
		</div>
	);
}

const suppliesPageColumnHelper = createColumnHelper<InventorySuppliers>();

const suppliesPageColumns = [
	suppliesPageColumnHelper.accessor("name", {
		id: "name",
		header: "Name",
		cell: (info) => {
			const row = info.row.original;
			return (
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="link">{info.getValue()}</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Supplier Details</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h4 className="text-sm font-medium text-muted-foreground">Name</h4>
									<p>{row.name}</p>
								</div>
								<div>
									<h4 className="text-sm font-medium text-muted-foreground">Email</h4>
									<p>{row.email}</p>
								</div>
								<div>
									<h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
									<p>{row.phone}</p>
								</div>
							</div>
							<div>
								<h4 className="text-sm font-medium text-muted-foreground">Products</h4>
								<div className="flex flex-wrap gap-2 mt-1">
									{row.products.length > 0 ? (
										row.products.map((p) => (
											<span
												key={p.id}
												className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs"
											>
												{p.name}
											</span>
										))
									) : (
										<span className="text-muted-foreground debug-text-sm">No products</span>
									)}
								</div>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)
		},
	}),
	suppliesPageColumnHelper.accessor("email", {
		id: "email",
		header: "Email",
		cell: (info) => info.getValue(),
	}),
	suppliesPageColumnHelper.accessor("phone", {
		id: "phone",
		header: "Phone Number",
		cell: (info) => info.getValue(),
	}),
	suppliesPageColumnHelper.accessor("products", {
		id: "products",
		header: "Associated products",
		cell: (info) => {
			const items = info.getValue();
			return items ? (
				<span className="text-wrap">
					{items.map((item) => item.name).join(", ")}
				</span>
			) : (
				"N/A"
			);
		},
	}),
	suppliesPageColumnHelper.display({
		id: "actions",
		cell: ({ row }) => {
			return <SuppliesActions row={row.original} />;
		},
	}),
];

function SuppliesActions({
	row,
}: {
	row: InventorySuppliers;
}) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);

	const { mutate: deleteMutate, isPending } = useMutation({
		mutationKey: ["delete-supplier"],
		mutationFn: async (supplierId: string) => {
			const res = await deleteSupplier(supplierId);
			if (!res.success) {
				throw new Error(res.error);
			}

			return res;
		},
		onSuccess: async (res) => {
			await revalidateRoute("/dashboard/supplies");
			toast.success(res.data?.message);
			setShowDeleteDialog(false);
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	return (
		<>
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the supplier.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutate(row.id)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={isPending}
						>
							{isPending ? (
								<>
									<Loader2Icon className="animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<TrashIcon />
									Delete
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Supplier</DialogTitle>
					</DialogHeader>
					<AddSupplierForm
						initialData={row}
						onSuccess={() => setShowEditDialog(false)}
					/>
				</DialogContent>
			</Dialog>

			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon">
						<span className="sr-only">Open menu</span>
						<MoreVerticalIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => setShowEditDialog(true)}>
						<EditIcon />
						Edit
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={() => setShowDeleteDialog(true)}
						className="text-red-600"
					>
						<TrashIcon />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}

function SuppliesTable({
	data,
	paginationMeta,
}: {
	data: InventorySuppliers[];
	paginationMeta: Pagination;
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();
	const table = useReactTable({
		data,
		columns: suppliesPageColumns,
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
							<TableCell
								colSpan={suppliesPageColumns.length}
								className="h-24 text-center"
							>
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={suppliesPageColumns.length}>
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

export function SuppliesPage({
	breadcrumb,
	data,
	paginationMeta,
	productsList,
}: {
	breadcrumb: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
	productsList: InventoryProduct[];
	data: InventorySuppliers[];
	paginationMeta: Pagination;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);

	useEffect(() => {
		setBreadcrumb(breadcrumb);
		return () => setBreadcrumb(null);
	}, [breadcrumb, setBreadcrumb]);
	return (
		<div className="space-y-4 px-4 py-4">
			<SuppliersListToolbar />

			<SuppliesTable data={data} paginationMeta={paginationMeta} />
		</div>
	);
}
