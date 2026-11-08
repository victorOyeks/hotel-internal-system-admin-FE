import { parseAsInteger, createLoader } from "nuqs/server";

export const paginationSearchParams = {
	page: parseAsInteger.withDefault(0),
	size: parseAsInteger.withDefault(20),
};

export const loadPaginationSearchParams = createLoader(paginationSearchParams);
