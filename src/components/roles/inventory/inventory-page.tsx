"use client";

import { TableFilter } from "@/components/shared/table-filter";
import { Button } from "@/components/ui/button";

import type {
	InventoryProductResponse,
	InventoryRestockRequest,
	Pagination,
} from "@/lib/fetch";
import { type Breadcrumb, breadcrumbAtom } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useSetAtom } from "jotai";
import { SearchIcon } from "lucide-react";
import {
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
	type ParserBuilder,
	type SetValues,
	useQueryStates,
	type Values,
} from "nuqs";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RotateCcwIcon, XIcon } from "lucide-react";
import { AllItemsTable } from "./all-items-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { IssuedItemsTable } from "./issued-items";
import { RestockRequestTable } from "./restock-request";

type SectionType = "issued" | "stock-request" | null;

const InventoryFilter = ({
	queryState,
	setQueryState,
}: {
	queryState: {
		section: "issued" | "stock-request" | null;
		page: number | null;
		searchName: string | null;
		category: string | null;
		availability: string | null;
		department: string | null;
	};
	setQueryState: (state: Partial<typeof queryState>) => void;
}) => {
	const [tempFilters, setTempFilters] = useState({
		category: queryState.category || null,
		availability: queryState.availability || null,
		department: queryState.department || null,
	});

	// Memoized callback functions to prevent unnecessary re-renders
	const applyFilters = useCallback(() => {
		setQueryState({
			...queryState,
			category: tempFilters.category,
			availability: tempFilters.availability,
			department: tempFilters.department,
		});
	}, [queryState, tempFilters, setQueryState]);

	const clearFilters = useCallback(() => {
		const clearedFilters = {
			category: null,
			availability: null,
			department: null,
		};
		setTempFilters(clearedFilters);
		setQueryState({
			section: queryState.section,
			page: queryState.page,
			searchName: queryState.searchName,
			category: null,
			availability: null,
			department: null,
		});
	}, [
		queryState.section,
		queryState.page,
		queryState.searchName,
		setQueryState,
	]);

	// Memoize filter state computations
	const filterStates = useMemo(() => {
		const hasActiveFilters = !!(
			tempFilters.category ||
			tempFilters.availability ||
			tempFilters.department
		);
		const hasAppliedFilters = !!(
			queryState.category ||
			queryState.availability ||
			queryState.department
		);
		const appliedFiltersCount = [
			queryState.category,
			queryState.availability,
			queryState.department,
		].filter(Boolean).length;

		return {
			hasActiveFilters,
			hasAppliedFilters,
			appliedFiltersCount,
		};
	}, [
		tempFilters,
		queryState.category,
		queryState.availability,
		queryState.department,
	]);

	const categoryOptions = useMemo(
		() => [
			{ value: "ELECTRONICS", label: "Electronics" },
			{ value: "FURNITURE", label: "Furniture" },
			{ value: "CLEANING", label: "Cleaning Supplies" },
			{ value: "KITCHEN", label: "Kitchen" },
			{ value: "OFFICE", label: "Office Supplies" },
			{ value: "MAINTENANCE", label: "Maintenance" },
		],
		[],
	);

	const availabilityOptions = useMemo(
		() => [
			{ value: "IN_STOCK", label: "In Stock" },
			{ value: "OUT_OF_STOCK", label: "Out of Stock" },
			{ value: "LOW_STOCK", label: "Low Stock" },
		],
		[],
	);

	const departmentOptions = useMemo(
		() => [
			{ value: "HOUSEKEEPING", label: "Housekeeping" },
			{ value: "FRONT_DESK", label: "Front Desk" },
			{ value: "KITCHEN", label: "Kitchen" },
			{ value: "MAINTENANCE", label: "Maintenance" },
			{ value: "MANAGEMENT", label: "Management" },
		],
		[],
	);

	return (
		<div className="space-y-4 w-80">
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

			{/* Category Filter */}
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

			{/* Availability Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Availability</Label>
				<Select
					value={tempFilters.availability || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							availability: value === "all" ? null : value,
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Availability" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Availability</SelectItem>
						{availabilityOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Department Filter */}
			<div className="space-y-2">
				<Label className="text-sm font-medium">Department</Label>
				<Select
					value={tempFilters.department || "all"}
					onValueChange={(value) =>
						setTempFilters({
							...tempFilters,
							department: value === "all" ? null : value,
						})
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Departments" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Departments</SelectItem>
						{departmentOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Filter Summary */}
			{filterStates.hasActiveFilters && (
				<div className="pt-2 border-t">
					<p className="text-xs text-muted-foreground mb-2">Active filters:</p>
					<div className="flex flex-wrap gap-1">
						{tempFilters.category && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs">
								Category:{" "}
								{
									categoryOptions.find((c) => c.value === tempFilters.category)
										?.label
								}
							</span>
						)}
						{tempFilters.availability && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs">
								Availability:{" "}
								{
									availabilityOptions.find(
										(a) => a.value === tempFilters.availability,
									)?.label
								}
							</span>
						)}
						{tempFilters.department && (
							<span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs">
								Department:{" "}
								{
									departmentOptions.find(
										(d) => d.value === tempFilters.department,
									)?.label
								}
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

function InventoryTableToolbar({
	currentSection,
	query,
	setQuery,
}: {
	currentSection: SectionType;
	query: Values<{
		section: ParserBuilder<"issued" | "stock-request">;
		page: ParserBuilder<number>;
		searchName: ParserBuilder<string>;
		category: ParserBuilder<string>;
		availability: ParserBuilder<string>;
		department: ParserBuilder<string>;
	}>;
	setQuery: SetValues<{
		section: ParserBuilder<"issued" | "stock-request">;
		page: ParserBuilder<number>;
		searchName: ParserBuilder<string>;
		category: ParserBuilder<string>;
		availability: ParserBuilder<string>;
		department: ParserBuilder<string>;
	}>;
}) {
	const resetToSection = (section: SectionType) => {
		setQuery({
			section,
			page: null,
			searchName: null,
			category: null,
			availability: null,
			department: null,
		});
	};
	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div className="flex items-center gap-x-2">
				<Button
					variant={"outline"}
					className={cn(
						"rounded-full shadow-none border-none",
						currentSection === null
							? "bg-primary-5/20 text-primary"
							: "bg-gray-100",
					)}
					size={"sm"}
					onClick={() => {
						currentSection !== null && resetToSection(null);
					}}
				>
					All Items
				</Button>
				<Button
					variant={"outline"}
					className={cn("rounded-full shadow-none border-none", {
						"bg-primary-5/20 text-primary": currentSection === "issued",
						"bg-gray-100": currentSection !== "issued",
					})}
					size={"sm"}
					onClick={() => {
						currentSection !== "issued" && resetToSection("issued");
					}}
				>
					Issued Items
				</Button>

				<Button
					variant={"outline"}
					className={cn("rounded-full shadow-none border-none", {
						"bg-primary-5/20 text-primary": currentSection === "stock-request",
						"bg-gray-100": currentSection !== "stock-request",
					})}
					size={"sm"}
					onClick={() => {
						currentSection !== "stock-request" &&
							resetToSection("stock-request");
					}}
				>
					Stock Requests
				</Button>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search"
						value={query.searchName ?? ""}
						onChange={(e) =>
							setQuery((prev) => ({
								...prev,
								searchName: e.target.value || null,
							}))
						}
						className="w-full pl-9 py-2 bg-primary-5/10 text-primary-1 placeholder:text-sm md:placeholder:text-base placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>
				<div className="flex items-center gap-2">
					<TableFilter>
						<InventoryFilter queryState={query} setQueryState={setQuery} />
					</TableFilter>

					{/* Applied Filters Display */}
					{(query.category || query.availability || query.department) && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{query.category && (
								<div className="flex items-center gap-1">
									<span>Category:</span>
									<span className="bg-secondary px-2 py-1 rounded-md font-medium">
										{query.category}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQuery({ category: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</div>
							)}
							{query.availability && (
								<div className="flex items-center gap-1">
									<span>Availability:</span>
									<span className="bg-secondary px-2 py-1 rounded-md font-medium">
										{query.availability}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQuery({ availability: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</div>
							)}
							{query.department && (
								<div className="flex items-center gap-1">
									<span>Department:</span>
									<span className="bg-secondary px-2 py-1 rounded-md font-medium">
										{query.department}
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
										onClick={() => setQuery({ department: null })}
									>
										<XIcon className="h-3 w-3" />
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function InventoryOfficerInventoryTable({
	data,
	serverSection,
	paginationMeta,
}: {
	data: InventoryProductResponse[] | InventoryRestockRequest[];
	paginationMeta: Pagination;
	serverSection: SectionType;
}) {
	const [query, setQuery] = useQueryStates({
		section: parseAsStringLiteral(["issued", "stock-request"]),
		page: parseAsInteger,
		searchName: parseAsString,
		category: parseAsString,
		availability: parseAsString,
		department: parseAsString,
	});

	// pending state for reconciling client and server section
	const isPending = useMemo(() => {
		return query.section !== serverSection;
	}, [query.section, serverSection]);

	const renderedSection = useMemo(() => {
		if (isPending) {
			return (
				<Table>
					<TableHeader className="bg-gray-100">
						<TableRow>
							{Array.from({ length: 6 }).map((_, index) => (
								<TableHead key={index} className="text-gray-500">
									<Skeleton className="h-4 w-20 animate-pulse" />
								</TableHead>
							))}
						</TableRow>
					</TableHeader>

					<TableBody>
						{Array.from({
							length:
								// use existing data length or 5 rows as placeholder
								data.length > 0 ? data.length : 5,
						}).map((_, rowIndex) => (
							<TableRow
								key={rowIndex}
								className="cursor-pointer hover:bg-gray-50"
							>
								{Array.from({
									length: 6,
								}).map((_, cellIndex) => (
									<TableCell key={cellIndex} className="text-gray-600">
										<Skeleton className="h-4 w-full animate-pulse" />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			);
		}

		switch (query.section) {
			case "issued": {
				return (
					<IssuedItemsTable
						data={data as InventoryProductResponse[]}
						paginationMeta={paginationMeta}
					/>
				);
			}
			case "stock-request": {
				return (
					<RestockRequestTable
						data={data as InventoryRestockRequest[]}
						paginationMeta={paginationMeta}
					/>
				);
			}
			default: {
				return (
					<AllItemsTable
						data={data as InventoryProductResponse[]}
						paginationMeta={paginationMeta}
					/>
				);
			}
		}
	}, [query, data, isPending, paginationMeta]);

	return (
		<div className="space-y-4">
			<InventoryTableToolbar
				currentSection={serverSection}
				query={query}
				setQuery={setQuery}
			/>
			{renderedSection}
		</div>
	);
}

export function InventoryOfficerInventoryPage({
	section,
	breadcrumb,
	data,
	paginationMeta,
}: {
	section: SectionType;
	breadcrumb: {
		title: string;
		breadcrumbs: Breadcrumb[];
	};
	data: InventoryProductResponse[] | InventoryRestockRequest[];
	paginationMeta: Pagination;
}) {
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	// const [successDialogOpen, setSuccessDialogOpen] = useAtom(successDialogAtom);

	useEffect(() => {
		setBreadcrumb(breadcrumb);
		return () => setBreadcrumb(null);
	}, [setBreadcrumb, breadcrumb]);

	return (
		<InventoryOfficerInventoryTable
			serverSection={section}
			data={data}
			paginationMeta={paginationMeta}
		/>
	);
}
