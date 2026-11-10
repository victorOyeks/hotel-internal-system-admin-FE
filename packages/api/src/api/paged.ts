import { z } from "zod";

/**
 * A service's PagedResponse (or PageWithCounts: the same plus tab `counts` and money `totals` over the
 * whole filtered range). hospio-backend/docs/pagination.md is the contract.
 */
export const pagedOf = <T extends z.ZodTypeAny>(item: T) =>
	z.object({
		content: z.array(item),
		number: z.number(),
		size: z.number(),
		totalElements: z.number(),
		totalPages: z.number(),
		first: z.boolean().optional(),
		last: z.boolean().optional(),
		empty: z.boolean().optional(),
		counts: z.record(z.string(), z.number()).nullish(),
		totals: z.record(z.string(), z.union([z.number(), z.string()])).nullish(),
	});

/** The query every paged list takes, plus its own filters. */
export const pageParams = z.looseObject({
	page: z.number().optional(),
	size: z.number().optional(),
	sort: z.string().optional(),
	q: z.string().optional(),
	status: z.string().optional(),
	from: z.string().optional(),
	to: z.string().optional(),
});
