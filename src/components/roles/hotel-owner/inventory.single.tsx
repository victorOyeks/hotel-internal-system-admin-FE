"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";
import type { InventoryProductResponse, Pagination } from "@/lib/fetch";
import { SearchIcon, ArrowLeftIcon, RotateCcwIcon } from "lucide-react";
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
import { useCallback, useMemo, useState } from "react";
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
import { DataTablePagination } from "@/components/shared/pagination";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePaginationSearchParams } from "@/lib/search-params.pagination";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQueryStates, parseAsString, parseAsStringLiteral } from "nuqs";

// Hotel Owner Inventory Filter Component
const HotelOwnerInventoryFilter = ({
	queryState,
	setQueryState,
	setOpen,
}: {
	setOpen: (open: boolean) => void;
	queryState: {
		search: string | null;
		category: string | null;
		status: string | null;
	};
	setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
	const [tempFilters, setTempFilters] = useState({
		search: queryState.search || null,
		category: queryState.category || null,
		status: queryState.status || null,
	});

	const applyFilters = useCallback(() => {
		setQueryState({
			...queryState,
			search: tempFilters.search,
			category: tempFilters.category,
			status: tempFilters.status,
		});
		setOpen(false);
	}, [queryState, tempFilters, setQueryState, setOpen]);

	const clearFilters = useCallback(() => {
		const clearedFilters = {
			search: null,
			category: null,
			status: null,
		};
		setTempFilters(clearedFilters);
		setQueryState({
			...queryState,
			...clearedFilters,
		});
	}, [queryState, setQueryState]);

	const filterStates = useMemo(() => {
		const hasActiveFilters = !!(
			tempFilters.search ||
			tempFilters.category ||
			tempFilters.status
		);

		return { hasActiveFilters };
	}, [tempFilters]);

	const categoryOptions = useMemo(
		() => [
			{ value: "FOOD_FRESH", label: "Food (Fresh)" },
			{ value: "FOOD_FROZEN", label: "Food (Frozen)" },
			{ value: "FOOD_DRY_GOODS", label: "Food (Dry Goods)" },
			{ value: "BEVERAGES_ALCOHOLIC", label: "Alcoholic Beverages" },
			{ value: "BEVERAGES_NON_ALCOHOLIC", label: "Non-Alcoholic Beverages" },
			{ value: "CLEANING_SUPPLIES", label: "Cleaning Supplies" },
			{ value: "LAUNDRY_SUPPLIES", label: "Laundry Supplies" },
			{ value: "GUEST_AMENITIES", label: "Guest Amenities" },
			{ value: "LINENS_TOWELS", label: "Linens & Towels" },
			{ value: "MAINTENANCE_SUPPLIES", label: "Maintenance" },
			{ value: "KITCHEN_EQUIPMENT", label: "Kitchen Equipment" },
			{ value: "TABLEWARE", label: "Tableware" },
			{ value: "MINIBAR_ITEMS", label: "Minibar Items" },
			{ value: "OFFICE_EQUIPMENT", label: "Office Equipment" },
			{ value: "GENERAL_SUPPLIES", label: "General Supplies" },
			{ value: "OTHER", label: "Other" },
		],
		[],
	);

	const statusOptions = useMemo(
		() => [
			{ value: "ACTIVE", label: "Active" },
			{ value: "INACTIVE", label: "Inactive" },
			{ value: "DISCONTINUED", label: "Discontinued" },
		],
		[],
	);

	return (
		<div className="space-y-4 w-96">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-sm">Filter Inventory</h4>
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

			{/* Filter Grid */}
			<div className="space-y-4">
				<div className="space-y-2">
					<Label className="text-sm font-medium">Search</Label>
					<Input
						placeholder="Search by name, SKU..."
						value={tempFilters.search || ""}
						onChange={(e) =>
							setTempFilters({
								...tempFilters,
								search: e.target.value || null,
							})
						}
					/>
				</div>

				<div className="space-y-2">
					<Label className="text-sm font-medium">Category</Label>
					<Select
						value={tempFilters.category || "all"}
						onValueChange={(value) =>
							setTempFilters({
								...tempFilters,
								category: value === "all" ? null : value,
							})
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="All Categories" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{categoryOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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
							<SelectValue placeholder="All Statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							{statusOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{filterStates.hasActiveFilters && (
				<div className="pt-2 border-t">
					<p className="text-xs text-muted-foreground mb-2">Active filters:</p>
					<div className="flex flex-wrap gap-1">
						{tempFilters.search && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Search: {tempFilters.search}
							</span>
						)}
						{tempFilters.category && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Category:{" "}
								{categoryOptions.find((c) => c.value === tempFilters.category)?.label}
							</span>
						)}
						{tempFilters.status && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-5/10 rounded-md text-xs">
								Status: {tempFilters.status}
							</span>
						)}
					</div>
				</div>
			)}

			{/* Action Buttons */}
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
};

function ListToolbar() {
	const router = useRouter();
	const pageParams = useParams();
	const searchParams = useSearchParams();

	const currentSection = useMemo(() => {
		return (searchParams.get("section") || "all") as "all" | "history";
	}, [searchParams]);

	const setSection = (section: "all" | "history") => {
		const params = new URLSearchParams(searchParams);
		params.set("section", section === "all" ? "all" : "history");
		router.replace(
			`/dashboard/inventory/${pageParams.id}?${params.toString()}`,
		);
	};

	const [filterStates, setFilterStates] = useQueryStates({
		search: parseAsString,
		category: parseAsString,
		status: parseAsString,
	});

	const filterQueryState = useMemo(
		() => ({
			search: filterStates.search,
			category: filterStates.category,
			status: filterStates.status,
		}),
		[filterStates],
	);

	const setFilterQueryState = useCallback(
		(state: Partial<typeof filterQueryState>) => {
			setFilterStates((prev) => ({
				...prev,
				...state,
			}));
		},
		[setFilterStates],
	);

	const appliedFilters = useMemo(() => {
		const filters: Array<{ key: string; label: string; value: string }> = [];

		if (filterStates.search) {
			filters.push({
				key: "search",
				label: "Search",
				value: filterStates.search,
			});
		}

		if (filterStates.category) {
			filters.push({
				key: "category",
				label: "Category",
				value: filterStates.category.replace(/_/g, " "),
			});
		}

		if (filterStates.status) {
			filters.push({
				key: "status",
				label: "Status",
				value: filterStates.status,
			});
		}

		return filters;
	}, [filterStates]);

	// Handler to remove individual filters
	const removeFilter = useCallback(
		(key: string) => {
			setFilterStates((prev) => ({
				...prev,
				[key]: null,
			}));
		},
		[setFilterStates],
	);

	const [filterOpen, setFilterOpen] = useState(false);

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div className="flex items-center gap-x-2">
				<Button
					variant={"outline"}
					onClick={() => setSection("all")}
					className={cn(
						"rounded-full shadow-none border-none",
						currentSection === "all"
							? "bg-primary-5/20 text-primary"
							: "bg-gray-100",
					)}
					size={"sm"}
				>
					All Item
				</Button>
				<Button
					variant={"outline"}
					onClick={() => setSection("history")}
					className={cn("rounded-full shadow-none border-none", {
						"bg-primary-5/20 text-primary": currentSection === "history",
						"bg-gray-100": currentSection !== "history",
					})}
					size={"sm"}
				>
					Supply History
				</Button>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search"
						className="w-full pl-9 py-2 bg-primary-5/10 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				<TableFilter open={filterOpen} setOpen={setFilterOpen}>
					<HotelOwnerInventoryFilter
						queryState={filterQueryState}
						setQueryState={setFilterQueryState}
						setOpen={setFilterOpen}
					/>
				</TableFilter>

				<div className="flex items-center gap-x-2 ">
					{/* Applied Filter Chips */}
					{appliedFilters.map((filter) => (
						<Badge
							key={filter.key}
							variant="green"
							className="px-2 py-1 text-xs flex items-center gap-1"
						>
							{filter.label}: {filter.value}
							<button
								type="button"
								onClick={() => removeFilter(filter.key)}
								className="ml-1 hover:text-red-500"
							>
								×
							</button>
						</Badge>
					))}
				</div>

				<Button size={"sm"} className="rounded-md md:rounded-xl">
					Export
				</Button>
			</div>
		</div>
	);
}

const allSupplyColumnHelper = createColumnHelper<InventoryProductResponse>();

const allSupplyColumns = [
	allSupplyColumnHelper.display({
		header: "SKU",
		cell: (info) => <span className="font-mono text-xs">{info.row.original.sku}</span>,
	}),
	allSupplyColumnHelper.accessor("name", {
		header: "Product",
		cell: (info) => <span className="text-foreground">{info.getValue()}</span>,
	}),
	allSupplyColumnHelper.accessor("category", {
		header: "Category",
		cell: (info) => (
			<span className="font-semibold text-foreground capitalize">
				{info.getValue()?.replace(/_/g, " ").toLowerCase()}
			</span>
		),
	}),
	allSupplyColumnHelper.accessor("baseUnit", {
		header: "Unit",
		cell: (info) => <span>{info.getValue()}</span>,
	}),
	allSupplyColumnHelper.accessor("status", {
		header: "Status",
		cell: (info) => {
			const status = info.getValue();
			const variant: Record<string, BadgeVariant> = {
				ACTIVE: "green",
				INACTIVE: "outline",
				DISCONTINUED: "destructive",
				DRAFT: "yellow",
				ARCHIVED: "blue",
			};

			return (
				<Badge className="capitalize" variant={variant[status]}>
					{status.toLowerCase()}
				</Badge>
			);
		},
	}),
	allSupplyColumnHelper.accessor("currentStockOnHand", {
		header: "Stock on Hand",
		cell: (info) => <span>{info.getValue() ?? 0}</span>,
	}),
];

function InventoryTable({ table }: { table: TableType<InventoryProductResponse> }) {
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
							<TableCell
								colSpan={allSupplyColumns.length}
								className="h-24 text-center"
							>
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={allSupplyColumns.length}>
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

function AllSupplySection({
	data,
	paginationMeta,
}: {
	data: InventoryProductResponse[];
	paginationMeta: Pagination;
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();
	const table = useReactTable({
		data,
		columns: allSupplyColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		onPaginationChange,
		state: {
			sorting: [],
			globalFilter: "",
			columnFilters: [],
			pagination,
		},
	});

	return <InventoryTable table={table} />;
}

type InventoryHistoryResponse = InventoryProductResponse & {
	supplyDate: string;
	supplier: string;
	supplyQuantity: number;
};

const inventoryHistoryColumnHelper =
	createColumnHelper<InventoryHistoryResponse>();

const inventoryHistoryColumns = [
	inventoryHistoryColumnHelper.display({
		header: "SKU",
		cell: (info) => <span className="font-mono text-xs">{info.row.original.sku}</span>,
	}),
	inventoryHistoryColumnHelper.accessor("name", {
		header: "Product",
		cell: (info) => <span className="text-foreground">{info.getValue()}</span>,
	}),
	inventoryHistoryColumnHelper.accessor("supplier", {
		header: "Vendor",
		cell: (info) => <span>{info.getValue()}</span>,
	}),
	inventoryHistoryColumnHelper.accessor("baseUnit", {
		header: "Unit",
		cell: (info) => <span>{info.getValue()}</span>,
	}),
	inventoryHistoryColumnHelper.accessor("supplyQuantity", {
		header: "Supply Quantity",
		cell: (info) => <span>{info.getValue()}</span>,
	}),
	inventoryHistoryColumnHelper.accessor("supplyDate", {
		header: "Supply Date",
		cell: (info) => (
			<span>{new Date(info.getValue()).toLocaleDateString()}</span>
		),
	}),
];

function InventoryHistoryTable({
	table,
}: {
	table: TableType<InventoryHistoryResponse>;
}) {
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
							<TableCell
								colSpan={inventoryHistoryColumns.length}
								className="h-24 text-center"
							>
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				<TableFooter>
					<TableRow>
						<TableCell colSpan={inventoryHistoryColumns.length}>
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

function InventHistorySection({
	data,
	paginationMeta,
}: {
	data: InventoryHistoryResponse[];
	paginationMeta: Pagination;
}) {
	const [pagination, onPaginationChange] = usePaginationSearchParams();
	const table = useReactTable({
		data,
		columns: inventoryHistoryColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		onPaginationChange,
		state: {
			sorting: [],
			globalFilter: "",
			columnFilters: [],
			pagination,
		},
	});

	return <InventoryHistoryTable table={table} />;
}

export function SingleInventoryPage({
	data,
	paginationMeta,
}: {
	data: InventoryProductResponse[];
	paginationMeta: Pagination;
}) {
	const searchParams = useSearchParams();
	const currentSection = searchParams.get("section") || "all";

	return (
		<div className="h-full w-full p-4 space-y-2 md:space-y-4">
			<Link
				href={"/dashboard/inventory"}
				className="inline-flex items-center gap-x-1 px-3 py-1.5 border-2 border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
			>
				<ArrowLeftIcon className="size-4" />
				<span>Back</span>
			</Link>

			<ListToolbar />
			{currentSection === "all" ? (
				<AllSupplySection data={data} paginationMeta={paginationMeta} />
			) : (
				<InventHistorySection
					data={data as InventoryHistoryResponse[]}
					paginationMeta={paginationMeta}
				/>
			)}
		</div>
	);
}
