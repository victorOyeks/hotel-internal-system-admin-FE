import "server-only";

import { parseAsString } from "nuqs/server";
import { paginationSearchParams } from "./nuqs.server";

export const financialSearchParams = {
	startDate: parseAsString,
	endDate: parseAsString,
	period: parseAsString,
	search: parseAsString,
	category: parseAsString,
	status: parseAsString,
	...paginationSearchParams,
};

export const compareSearchParams = {
	period1Start: parseAsString,
	period1End: parseAsString,
	period2Start: parseAsString,
	period2End: parseAsString,
};
