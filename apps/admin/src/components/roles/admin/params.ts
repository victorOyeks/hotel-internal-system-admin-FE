/**
 * Server-safe helpers for the admin pages: reading search params and month values. Kept out of
 * live.tsx (a client module) so server components can call them.
 */

export type SearchParams = Promise<
	Record<string, string | string[] | undefined>
>;

/** Reads a search param as a string, or undefined when missing. */
export function param(
	sp: Record<string, string | string[] | undefined>,
	key: string,
): string | undefined {
	const v = sp[key];
	return Array.isArray(v) ? v[0] : v || undefined;
}

export function pageParam(sp: Record<string, string | string[] | undefined>) {
	const v = Number(param(sp, "page") ?? 0);
	return Number.isFinite(v) && v > 0 ? v : 0;
}

/** "2026-11" for the current month. */
export function thisMonth() {
	return new Date().toISOString().slice(0, 7);
}

/** The last `count` months as select options, newest first. */
export function monthOptions(count = 12) {
	const out: { value: string; label: string }[] = [];
	const d = new Date();
	d.setDate(1);
	for (let i = 0; i < count; i++) {
		const value = d.toISOString().slice(0, 7);
		out.push({
			value,
			label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
		});
		d.setMonth(d.getMonth() - 1);
	}
	return out;
}
