"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { ActionResult } from "@hospio/api/actions";

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

/**
 * The page in the URL: 1-based for people (`?page=2` is the second page, none on the first), 0-based in
 * and out of this hook like the services. Each page is a history entry, so Back goes to the previous one.
 */
export function usePageParam() {
	const [page, setPage] = useQueryState(
		"page",
		parseAsInteger.withOptions({
			shallow: false,
			history: "push",
			scroll: false,
		}),
	);
	return [
		Math.max(0, (page ?? 1) - 1),
		(p: number) => void setPage(p <= 0 ? null : p + 1),
	] as const;
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

/** The shared server pager ("Showing 26–48 of 48" and page numbers); DataTable's `server` mode uses it too. */
export { ServerPager } from "@hospio/ui/shared/server-pager";

export {
	monthOptions,
	pageParam,
	param,
	type SearchParams,
	thisMonth,
} from "./params";
