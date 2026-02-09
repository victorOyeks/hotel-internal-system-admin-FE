"use client";

import { Button } from "@/components/ui/button";
import type {
	InventoryProductResponse,
	InventorySummaryResponse,
} from "@/lib/fetch";
import {
	ArchiveIcon,
	CheckIcon,
	ChevronRightIcon,
	ChevronsUpDownIcon,
	ClipboardListIcon,
	FileTextIcon,
	Loader2Icon,
	PackageCheckIcon,
	PlusIcon,
	TriangleAlert,
	TruckIcon,
} from "lucide-react";

import {
	useEffect,
	useState,
	type PropsWithChildren,
	type ReactNode,
} from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { revalidateRoute } from "@/lib/actions";
import { toast } from "sonner";
import { atom, useAtom, useSetAtom } from "jotai";
import { issueStockItem } from "@/lib/inventory-actions";
import { SuccessDialog } from "@/components/shared/shared-dialogs";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from "@/components/ui/command";
import { useQueryState, parseAsString } from "nuqs";
import { formatDate } from "date-fns";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getStorageLocations } from "@/lib/inventory-actions";
import { AddProductForm } from "./product-catalog-page";

const successDialogAtom = atom({
	show: false,
	message: "",
});

export function InventoryStat({ data }: { data: InventorySummaryResponse }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-blue-600/10 rounded-full flex items-center justify-center">
					<ArchiveIcon className="size-6 text-blue-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Total Items</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.totalItems}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
					<ArchiveIcon className="size-6 text-green-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Available Items</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.available}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-yellow-600/10 rounded-full flex items-center justify-center">
					<ArchiveIcon className="size-6 text-yellow-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Low in Stock</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.lowInStock}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-red-600/10 rounded-full flex items-center justify-center">
					<TriangleAlert className="size-6 text-red-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Out of Stock</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.outOfStock}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-purple-600/10 rounded-full flex items-center justify-center">
					<ClipboardListIcon className="size-6 text-purple-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">
						Pending PO Approvals
					</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.outOfStock}
					</p>
				</div>
			</div>

			<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
				<div className="size-10 aspect-square bg-pink-600/10 rounded-full flex items-center justify-center">
					<FileTextIcon className="size-6 text-pink-600" />
				</div>

				<div className="flex flex-col flex-1">
					<h3 className="text-xs text-muted-foreground">Unposted GRNs</h3>
					<p className="text-xl font-semibold leading-tight">
						{data.outOfStock}
					</p>
				</div>
			</div>
		</div>
	);
}

const actions = [
	{
		title: "Add New Product",
		heading: "Add new Product",
		Component: AddProductForm,
		icon: PlusIcon,
		key: "add-stock-item",
	},
	{
		title: "Issue Stock Item",
		heading: "Issue stock item",
		Component: IssueStockItemForm,
		icon: PackageCheckIcon,
		key: "issue-stock-item",
	}
];

const issueStockItemFormSchema = z.object({
	locationId: z.string("Location is required").min(1),
	issueType: z.enum(
		["INTERNAL_CONSUMPTION", "SALES_ISSUE", "TRANSFER_OUT", "OTHERS"],
		"Issue type is required",
	),
	issueDate: z.string("Date is required"),
	itemId: z.string("Item is required").min(1),
	quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
	department: z.string().optional(),
	receivingStaff: z.string().optional(),
	remarks: z.string().optional(),
});

function ItemSelectorCombobox({
	items,
	value,
	onValueChange,
}: {
	items: InventoryProductResponse[];
	value: string;
	onValueChange: (value: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useQueryState(
		"item:search",
		parseAsString.withDefault(""),
	);
	const [sectionQuery, setSectionQuery] = useQueryState(
		"section",
		parseAsString.withDefault(""),
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: explanation
	useEffect(() => {
		searchQuery && setSearchQuery("");
		sectionQuery && setSectionQuery("");
		return () => {
			setSearchQuery("");
		};
	}, []);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between font-normal"
				>
					{value
						? items.find((item) => item.id === value)?.name
						: "Select item..."}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full flex-1 p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search items..."
						value={searchQuery}
						onValueChange={(value) => setSearchQuery(value)}
					/>
					<CommandList>
						<CommandEmpty>No item found.</CommandEmpty>
						<CommandGroup>
							{items.map((item) => (
								<CommandItem
									key={item.id}
									value={item.id}
									onSelect={(currentValue) => {
										onValueChange(currentValue === value ? "" : currentValue);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === item.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div>
										<div className="font-medium">{item.sku}</div>
										<div className="text-sm text-gray-500">{item.name}</div>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

function IssueStockItemForm({
	data,
	onClose,
}: {
	onClose: () => void;
	data: InventoryProductResponse[];
}) {
	const setShowSuccessDialog = useSetAtom(successDialogAtom);
	const { data: locations } = useQuery({
		queryKey: ["locations"],
		queryFn: async () => {
			const res = await getStorageLocations();
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
	});

	const form = useForm({
		resolver: zodResolver(issueStockItemFormSchema),
		defaultValues: {
			locationId: "",
			issueType: undefined,
			issueDate: new Date().toISOString().split("T")[0],
			itemId: "",
			quantity: 1,
			department: "",
			receivingStaff: "",
			remarks: "",
		},
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async (payload: z.infer<typeof issueStockItemFormSchema>) => {
			const {
				itemId,
				quantity,
				remarks,
				department,
				receivingStaff,
				...rest
			} = payload;

			const response = await issueStockItem({
				...rest,
				departmentId: department,
				receivedBy: receivingStaff,
				items: [
					{
						productId: itemId,
						quantity,
						notes: remarks,
					},
				],
			});

			if (!response.success) {
				throw new Error(response.error);
			}

			return response.data;
		},
		onSuccess: async (data) => {
			form.reset();
			onClose();
			setShowSuccessDialog({
				show: true,
				message: typeof data === "string" ? data : "Stock issued successfully",
			});
			await revalidateRoute("/inventory");
		},
		onError: (e) => {
			toast.error("Something went wrong", {
				description: e.message,
			});
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((data) => mutate(data))}
				className="space-y-4"
			>
				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="locationId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Location</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select location" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{locations?.map((loc) => (
											<SelectItem key={loc.id} value={loc.id}>
												{loc.locationName}
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
						name="issueType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Issue Type</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="INTERNAL_CONSUMPTION">
											Internal Consumption
										</SelectItem>
										<SelectItem value="SALES_ISSUE">Sales Issue</SelectItem>
										<SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
										<SelectItem value="OTHERS">Others</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="issueDate"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Date</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="itemId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Item</FormLabel>
							<FormControl>
								<ItemSelectorCombobox
									items={data || []}
									value={field.value}
									onValueChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="department"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Department</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="quantity"
						render={() => (
							<FormItem>
								<FormLabel>Quantity</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										{...form.register("quantity", { valueAsNumber: true })}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="receivingStaff"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Receiving Staff</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="remarks"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Remarks</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={isPending} className="w-full">
					{isPending ? (
						<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
					) : null}
					Issue Stock
				</Button>
			</form>
		</Form>
	);
}


export function QuickActions({ data }: { data: InventoryProductResponse[] }) {
	const [open, setOpen] = useState<false | string>(false);
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
			{actions.map(({ icon: Icon, title, key, heading, Component }) => {
				return (
					<BaseModal
						key={key}
						open={open === key}
						setOpen={(open) => setOpen(open ? key : false)}
						trigger={
							<div className="flex flex-row items-center gap-x-2 bg-white p-2 rounded-4xl border border-primary-5/50">
								<div className="flex items-center gap-x-2 flex-1">
									<div className="size-8 aspect-square bg-green-600/10 rounded-full flex items-center justify-center">
										<Icon className="size-5 text-green-600" />
									</div>

									<p className="text-sm font-medium">{title}</p>
								</div>

								<ChevronRightIcon className="size-4 text-muted-foreground" />
							</div>
						}
					>
						<DialogTitle>{heading || title}</DialogTitle>
						<DialogDescription className="sr-only">{title}</DialogDescription>
						{Component && (
							<Component
								onClose={() => setOpen(false)}
								data={data}
							/>
						)}
					</BaseModal>
				);
			})}
		</div>
	);
}

function BaseModal({
	children,
	open,
	setOpen,
	trigger,
}: PropsWithChildren<{
	trigger: ReactNode;
	open: boolean;
	setOpen: (open: boolean) => void;
}>) {
	return (
		<Dialog modal open={open} onOpenChange={setOpen}>
			<DialogTrigger>{trigger}</DialogTrigger>

			<DialogContent className="rounded-4xl max-w-2xl max-h-[90vh] overflow-y-auto">{children}</DialogContent>
		</Dialog>
	);
}

// Helper component for stat cards
function StatCard({
	icon,
	label,
	value,
	bgColor,
	iconColor,
}: {
	icon: ReactNode;
	label: string;
	value: string | number;
	bgColor: string;
	iconColor: string;
}) {
	return (
		<div className="flex flex-row items-center gap-x-2 bg-white p-2.5 rounded-2xl border border-primary-5/50">
			<div
				className={`size-10 aspect-square ${bgColor} rounded-full flex items-center justify-center`}
			>
				<div className={iconColor}>{icon}</div>
			</div>
			<div className="flex flex-col flex-1">
				<h3 className="text-xs text-muted-foreground">{label}</h3>
				<p className="text-xl font-semibold leading-tight">{value}</p>
			</div>
		</div>
	);
}

// Helper component for product lists
function ProductListCard({
	title,
	products,
	emptyMessage,
}: {
	title: string;
	products: Array<{
		productId: string;
		sku: string;
		name: string;
		category: string;
		currentStock: number;
		reorderLevel: number;
		locationCode: string;
		value: number;
	}>;
	emptyMessage: string;
}) {
	return (
		<section className="bg-white rounded-2xl border border-primary-5/50 overflow-hidden">
			<div className="px-4 py-3 border-b bg-gray-50">
				<h3 className="text-sm font-semibold">{title}</h3>
			</div>
			<div className="divide-y max-h-80 overflow-y-auto">
				{products.length === 0 ? (
					<div className="p-4 text-sm text-gray-500 text-center">
						{emptyMessage}
					</div>
				) : (
					products.map((product) => (
						<div
							key={product.productId}
							className="p-3 hover:bg-gray-50 transition-colors"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span className="text-xs font-medium text-gray-900 truncate">
											{product.name}
										</span>
										<span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
											{product.sku}
										</span>
									</div>
									<p className="text-xs text-gray-500">{product.category}</p>
									<div className="flex items-center gap-3 mt-1">
										<span className="text-xs text-gray-600">
											Stock:{" "}
											<span className="font-medium">
												{product.currentStock}
											</span>
										</span>
										<span className="text-xs text-gray-600">
											Reorder:{" "}
											<span className="font-medium">
												{product.reorderLevel}
											</span>
										</span>
										<span className="text-xs text-gray-600">
											Loc:{" "}
											<span className="font-medium">
												{product.locationCode}
											</span>
										</span>
									</div>
								</div>
								<div className="text-right">
									<p className="text-sm font-semibold text-gray-900">
										${product.value}
									</p>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</section>
	);
}

export function InventoryDashboard({
	dashboardData,
}: {
	dashboardData: import("@/lib/fetch").InventoryDashboard;
}) {
	const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

	return (
		<div className="space-y-6">
			{/* Summary Metrics */}
			<section>
				<h2 className="text-lg font-semibold mb-4">Inventory Overview</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
					<StatCard
						icon={<ArchiveIcon className="size-5" />}
						label="Total Products"
						value={dashboardData.totalProducts}
						bgColor="bg-blue-600/10"
						iconColor="text-blue-600"
					/>
					<StatCard
						icon={<CheckIcon className="size-5" />}
						label="Active Products"
						value={dashboardData.activeProducts}
						bgColor="bg-green-600/10"
						iconColor="text-green-600"
					/>
					<StatCard
						icon={<TriangleAlert className="size-5" />}
						label="Low Stock"
						value={dashboardData.lowStockProductsCount}
						bgColor="bg-yellow-600/10"
						iconColor="text-yellow-600"
					/>
					<StatCard
						icon={<TriangleAlert className="size-5" />}
						label="Out of Stock"
						value={dashboardData.outOfStockProducts}
						bgColor="bg-red-600/10"
						iconColor="text-red-600"
					/>
				</div>
			</section>

			{/* Stock Totals */}
			<section>
				<h2 className="text-lg font-semibold mb-4">Stock Summary</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
					<StatCard
						icon={<ArchiveIcon className="size-5" />}
						label="Total Value"
						value={formatCurrency(dashboardData.totalInventoryValue)}
						bgColor="bg-purple-600/10"
						iconColor="text-purple-600"
					/>
					<StatCard
						icon={<PackageCheckIcon className="size-5" />}
						label="Stock on Hand"
						value={dashboardData.totalStockOnHand}
						bgColor="bg-indigo-600/10"
						iconColor="text-indigo-600"
					/>
					<StatCard
						icon={<ClipboardListIcon className="size-5" />}
						label="Reserved Stock"
						value={dashboardData.totalReservedStock}
						bgColor="bg-orange-600/10"
						iconColor="text-orange-600"
					/>
					<StatCard
						icon={<CheckIcon className="size-5" />}
						label="Available Stock"
						value={dashboardData.totalAvailableStock}
						bgColor="bg-green-600/10"
						iconColor="text-green-600"
					/>
				</div>
			</section>

			{/* Purchase Orders & GRNs */}
			<section>
				<h2 className="text-lg font-semibold mb-4">Purchase Orders & GRNs</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
					<StatCard
						icon={<FileTextIcon className="size-5" />}
						label="Pending POs"
						value={dashboardData.pendingPurchaseOrders}
						bgColor="bg-amber-600/10"
						iconColor="text-amber-600"
					/>
					<StatCard
						icon={<CheckIcon className="size-5" />}
						label="Approved POs"
						value={dashboardData.approvedPurchaseOrders}
						bgColor="bg-green-600/10"
						iconColor="text-green-600"
					/>
					<StatCard
						icon={<TruckIcon className="size-5" />}
						label="Total PO Value"
						value={`${formatCurrency(dashboardData.totalPurchaseOrderValue)}`}
						bgColor="bg-blue-600/10"
						iconColor="text-blue-600"
					/>
					<StatCard
						icon={<ClipboardListIcon className="size-5" />}
						label="Pending GRNs"
						value={dashboardData.pendingGRNs}
						bgColor="bg-yellow-600/10"
						iconColor="text-yellow-600"
					/>
					<StatCard
						icon={<PackageCheckIcon className="size-5" />}
						label="Today's GRNs"
						value={dashboardData.todayGRNsReceived}
						bgColor="bg-green-600/10"
						iconColor="text-green-600"
					/>
					<StatCard
						icon={<FileTextIcon className="size-5" />}
						label="Today's GRN Value"
						value={`${formatCurrency(dashboardData.todayGRNsValue)}`}
						bgColor="bg-purple-600/10"
						iconColor="text-purple-600"
					/>
				</div>
			</section>

			{/* Operations */}
			<section>
				<h2 className="text-lg font-semibold mb-4">Operations</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
					<StatCard
						icon={<ClipboardListIcon className="size-5" />}
						label="Pending Adjustments"
						value={dashboardData.pendingAdjustments}
						bgColor="bg-pink-600/10"
						iconColor="text-pink-600"
					/>
					<StatCard
						icon={<CheckIcon className="size-5" />}
						label="Today's Adjustments"
						value={dashboardData.todayAdjustments}
						bgColor="bg-cyan-600/10"
						iconColor="text-cyan-600"
					/>
					<StatCard
						icon={<ClipboardListIcon className="size-5" />}
						label="Scheduled Stock Takes"
						value={dashboardData.scheduledStockTakes}
						bgColor="bg-teal-600/10"
						iconColor="text-teal-600"
					/>
					<StatCard
						icon={<Loader2Icon className="size-5" />}
						label="In Progress Stock Takes"
						value={dashboardData.inProgressStockTakes}
						bgColor="bg-orange-600/10"
						iconColor="text-orange-600"
					/>
					<StatCard
						icon={<FileTextIcon className="size-5" />}
						label="Pending Review"
						value={dashboardData.pendingReviewStockTakes}
						bgColor="bg-violet-600/10"
						iconColor="text-violet-600"
					/>
					<StatCard
						icon={<TriangleAlert className="size-5" />}
						label="Expiring Soon"
						value={dashboardData.expiringSoonProductsCount}
						bgColor="bg-red-600/10"
						iconColor="text-red-600"
					/>
				</div>
			</section>

			{/* Product Lists in Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Low Stock Products */}
				{dashboardData.lowStockProducts.length > 0 && (
					<ProductListCard
						title="Low Stock Products"
						products={dashboardData.lowStockProducts}
						emptyMessage="No low stock products"
					/>
				)}

				{/* Fast Moving Products */}
				{(dashboardData.fastMovingProducts ?? []).length > 0 && (
					<ProductListCard
						title="Fast Moving Products"
						products={dashboardData.fastMovingProducts ?? []}
						emptyMessage="No fast moving products"
					/>
				)}

				{/* Slow Moving Products */}
				{(dashboardData.slowMovingProducts ?? []).length > 0 && (
					<ProductListCard
						title="Slow Moving Products"
						products={dashboardData.slowMovingProducts ?? []}
						emptyMessage="No slow moving products"
					/>
				)}

				{/* Expiring Soon Products */}
				{dashboardData.expiringSoonProducts.length > 0 && (
					<ProductListCard
						title="Expiring Soon"
						products={dashboardData.expiringSoonProducts}
						emptyMessage="No products expiring soon"
					/>
				)}
			</div>

			{/* Recent Activities */}
			{(dashboardData.recentActivities ?? []).length > 0 && (
				<section>
					<h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
					<div className="bg-white rounded-2xl border border-primary-5/50 overflow-hidden">
						<div className="divide-y">
							{dashboardData.recentActivities.map((activity, index) => (
								<div
									key={index}
									className="p-4 hover:bg-gray-50 transition-colors"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
													{activity.activityType}
												</span>
												<span className="text-xs text-gray-500">
													{activity.referenceNumber}
												</span>
											</div>
											<p className="text-sm text-gray-900">
												{activity.description}
											</p>
											<p className="text-xs text-gray-500 mt-1">
												By {activity.performedBy}
											</p>
										</div>
										<div className="text-xs text-gray-400 whitespace-nowrap">
											{formatDate(new Date(activity.activityDate), "dd/MM/yyyy")}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>
			)}

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
