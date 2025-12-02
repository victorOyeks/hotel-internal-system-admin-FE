"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
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
	SearchIcon,
	FilterIcon,
	PackageIcon,
	EditIcon,
	EyeIcon,
	BarChart3Icon,
	CalendarIcon,
} from "lucide-react";

// Product types based on FRD 3.4
type Product = {
	id: string;
	sku: string;
	name: string;
	description: string;
	category: string;
	unitOfMeasure: string;
	trackBatches: boolean;
	trackExpiry: boolean;
	minimumStockLevel: number;
	maximumStockLevel: number;
	reorderPoint: number;
	standardCost: number;
	status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
	currentStock: number;
	createdDate: string;
};

// Mock data based on FRD requirements
const mockProducts: Product[] = [
	{
		id: "1",
		sku: "FD-001",
		name: "Premium Coffee Beans",
		description: "High-quality Arabica coffee beans",
		category: "FOOD",
		unitOfMeasure: "kg",
		trackBatches: true,
		trackExpiry: true,
		minimumStockLevel: 50,
		maximumStockLevel: 200,
		reorderPoint: 75,
		standardCost: 25.5,
		status: "ACTIVE",
		currentStock: 120,
		createdDate: "2024-01-15",
	},
	{
		id: "2",
		sku: "BV-001",
		name: "Orange Juice - Fresh",
		description: "Freshly squeezed orange juice",
		category: "BEVERAGE",
		unitOfMeasure: "liters",
		trackBatches: true,
		trackExpiry: true,
		minimumStockLevel: 30,
		maximumStockLevel: 100,
		reorderPoint: 40,
		standardCost: 8.75,
		status: "ACTIVE",
		currentStock: 25,
		createdDate: "2024-01-20",
	},
	{
		id: "3",
		sku: "SUP-001",
		name: "Laundry Detergent - Industrial",
		description: "Heavy-duty laundry detergent for hotel linens",
		category: "SUPPLIES",
		unitOfMeasure: "liters",
		trackBatches: false,
		trackExpiry: false,
		minimumStockLevel: 20,
		maximumStockLevel: 80,
		reorderPoint: 30,
		standardCost: 15.0,
		status: "ACTIVE",
		currentStock: 45,
		createdDate: "2024-02-01",
	},
	{
		id: "4",
		sku: "LIN-001",
		name: "Bath Towels - White",
		description: "100% cotton bath towels, white, 600 GSM",
		category: "LINEN",
		unitOfMeasure: "pieces",
		trackBatches: false,
		trackExpiry: false,
		minimumStockLevel: 100,
		maximumStockLevel: 300,
		reorderPoint: 150,
		standardCost: 12.5,
		status: "ACTIVE",
		currentStock: 180,
		createdDate: "2024-01-10",
	},
	{
		id: "5",
		sku: "AME-001",
		name: "Shampoo Bottles - 30ml",
		description: "Guest amenity shampoo bottles",
		category: "AMENITIES",
		unitOfMeasure: "pieces",
		trackBatches: true,
		trackExpiry: true,
		minimumStockLevel: 500,
		maximumStockLevel: 2000,
		reorderPoint: 750,
		standardCost: 0.85,
		status: "ACTIVE",
		currentStock: 1200,
		createdDate: "2024-01-25",
	},
	{
		id: "6",
		sku: "EQ-001",
		name: "Vacuum Cleaner Bags",
		description: "Replacement bags for industrial vacuum cleaners",
		category: "EQUIPMENT",
		unitOfMeasure: "pieces",
		trackBatches: false,
		trackExpiry: false,
		minimumStockLevel: 20,
		maximumStockLevel: 50,
		reorderPoint: 25,
		standardCost: 8.0,
		status: "ACTIVE",
		currentStock: 15,
		createdDate: "2024-02-10",
	},
	{
		id: "7",
		sku: "FD-002",
		name: "Butter - Unsalted",
		description: "Premium unsalted butter for cooking",
		category: "FOOD",
		unitOfMeasure: "kg",
		trackBatches: true,
		trackExpiry: true,
		minimumStockLevel: 15,
		maximumStockLevel: 50,
		reorderPoint: 20,
		standardCost: 12.0,
		status: "ACTIVE",
		currentStock: 8,
		createdDate: "2024-01-18",
	},
	{
		id: "8",
		sku: "SUP-002",
		name: "Toilet Paper - Commercial",
		description: "Commercial grade toilet paper rolls",
		category: "SUPPLIES",
		unitOfMeasure: "rolls",
		trackBatches: false,
		trackExpiry: false,
		minimumStockLevel: 200,
		maximumStockLevel: 600,
		reorderPoint: 300,
		standardCost: 1.25,
		status: "ACTIVE",
		currentStock: 0,
		createdDate: "2024-01-12",
	},
];

const categories = [
	{ value: "FOOD", label: "Food" },
	{ value: "BEVERAGE", label: "Beverage" },
	{ value: "SUPPLIES", label: "Supplies" },
	{ value: "EQUIPMENT", label: "Equipment" },
	{ value: "LINEN", label: "Linen" },
	{ value: "AMENITIES", label: "Amenities" },
];

export function ProductCatalogPage() {
	const [products] = useState<Product[]>(mockProducts);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

	// Filter products
	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
			product.description.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesCategory =
			selectedCategory === "all" || product.category === selectedCategory;

		const matchesStatus =
			selectedStatus === "all" || product.status === selectedStatus;

		return matchesSearch && matchesCategory && matchesStatus;
	});

	// Get stock status
	const getStockStatus = (product: Product) => {
		if (product.currentStock === 0)
			return { label: "Out of Stock", color: "destructive" };
		if (product.currentStock <= product.reorderPoint)
			return { label: "Low Stock", color: "warning" };
		if (product.currentStock >= product.maximumStockLevel)
			return { label: "Overstock", color: "secondary" };
		return { label: "In Stock", color: "success" };
	};

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
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-blue-50 rounded-lg">
								<PackageIcon className="w-5 h-5 text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Total Products</p>
								<p className="text-2xl font-bold">{products.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-green-50 rounded-lg">
								<BarChart3Icon className="w-5 h-5 text-green-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Active Products</p>
								<p className="text-2xl font-bold">
									{products.filter((p) => p.status === "ACTIVE").length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-yellow-50 rounded-lg">
								<CalendarIcon className="w-5 h-5 text-yellow-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Batch Tracked</p>
								<p className="text-2xl font-bold">
									{products.filter((p) => p.trackBatches).length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-purple-50 rounded-lg">
								<CalendarIcon className="w-5 h-5 text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Expiry Tracked</p>
								<p className="text-2xl font-bold">
									{products.filter((p) => p.trackExpiry).length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Search */}
			<Card>
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
			</Card>

			{/* Products Table */}
			<Card>
				<CardHeader>
					<CardTitle>Products ({filteredProducts.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>SKU</TableHead>
								<TableHead>Product Name</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Stock Status</TableHead>
								<TableHead className="text-right">Current Stock</TableHead>
								<TableHead className="text-center">Batch</TableHead>
								<TableHead className="text-center">Expiry</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredProducts.map((product) => {
								const stockStatus = getStockStatus(product);
								return (
									<TableRow key={product.id}>
										<TableCell className="font-mono text-sm">
											{product.sku}
										</TableCell>
										<TableCell>
											<div>
												<p className="font-medium">{product.name}</p>
												<p className="text-xs text-muted-foreground line-clamp-1">
													{product.description}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline">{product.category}</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={stockStatus.color as BadgeVariant}>
												{stockStatus.label}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<span className="font-semibold">
												{product.currentStock}
											</span>
											<span className="text-muted-foreground text-sm ml-1">
												{product.unitOfMeasure}
											</span>
										</TableCell>
										<TableCell className="text-center">
											{product.trackBatches ? (
												<Badge variant="secondary" className="text-xs">
													Yes
												</Badge>
											) : (
												<span className="text-muted-foreground text-xs">
													No
												</span>
											)}
										</TableCell>
										<TableCell className="text-center">
											{product.trackExpiry ? (
												<Badge variant="secondary" className="text-xs">
													Yes
												</Badge>
											) : (
												<span className="text-muted-foreground text-xs">
													No
												</span>
											)}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													product.status === "ACTIVE"
														? "default"
														: product.status === "INACTIVE"
															? "secondary"
															: "outline"
												}
											>
												{product.status}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex gap-2 justify-end">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setSelectedProduct(product)}
												>
													<EyeIcon className="w-4 h-4" />
												</Button>
												<Button variant="ghost" size="sm">
													<EditIcon className="w-4 h-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Product Details Dialog */}
			{selectedProduct && (
				<Dialog
					open={!!selectedProduct}
					onOpenChange={() => setSelectedProduct(null)}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>{selectedProduct.name}</DialogTitle>
							<DialogDescription>
								Product Details and Specifications
							</DialogDescription>
						</DialogHeader>
						<ProductDetailsView product={selectedProduct} />
					</DialogContent>
				</Dialog>
			)}
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
function ProductDetailsView({ product }: { product: Product }) {
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
						{product.currentStock}{" "}
						<span className="text-sm font-normal">{product.unitOfMeasure}</span>
					</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Standard Cost</p>
					<p className="text-2xl font-bold">${product.standardCost}</p>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div>
					<p className="text-sm text-muted-foreground">Minimum Stock</p>
					<p className="font-semibold">{product.minimumStockLevel}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Reorder Point</p>
					<p className="font-semibold">{product.reorderPoint}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Maximum Stock</p>
					<p className="font-semibold">{product.maximumStockLevel}</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-sm text-muted-foreground">Batch Tracking</p>
					<Badge variant={product.trackBatches ? "default" : "secondary"}>
						{product.trackBatches ? "Enabled" : "Disabled"}
					</Badge>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Expiry Tracking</p>
					<Badge variant={product.trackExpiry ? "default" : "secondary"}>
						{product.trackExpiry ? "Enabled" : "Disabled"}
					</Badge>
				</div>
			</div>

			<div>
				<p className="text-sm text-muted-foreground">Status</p>
				<Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
					{product.status}
				</Badge>
			</div>
		</div>
	);
}
