"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
	PlusIcon,
	PackageIcon,
	BarChart3Icon,
	CalendarIcon,
	MoreVerticalIcon,
	EditIcon,
	TrashIcon,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductsToolbar } from "./products";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ApiInputInventoryProduct,
	type InventoryProductStatistics,
	type Pagination,
	type InventoryProductResponse,
} from "@/lib/fetch";
import { DataTablePagination } from "@/components/shared/pagination";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { addProduct } from "@/lib/inventory-actions";

const categories = [
	{ value: "FOOD", label: "Food" },
	{ value: "BEVERAGE", label: "Beverage" },
	{ value: "SUPPLIES", label: "Supplies" },
	{ value: "EQUIPMENT", label: "Equipment" },
	{ value: "LINEN", label: "Linen" },
	{ value: "AMENITIES", label: "Amenities" },
];

function StatCard({
	icon,
	bgClass,
	title,
	value,
	subtitle,
}: {
	icon: React.ReactNode;
	bgClass: string;
	title: string;
	value: string;
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

const columnHelper = createColumnHelper<InventoryProductResponse>();

const columns = [
	columnHelper.accessor("sku", {
		header: "SKU",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("name", {
		header: "Product Name",
		cell: (info) => {
			const product = info.row.original;
			return (
				<Dialog>
					<DialogTrigger asChild>
						<div className="hover:cursor-pointer hover:underline">
							<p className="font-medium">{product.name}</p>
							<p className="text-xs text-muted-foreground line-clamp-1">
								{product.description}
							</p>
						</div>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>{product.name}</DialogTitle>
							<DialogDescription>
								Product Details and Specifications
							</DialogDescription>
						</DialogHeader>
						<ProductDetailsView product={product} />
					</DialogContent>
				</Dialog>
			);
		},
	}),
	columnHelper.accessor("category", {
		header: "Category",
		cell: (info) => {
			const category = info.getValue().replaceAll("_", " ").toLocaleLowerCase();
			return (
				<Badge variant={"outline"} className="font-medium capitalize">
					{category}
				</Badge>
			);
		},
	}),
	columnHelper.accessor("currentStockAvailable", {
		header: "Stock Status",
		cell: (info) => Intl.NumberFormat().format(info.getValue()),
	}),
	columnHelper.accessor("brand", {
		header: "Brand",
		cell: (info) => <span className="font-medium">{info.getValue()}</span>,
	}),
	columnHelper.accessor("shelfLifeDays", {
		header: "Shelf life",
		cell: (info) => Intl.NumberFormat().format(info.getValue()),
	}),
	columnHelper.accessor("status", {
		header: "Status",
		cell: (info) => {
			// Get stock status
			const getStockStatus = (
				product: InventoryProductResponse,
			): {
				label: string;
				color: BadgeVariant;
			} => {
				if (product.currentStockAvailable === 0)
					return { label: "Out of Stock", color: "destructive" };
				if (product.currentStockAvailable <= product.reorderQuantity)
					return { label: "Low Stock", color: "yellow" };
				if (product.currentStockAvailable >= product.maxStockLevel)
					return { label: "Overstock", color: "secondary" };
				return { label: "In Stock", color: "green" };
			};

			const status = getStockStatus(info.row.original);

			return <Badge variant={status.color}>{status.label}</Badge>;
		},
	}),
	columnHelper.display({
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			const product = row.original;
			return <ProductActions product={product} />;
		},
	}),
];

export function ProductCatalogPage({
	productsStats,
	products,
	paginationMeta,
}: {
	products: InventoryProductResponse[];
	productsStats: InventoryProductStatistics;
	paginationMeta: Pagination
}) {
	const [pagination, setPagination] = usePaginationSearchParams();
	const table = useReactTable({
		data: products,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		state: {
			pagination,
		},
	});
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
					<p className="text-muted-foreground mt-1">
						Manage your product inventory and track batches
					</p>
				</div>
				<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							Add Product
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Add New Product</DialogTitle>
							<DialogDescription>
								Create a new product in the catalog with tracking options
							</DialogDescription>
						</DialogHeader>
						<AddProductForm onClose={() => setIsAddDialogOpen(false)} />
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
				<StatCard
					icon={<PackageIcon />}
					bgClass="bg-blue-600/10"
					title="Total products"
					value={Intl.NumberFormat("en-US", {
						compactDisplay: "short",
					}).format(productsStats.totalProducts)}
				/>

				<StatCard
					icon={<BarChart3Icon />}
					bgClass="bg-green-600/10"
					title="Active products"
					value={Intl.NumberFormat("en-US", {
						compactDisplay: "short",
					}).format(productsStats.activeProducts)}
				/>

				<StatCard
					title="Batch tracked"
					bgClass="bg-yellow-600/10"
					icon={<CalendarIcon />}
					value={Intl.NumberFormat("en-US", {
						compactDisplay: "short",
					}).format(productsStats.batchTrackedProducts)}
				/>

				<StatCard
					title="Expiry tracked"
					bgClass="bg-purple-600/10"
					icon={<CalendarIcon />}
					value={Intl.NumberFormat("en-US", {
						compactDisplay: "short",
					}).format(productsStats.expiryTrackedProducts)}
				/>
			</div>

			{/* Filters and Search */}
			{/* <Card>
				<CardHeader>
					<CardTitle>Search & Filter Products</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4 flex-wrap">
						<div className="flex-1 min-w-[200px]">
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search by name, SKU, or description..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>

						<Select
							value={selectedCategory}
							onValueChange={setSelectedCategory}
						>
							<SelectTrigger className="w-[180px]">
								<FilterIcon className="w-4 h-4 mr-2" />
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								{categories.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{cat.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select value={selectedStatus} onValueChange={setSelectedStatus}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="ACTIVE">Active</SelectItem>
								<SelectItem value="INACTIVE">Inactive</SelectItem>
								<SelectItem value="DISCONTINUED">Discontinued</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card> */}

			<ProductsToolbar table={table} />

			{/* Products Table */}

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

// Add Product Form Component
function AddProductForm({ onClose }: { onClose: () => void }) {
	const { mutate, isPending } = useMutation({
		mutationFn: async (payload: z.infer<typeof ApiInputInventoryProduct>) => {
			const response = await addProduct(payload);

			if (!response.success) {
				throw Error(response.error);
			}
		},
		onSuccess: () => {
			toast.success("Product created successfully");
			onClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const form = useForm({
		resolver: zodResolver(ApiInputInventoryProduct),
		defaultValues: {
			trackBatches: false,
			trackExpiry: false,
			trackSerialNumbers: false,
			perishable: false,
			valuationMethod: "FIFO",
			category: "FOOD_FRESH",
			baseUnit: "KG",
		},
	});

	function onSubmit(values: z.infer<typeof ApiInputInventoryProduct>) {
		mutate(values);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<ScrollArea className="pr-4">
					<div className="space-y-6">
						{/* Basic Information */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium">Basic Information</h3>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="sku"
									render={({ field }) => (
										<FormItem>
											<FormLabel>SKU *</FormLabel>
											<FormControl>
												<Input placeholder="e.g., FD-001" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="barcode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Barcode</FormLabel>
											<FormControl>
												<Input
													placeholder="Scan barcode"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Product Name *</FormLabel>
										<FormControl>
											<Input
												placeholder="e.g., Premium Coffee Beans"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Product description"
												rows={3}
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="brand"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Brand</FormLabel>
											<FormControl>
												<Input
													placeholder="Brand name"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="manufacturer"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Manufacturer</FormLabel>
											<FormControl>
												<Input
													placeholder="Manufacturer name"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Categorization */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium">Categorization</h3>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="category"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Category *</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select category" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{categories.map((cat) => (
														<SelectItem key={cat.value} value={cat.value}>
															{cat.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="subcategory"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Subcategory</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g. Dairy"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="tags"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tags</FormLabel>
										<FormControl>
											<Input
												placeholder="Comma separated tags"
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Units & Pricing */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium">Units & Pricing</h3>
							<div className="grid grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="baseUnit"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Base Unit *</FormLabel>
											<FormControl>
												<Input placeholder="e.g., kg" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="purchaseUnit"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Purchase Unit</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g., box"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="conversionFactor"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Conv. Factor</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="1"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="standardCost"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Standard Cost</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0.00"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="sellingPrice"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Selling Price</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0.00"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="taxRate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tax Rate (%)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Inventory Control */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium">Inventory Control</h3>
							<div className="grid grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="minStockLevel"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Min Stock</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="0"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="maxStockLevel"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Max Stock</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="0"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="reorderQuantity"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Reorder Qty</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="0"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Tracking & Storage */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium">Tracking & Storage</h3>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="trackBatches"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>Track Batches</FormLabel>
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="trackExpiry"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>Track Expiry</FormLabel>
											</div>
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="storageRequirements"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Storage Reqs</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g. Dry place"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="shelfLifeDays"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Shelf Life (Days)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="0"
													{...field}
													onChange={(e) =>
														field.onChange(Number.parseFloat(e.target.value))
													}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					</div>
				</ScrollArea>

				<div className="flex gap-2 justify-end pt-4">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending ? "Creating..." : "Create Product"}
					</Button>
				</div>
			</form>
		</Form>
	);
}

// Product Details View Component
function ProductDetailsView({
	product,
}: {
	product: InventoryProductResponse;
}) {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-sm text-muted-foreground">SKU</p>
					<p className="font-mono font-semibold">{product.sku}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Category</p>
					<Badge variant="outline">{product.category}</Badge>
				</div>
			</div>

			<div>
				<p className="text-sm text-muted-foreground mb-1">Description</p>
				<p className="text-sm">{product.description}</p>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-sm text-muted-foreground">Current Stock</p>
					<p className="text-2xl font-bold">
						{product.currentStockAvailable}{" "}
						<span className="text-sm font-normal">{product.baseUnit}</span>
					</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Standard Cost</p>
					<p className="text-2xl font-bold">
						{formatCurrency(product.standardCost)}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div>
					<p className="text-sm text-muted-foreground">Minimum Stock</p>
					<p className="font-semibold">{product.minStockLevel}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Reorder Point</p>
					<p className="font-semibold">{product.reorderQuantity}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Maximum Stock</p>
					<p className="font-semibold">{product.maxStockLevel}</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-sm text-muted-foreground">Batch Tracking</p>
					<Badge variant={product.trackBatches ? "green" : "red"}>
						{product.trackBatches ? "Enabled" : "Disabled"}
					</Badge>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Expiry Tracking</p>
					<Badge variant={product.trackExpiry ? "green" : "red"}>
						{product.trackExpiry ? "Enabled" : "Disabled"}
					</Badge>
				</div>
			</div>

			<div>
				<p className="text-sm text-muted-foreground">Status</p>
				<Badge variant={product.status === "ACTIVE" ? "green" : "red"}>
					{product.status}
				</Badge>
			</div>
		</div>
	);
}

// Product Actions Component with Edit and Delete
function ProductActions({ product }: { product: InventoryProductResponse }) {
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm">
						<MoreVerticalIcon className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => setIsEditOpen(true)}>
						<EditIcon className="mr-2 h-4 w-4" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setIsDeleteOpen(true)}
						className="text-destructive focus:text-destructive"
					>
						<TrashIcon className="mr-2 h-4 w-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Edit Modal */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Product</DialogTitle>
						<DialogDescription>
							Update product details and specifications
						</DialogDescription>
					</DialogHeader>
					<EditProductForm
						product={product}
						onClose={() => setIsEditOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Product</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{product.name}"? This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<DeleteProductAction
							productId={product.id}
							onClose={() => setIsDeleteOpen(false)}
						/>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

// Edit Product Form Component
function EditProductForm({
	product,
	onClose,
}: {
	product: InventoryProductResponse;
	onClose: () => void;
}) {
	const { mutate, isPending } = useMutation({
		mutationFn: async (payload: z.infer<typeof ApiInputInventoryProduct>) => {
			// TODO: Replace with actual update endpoint
			const response = await addProduct(payload);

			if (!response.success) {
				throw Error(response.error);
			}
		},
		onSuccess: () => {
			toast.success("Product updated successfully");
			onClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const form = useForm({
		resolver: zodResolver(ApiInputInventoryProduct),
		defaultValues: {
			sku: product.sku,
			name: product.name,
			description: product.description || "",
			barcode: product.barcode || "",
			brand: product.brand || "",
			manufacturer: product.manufacturer || "",
			category: product.category as z.infer<
				typeof ApiInputInventoryProduct
			>["category"],
			subcategory: product.subcategory || "",
			tags: product.tags || "",
			baseUnit: product.baseUnit,
			purchaseUnit: product.purchaseUnit || "",
			conversionFactor: product.conversionFactor || 1,
			standardCost: product.standardCost || 0,
			sellingPrice: product.sellingPrice || 0,
			taxRate: product.taxRate || 0,
			minStockLevel: product.minStockLevel || 0,
			maxStockLevel: product.maxStockLevel || 0,
			reorderQuantity: product.reorderQuantity || 0,
			shelfLifeDays: product.shelfLifeDays || 0,
			storageRequirements: product.storageRequirements || "",
			trackBatches: product.trackBatches,
			trackExpiry: product.trackExpiry,
			trackSerialNumbers: product.trackSerialNumbers || false,
			perishable: product.perishable,
			valuationMethod: (product.valuationMethod as z.infer<typeof ApiInputInventoryProduct>["valuationMethod"]) || "FIFO",
		},
	});

	function onSubmit(values: z.infer<typeof ApiInputInventoryProduct>) {
		mutate(values);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<ScrollArea className="pr-4 max-h-[60vh]">
					<div className="space-y-6">
						{/* Basic Information */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium">Basic Information</h3>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="sku"
									render={({ field }) => (
										<FormItem>
											<FormLabel>SKU *</FormLabel>
											<FormControl>
												<Input placeholder="e.g., FD-001" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="barcode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Barcode</FormLabel>
											<FormControl>
												<Input
													placeholder="Scan barcode"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Product Name *</FormLabel>
										<FormControl>
											<Input placeholder="e.g., Premium Coffee Beans" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Product description"
												rows={3}
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				</ScrollArea>

				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <span className="mr-2">Updating...</span>}
						{!isPending && "Update Product"}
					</Button>
				</div>
			</form>
		</Form>
	);
}

// Delete Product Action Component
function DeleteProductAction({
	productId,
	onClose,
}: {
	productId: string;
	onClose: () => void;
}) {
	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			// TODO: Replace with actual delete endpoint
			// For now, simulate a delete operation
			console.log("Deleting product", productId);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		},
		onSuccess: () => {
			toast.success("Product deleted successfully");
			onClose();
		},
		onError: (_error) => {
			toast.error("Failed to delete product");
		},
	});

	return (
		<AlertDialogAction
			onClick={() => mutate()}
			disabled={isPending}
			className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
		>
			{isPending ? "Deleting..." : "Delete"}
		</AlertDialogAction>
	);
}
