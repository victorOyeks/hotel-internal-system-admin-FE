/**
 * Server-side paging, shared by every growing list (hospio-backend/docs/pagination.md). The service takes
 * `page` (from 0), `size` (1 to 100, 25 by default), `sort` (`field` or `field,asc|desc`) and the list's
 * filters, and answers a PagedResponse; some lists add `counts` (tab counts) and `totals` (money) over the
 * whole filtered range. The URL counts pages from 1 (none on the first page) so links read naturally.
 */

export const PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

/** One page of a list as the screens read it. */
export type Paged<T> = {
	content: T[];
	/** 0-based. */
	page: number;
	size: number;
	/** Rows matching the filters, over every page. */
	total: number;
	totalPages: number;
	/** Tab counts over the whole filtered range (e.g. per status), when the list has tabs. */
	counts?: Record<string, number>;
	/** Money over the whole filtered range, in naira. */
	totals?: Record<string, number>;
};

/** What a screen asks a list for: the page, the sort and its filters (blank ones are left out). */
export type ListQuery = {
	page?: number;
	size?: number;
	sort?: string;
	q?: string;
	status?: string;
	from?: string;
	to?: string;
} & Record<string, string | number | boolean | undefined | null>;

export const emptyPage = <T>(size = PAGE_SIZE): Paged<T> => ({
	content: [],
	page: 0,
	size,
	total: 0,
	totalPages: 0,
});

/** The query string for a list: page (0-based), size (25 unless given) and every non-blank filter. */
export function pageQuery(
	q: ListQuery = {},
): Record<string, string | number | boolean> {
	const out: Record<string, string | number | boolean> = {
		page: Math.max(0, q.page ?? 0),
		size: q.size ?? PAGE_SIZE,
	};
	for (const [k, v] of Object.entries(q)) {
		if (k === "page" || k === "size") continue;
		if (v === undefined || v === null || v === "") continue;
		out[k] = typeof v === "string" ? v.trim() : v;
	}
	return out;
}

type Wire<A> = {
	content: A[];
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
	counts?: Record<string, number | string> | null;
	totals?: Record<string, number | string> | null;
};

const numbers = (r?: Record<string, number | string> | null) =>
	r
		? Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Number(v)]))
		: undefined;

/** A PagedResponse (or PageWithCounts) from a service as a Paged of screen rows. */
export function toPaged<A, B>(p: Wire<A>, map: (a: A) => B): Paged<B> {
	return {
		content: p.content.map(map),
		page: p.number,
		size: p.size,
		total: p.totalElements,
		totalPages: p.totalPages,
		counts: numbers(p.counts),
		totals: numbers(p.totals),
	};
}

/** A page cut from an array (demo mode, or a short list), so paged screens behave the same everywhere. */
export function slicePage<T>(
	rows: T[],
	page = 0,
	size = PAGE_SIZE,
	extra: Pick<Paged<T>, "counts" | "totals"> = {},
): Paged<T> {
	return {
		content: rows.slice(page * size, page * size + size),
		page,
		size,
		total: rows.length,
		totalPages: Math.ceil(rows.length / size),
		...extra,
	};
}

/**
 * Every row of a filtered list, read 100 at a time (exports and the few summaries that need the whole range).
 * Stops at `limit` rows; `truncated` says whether it did.
 */
export async function allPages<T>(
	fetchPage: (page: number, size: number) => Promise<Paged<T> | null>,
	limit = 5000,
): Promise<{ rows: T[]; total: number; truncated: boolean; ok: boolean }> {
	const first = await fetchPage(0, MAX_PAGE_SIZE);
	if (!first) return { rows: [], total: 0, truncated: false, ok: false };
	const pages = Math.min(first.totalPages, Math.ceil(limit / MAX_PAGE_SIZE));
	const rest = await Promise.all(
		Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
			fetchPage(i + 1, MAX_PAGE_SIZE),
		),
	);
	if (rest.some((p) => !p))
		return { rows: [], total: first.total, truncated: false, ok: false };
	const rows = [first, ...(rest as Paged<T>[])].flatMap((p) => p.content);
	return {
		rows: rows.slice(0, limit),
		total: first.total,
		truncated: first.total > limit,
		ok: true,
	};
}

// ---- the URL ----------------------------------------------------------------------------------------

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) =>
	(Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** A search param as a trimmed string, or undefined. */
export const urlParam = (sp: SearchParamsRecord, key: string) => one(sp[key]);

/** A yyyy-MM-dd search param, or undefined. */
export const urlDay = (sp: SearchParamsRecord, key: string) => {
	const s = one(sp[key]);
	return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
};

/** The 0-based page from the URL's 1-based `page` (absent or 1 is the first page). */
export function urlPage(sp: SearchParamsRecord, key = "page"): number {
	const n = Number(one(sp[key]));
	return Number.isInteger(n) && n > 1 ? n - 1 : 0;
}

/**
 * A list's query from the URL: `page`, `q`, `status`, `from`, `to`, `sort` plus the named extra filters.
 * `prefix` keeps two lists on one screen apart (`?refundsPage=2`).
 */
export function listQueryFrom(
	sp: SearchParamsRecord,
	extra: string[] = [],
	prefix = "",
): ListQuery {
	const key = (k: string) =>
		prefix ? `${prefix}${k[0].toUpperCase()}${k.slice(1)}` : k;
	const q: ListQuery = {
		page: urlPage(sp, key("page")),
		q: one(sp[key("q")]),
		status: one(sp[key("status")]),
		from: urlDay(sp, key("from")),
		to: urlDay(sp, key("to")),
		sort: one(sp[key("sort")]),
	};
	for (const k of extra) q[k] = one(sp[key(k)]);
	return q;
}
