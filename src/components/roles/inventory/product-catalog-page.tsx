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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
	PlusIcon,
	PackageIcon,
	BarChart3Icon,
	CalendarIcon,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductsToolbar } from "./products";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { InventoryProductResponse } from "@/lib/fetch";
import { DataTablePagination } from "@/components/shared/pagination";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";

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
	columnHelper.accessor("currentStockAvailable", {
		header: "Current Stock",
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
];

export function ProductCatalogPage({
	products,
}: {
	products: InventoryProductResponse[];
}) {
	const [pagination, setPagination] = usePaginationSearchParams();
	const table = useReactTable({
		data: products,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
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
					}).format(products.length)}
				/>

				<StatCard
					icon={<BarChart3Icon />}
					bgClass="bg-green-600/10"
					title="Active products"
					value={Intl.NumberFormat("en-US", {
						compactDisplay: "short",
					}).format(products.filter((p) => p.status === "ACTIVE").length)}
				/>

				<StatCard
					title="Batch tracked"
					bgClass="bg-yellow-600/10"
					icon={<CalendarIcon />}
					value={Intl.NumberFormat("en-US", {
						compactDisplay: "short",
					}).format(products.filter((p) => p.trackBatches).length)}
				/>

				<StatCard
					title="Expiry tracked"
					bgClass="bg-purple-600/10"
					icon={<CalendarIcon />}
					value={Intl.NumberFormat("en-US", {
						compactDisplay: "short",
					}).format(products.filter((p) => p.trackExpiry).length)}
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
	return (
		<form className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="sku">SKU/Product Code *</Label>
					<Input id="sku" placeholder="e.g., FD-001" required />
				</div>
				<div className="space-y-2">
					<Label htmlFor="name">Product Name *</Label>
					<Input id="name" placeholder="e.g., Premium Coffee Beans" required />
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea id="description" placeholder="Product description" rows={3} />
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="category">Category *</Label>
					<Select>
						<SelectTrigger>
							<SelectValue placeholder="Select category" />
						</SelectTrigger>
						<SelectContent>
							{categories.map((cat) => (
								<SelectItem key={cat.value} value={cat.value}>
									{cat.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label htmlFor="unit">Unit of Measure *</Label>
					<Input id="unit" placeholder="e.g., kg, liters, pieces" />
				</div>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div className="space-y-2">
					<Label htmlFor="minStock">Minimum Stock</Label>
					<Input id="minStock" type="number" placeholder="0" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="maxStock">Maximum Stock</Label>
					<Input id="maxStock" type="number" placeholder="0" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="reorder">Reorder Point</Label>
					<Input id="reorder" type="number" placeholder="0" />
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="cost">Standard Cost</Label>
				<Input id="cost" type="number" step="0.01" placeholder="0.00" />
			</div>

			<div className="space-y-4">
				<div className="flex items-center space-x-2">
					<Checkbox id="trackBatches" />
					<Label htmlFor="trackBatches" className="cursor-pointer">
						Track Batches (Enable batch number tracking)
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox id="trackExpiry" />
					<Label htmlFor="trackExpiry" className="cursor-pointer">
						Track Expiry Dates (Enable expiry date tracking)
					</Label>
				</div>
			</div>

			<div className="flex gap-2 justify-end pt-4">
				<Button type="button" variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button type="submit">Create Product</Button>
			</div>
		</form>
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
