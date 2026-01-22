"use client";

import { DataTablePagination } from "@/components/shared/pagination";
import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
	DialogHeader,
	DialogTitle,
	DialogFooter,
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
import { addSupplier } from "@/lib/inventory-actions";
import { parseAsString, useQueryState } from "nuqs";

const addSupplierFormSchema = z.object({
	name: z.string().nonempty(),
	email: z.email().nonempty(),
	phone: z.string().nonempty(),
	productIds: z.string().array(),
});

function AddSupplier({ products }: { products: InventoryProduct[] }) {
	const [open, setOpen] = useState(false);
	const form = useForm({
		resolver: zodResolver(addSupplierFormSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			productIds: [],
		},
	});

	const { mutateAsync } = useMutation({
		mutationKey: ["add-supplier"],
		mutationFn: async (data: z.infer<typeof addSupplierFormSchema>) => {
			const res = await addSupplier(data);
			if (!res.success) {
				throw new Error(res.error);
			}
		},
		onSuccess: () => {
			toast.success("Supplier added successfully");
			setOpen(false);
			form.reset();
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Unable to add supplier",
			);
		},
	});

	const [search, setSearch] = useQueryState(
		"product-list:search",
		parseAsString.withDefault(""),
	);

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
										<Loader2Icon />
										Please wait...
									</>
								) : (
									"Add Supplier"
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
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
		cell: (info) => info.getValue(),
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
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreVerticalIcon />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuItem>
							<EditIcon />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem variant="destructive">
							<TrashIcon />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	}),
];

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
