"use client";

import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { ActionResult } from "@hospio/api/actions";
import type { Paged } from "@hospio/api/data/admin-types";
import { cn } from "@hospio/ui/utils";

/**
 * Small pieces the live admin screens share: filters kept in the URL so the server component
 * re-reads the list (`shallow: false`), a pager for server-paged lists, a refresh after a write, and
 * a loader for details fetched through a server action.
 */

/** A filter in the URL that re-runs the page's data fetch when it changes; empty removes it. */
export function useFilterParam(key: string) {
	const [value, setValue] = useQueryState(key, { shallow: false });
	const set = useCallback(
		(v: string | null | undefined) => void setValue(v ? v : null),
		[setValue],
	);
	return [value ?? "", set] as const;
}

/** The page number in the URL (0-based on the server, 1-based for people). */
export function usePageParam() {
	const [page, setPage] = useQueryState(
		"page",
		parseAsInteger.withDefault(0).withOptions({ shallow: false }),
	);
	return [page, (p: number) => void setPage(p <= 0 ? null : p)] as const;
}

/** Re-reads the server components after a write landed, with a pending flag for the button. */
export function useRefresh() {
	const router = useRouter();
	const [pending, start] = useTransition();
	return { refresh: () => start(() => router.refresh()), pending };
}

/** Loads a detail through a server action whenever `id` changes. */
export function useLoaded<T>(
	id: string | null | undefined,
	load: (id: string) => Promise<ActionResult<T>>,
	deps: unknown[] = [],
) {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [tick, setTick] = useState(0);
	useEffect(() => {
		if (!id) {
			setData(null);
			setError(null);
			return;
		}
		let alive = true;
		setLoading(true);
		load(id).then((r) => {
			if (!alive) return;
			if (r.ok) {
				setData(r.data);
				setError(null);
			} else {
				setData(null);
				setError(r.error);
			}
			setLoading(false);
		});
		return () => {
			alive = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, tick, ...deps]);
	return { data, setData, loading, error, reload: () => setTick((t) => t + 1) };
}

export function Loading({ label = "Loading…" }: { label?: string }) {
	return (
		<p className="flex items-center gap-2 py-6 text-sm text-ink-3">
			<Loader2Icon className="size-4 animate-spin" /> {label}
		</p>
	);
}

/** Footer for a server-paged list: "Showing 1–25 of 212" with previous/next. */
export function ServerPager<T>({
	page,
	onPage,
	className,
}: {
	page: Paged<T>;
	onPage: (p: number) => void;
	className?: string;
}) {
	const from = page.total === 0 ? 0 : page.page * page.size + 1;
	const to = Math.min(page.total, (page.page + 1) * page.size);
	return (
		<div
			className={cn("flex items-center gap-3 text-xs text-ink-3", className)}
		>
			<span className="flex-1">
				{page.total === 0
					? "No rows"
					: `Showing ${from}–${to} of ${page.total}`}
			</span>
			{page.totalPages > 1 && (
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => onPage(page.page - 1)}
						disabled={page.page <= 0}
						className="flex size-7 items-center justify-center rounded-md border border-line text-ink-2 hover:bg-subtle disabled:opacity-40"
						aria-label="Previous page"
					>
						<ChevronLeftIcon className="size-4" />
					</button>
					<span className="px-2 font-medium text-ink-2">
						{page.page + 1} / {page.totalPages}
					</span>
					<button
						type="button"
						onClick={() => onPage(page.page + 1)}
						disabled={page.page + 1 >= page.totalPages}
						className="flex size-7 items-center justify-center rounded-md border border-line text-ink-2 hover:bg-subtle disabled:opacity-40"
						aria-label="Next page"
					>
						<ChevronRightIcon className="size-4" />
					</button>
				</div>
			)}
		</div>
	);
}

export {
	monthOptions,
	pageParam,
	param,
	type SearchParams,
	thisMonth,
} from "./params";
