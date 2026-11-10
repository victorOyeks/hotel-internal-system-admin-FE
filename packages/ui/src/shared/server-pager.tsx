"use client";

import { cn } from "@hospio/ui/utils";
import { DataTablePagination } from "./pagination";

/** The page facts a pager needs (a `Paged<T>` from the data seam fits). */
export type PageInfo = {
	/** 0-based. */
	page: number;
	size: number;
	total: number;
	totalPages?: number;
};

/** "Showing 26–48 of 48" for a page; "No rows" when nothing matches. */
export function showing(p: PageInfo): string {
	if (p.total === 0) return "No rows";
	const from = p.page * p.size + 1;
	// A page past the end (an old link, or rows gone since): say so rather than "Showing 26–9 of 9".
	if (from > p.total) return `Nothing on page ${p.page + 1} · ${p.total} in all`;
	const to = Math.min(p.total, (p.page + 1) * p.size);
	return `Showing ${from}–${to} of ${p.total}`;
}

/**
 * The footer of a server-paged list, as on the bar Sales screen: "Showing 26–48 of 48" and the page
 * numbers. `onPage` takes the 0-based page; `bare` drops the border and padding when a table wraps it.
 */
export function ServerPager({
	page,
	onPage,
	className,
	bare = false,
}: {
	page: PageInfo;
	onPage: (page: number) => void;
	className?: string;
	bare?: boolean;
}) {
	const pageCount =
		page.totalPages ?? Math.ceil(page.total / Math.max(1, page.size));
	return (
		<div
			data-slot="server-pager"
			className={cn(
				"flex items-center gap-3 text-xs text-ink-3",
				!bare && "border-t border-line px-4 py-[10px]",
				className,
			)}
		>
			<span className="flex-1" data-slot="server-pager-showing">
				{showing(page)}
			</span>
			<DataTablePagination
				pageIndex={page.page}
				pageCount={pageCount}
				canPreviousPage={page.page > 0}
				canNextPage={page.page + 1 < pageCount}
				previousPage={() => onPage(page.page - 1)}
				nextPage={() => onPage(page.page + 1)}
				setPageIndex={onPage}
			/>
		</div>
	);
}
