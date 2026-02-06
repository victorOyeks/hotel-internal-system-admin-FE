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
import { TableFilter } from "@/components/shared/table-filter";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import {
	addSupplier,
	deleteSupplier,
	editSupplier,
} from "@/lib/inventory-actions";
import { parseAsString, useQueryState } from "nuqs";
import { revalidateRoute } from "@/lib/actions";

const addSupplierFormSchema = z.object({
	name: z.string().nonempty(),
	email: z.email().nonempty(),
	phone: z.string().nonempty(),
	productIds: z.string().array(),
});

function AddSupplier({ products }: { products: InventoryProduct[] }) {
	const [open, setOpen] = useState(false);

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

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Supplier</DialogTitle>
				</DialogHeader>
				<AddSupplierForm onSuccess={() => setOpen(false)} products={products} />
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

function BookingsListToolbar({ products }: { products: InventoryProduct[] }) {
	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div className="flex items-center gap-x-2">
				<Button
					size="sm"
					variant="outline"
					data-active
					className="shadow-none text-xs hover:border-transparent rounded-full"
				>
					All Suppliers
				</Button>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search"
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-xl"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>
				<TableFilter></TableFilter>

				<AddSupplier products={products} />
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
						>
							Delete
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
			<BookingsListToolbar products={productsList} />

			<SuppliesTable data={data} paginationMeta={paginationMeta} />
		</div>
	);
}
