"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "../primitives/button";
import { useMemo } from "react";

// A constant for the ellipsis string
const DOTS = "...";

const generatePagination = (
	currentPage: number,
	totalPages: number,
	siblingCount = 1,
) => {
	// Total numbers to show: 1 (current) + 2*siblingCount + 1 (first) + 1 (last) + 2 (DOTS)
	const totalNumbers = siblingCount + 5;

	// Case 1: If the total pages is less than the numbers we want to show, return the full range.
	if (totalPages <= totalNumbers) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const leftSiblingIndex = Math.max(currentPage - siblingCount, 0);
	const rightSiblingIndex = Math.min(
		currentPage + siblingCount,
		totalPages - 1,
	);

	// We don't show dots if there is only one page number to be inserted between the extremes.
	const shouldShowLeftDots = leftSiblingIndex > 2;
	const shouldShowRightDots = rightSiblingIndex < totalPages - 3;

	const firstPageIndex = 1;
	const lastPageIndex = totalPages;

	// Case 2: No left dots to show, but right dots needed.
	if (!shouldShowLeftDots && shouldShowRightDots) {
		const leftItemCount = 3 + 2 * siblingCount;
		const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
		return [...leftRange, DOTS, totalPages];
	}

	// Case 3: No right dots to show, but left dots needed.
	if (shouldShowLeftDots && !shouldShowRightDots) {
		const rightItemCount = 3 + 2 * siblingCount;
		const rightRange = Array.from(
			{ length: rightItemCount },
			(_, i) => totalPages - rightItemCount + i + 1,
		);
		return [firstPageIndex, DOTS, ...rightRange];
	}

	// Case 4: Both left and right dots needed.
	if (shouldShowLeftDots && shouldShowRightDots) {
		const middleRange = Array.from(
			{ length: rightSiblingIndex - leftSiblingIndex + 1 },
			(_, i) => leftSiblingIndex + i + 1,
		);
		return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
	}

	// Default case (should not be reached with the logic above, but for safety)
	return Array.from({ length: totalPages }, (_, i) => i + 1);
};

// Your improved pagination component
export function DataTablePagination<T>(
	props:
		| { table: Table<T> }
		| {
				pageIndex: number;
				pageCount: number;
				nextPage: () => void;
				previousPage: () => void;
				canNextPage: boolean;
				canPreviousPage: boolean;
				setPageIndex?: (pageIndex: number) => void;
		  },
) {
	const table = "table" in props ? props.table : undefined;
	const pageIndex =
		"table" in props
			? props.table.getState().pagination.pageIndex
			: props.pageIndex;
	const pageCount =
		"table" in props ? props.table.getPageCount() : props.pageCount;

	const paginationRange = useMemo(
		() => generatePagination(pageIndex, pageCount),
		[pageIndex, pageCount],
	);

	if (pageCount <= 1) {
		return null;
	}

	return (
		<div className="flex items-center space-x-2">
			{/* Go to Previous Page */}
			<Button
				variant="outline"
				size="icon"
				className="h-6 w-6"
				disabled={
					table
						? !table.getCanPreviousPage()
						: !("canPreviousPage" in props ? props.canPreviousPage : false)
				}
				onClick={() => {
					if (table) {
						table.previousPage();
					} else if ("previousPage" in props) {
						props.previousPage();
					}
				}}
			>
				<ChevronLeftIcon className="h-4 w-4" />
			</Button>

			{/* Render Page Numbers and Ellipses */}
			{paginationRange.map((pageNumber, index) => {
				if (typeof pageNumber === "string") {
					return (
						<span
							key={`dots-${index}`}
							className="flex h-6 w-6 items-center justify-center text-xs"
						>
							{DOTS}
						</span>
					);
				}

				return (
					<Button
						key={pageNumber}
						variant={pageIndex === pageNumber - 1 ? "default" : "outline"}
						size="icon"
						className="h-6 w-6"
						// `pageNumber` is 1-indexed, `setPageIndex` is 0-indexed
						onClick={() => {
							if (table) {
								table.setPagination((old) => {
									return { ...old, pageIndex: pageNumber - 1 };
								});
							} else if ("setPageIndex" in props && props.setPageIndex) {
								props.setPageIndex(pageNumber - 1);
							}
						}}
					>
						{pageNumber}
					</Button>
				);
			})}

			{/* Go to Next Page */}
			<Button
				variant="outline"
				size="icon"
				className="h-6 w-6"
				disabled={
					table
						? !table.getCanNextPage()
						: !("canNextPage" in props ? props.canNextPage : false)
				}
				onClick={() => {
					if (table) {
						table.nextPage();
					} else if ("nextPage" in props) {
						props.nextPage();
					}
				}}
			>
				<ChevronRightIcon className="h-4 w-4" />
			</Button>
		</div>
	);
}
