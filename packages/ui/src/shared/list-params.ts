"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useMemo, useState, useTransition } from "react";

/**
 * A server-paged list's state in the URL: `page` (1-based; absent on the first page), `q`, `status`,
 * `from`, `to`, `sort` and any extra filters. A change re-renders the server page (`shallow: false`) so the
 * service reads the new page; any change other than the page itself starts again on page 1. Each change
 * is a history entry, so Back returns to the previous page or filters. `prefix` keeps two lists on one
 * screen apart (`refunds` → `?refundsPage=2&refundsQ=…`); the server side reads it with `listQueryFrom`.
 */
export function useListParams(
	options: { extra?: string[]; prefix?: string; debounceMs?: number } = {},
) {
	const { extra = [], prefix = "", debounceMs = 350 } = options;
	const [pending, startTransition] = useTransition();
	const names = ["q", "status", "from", "to", "sort", ...extra];
	const key = (k: string) =>
		prefix ? `${prefix}${k[0].toUpperCase()}${k.slice(1)}` : k;
	const parsers = useMemo(
		() => ({
			page: parseAsInteger,
			...Object.fromEntries(names.map((n) => [n, parseAsString])),
		}),
		[],
	) as { page: typeof parseAsInteger } & Record<string, typeof parseAsString>;
	const urlKeys = useMemo(
		() =>
			prefix
				? Object.fromEntries(["page", ...names].map((n) => [n, key(n)]))
				: undefined,
		[],
	);
	const [params, setRaw] = useQueryStates(parsers, {
		shallow: false,
		startTransition,
		history: "push",
		scroll: false,
		...(urlKeys ? { urlKeys } : {}),
	});
	const setParams = setRaw as unknown as (
		patch: Record<string, string | number | null>,
	) => Promise<URLSearchParams>;

	/** Set filters (null or "" removes one) and go back to page 1. */
	const set = (patch: Record<string, string | null | undefined>) =>
		void setParams({
			page: null,
			...Object.fromEntries(
				Object.entries(patch).map(([k, v]) => [k, v ? v : null]),
			),
		});

	/** Go to a 0-based page. */
	const goTo = (page: number) =>
		void setParams({ page: page <= 0 ? null : page + 1 });

	// The search box: typed text reaches the URL (and the server) once typing stops.
	const [search, setSearch] = useState(params.q ?? "");
	useEffect(() => {
		setSearch((s) => (s.trim() === (params.q ?? "") ? s : (params.q ?? "")));
	}, [params.q]);
	useEffect(() => {
		const q = search.trim();
		if (q === (params.q ?? "")) return;
		const t = setTimeout(
			() => void setParams({ q: q || null, page: null }),
			debounceMs,
		);
		return () => clearTimeout(t);
	}, [search, params.q, setParams, debounceMs]);

	const filterKeys = names.filter((n) => n !== "sort");
	const filtered = filterKeys.some((n) => !!params[n]);

	/** Clear every filter and the search (the page goes back to 1; the sort stays). */
	const clear = () => {
		setSearch("");
		void setParams({
			page: null,
			...Object.fromEntries(filterKeys.map((n) => [n, null])),
		});
	};

	return {
		params: params as Record<string, string | null> & { page: number | null },
		/** The current 0-based page. */
		page: Math.max(0, (params.page ?? 1) - 1),
		set,
		goTo,
		search,
		setSearch,
		filtered,
		clear,
		pending,
		sort: params.sort ?? null,
		setSort: (sort: string | null) => set({ sort }),
	};
}
