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
