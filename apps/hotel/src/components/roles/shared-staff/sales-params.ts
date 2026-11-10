import type { SaleFilters } from "@hospio/api/data/types";

/** The Sales screen's URL (`?from=&to=&status=&method=&attendant=&outlet=&q=&mine=&page=`) as the filters the data seam reads. */
export type SalesSearchParams = Promise<
	Record<string, string | string[] | undefined>
>;

const one = (v: string | string[] | undefined) =>
	(Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const day = (v: string | string[] | undefined) => {
	const s = one(v);
	return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
};

export async function salesFilters(
	searchParams: SalesSearchParams,
	desk?: "BAR" | "KITCHEN",
): Promise<SaleFilters> {
	const p = await searchParams;
	const mine = one(p.mine);
	const page = Number(one(p.page));
	return {
		from: day(p.from),
		to: day(p.to),
		status: one(p.status),
		method: one(p.method),
		attendant: one(p.attendant),
		outletId: one(p.outlet),
		q: one(p.q),
		mine: mine === "true" ? true : mine === "false" ? false : undefined,
		page: Number.isInteger(page) && page > 0 ? page : undefined,
		desk,
	};
}
