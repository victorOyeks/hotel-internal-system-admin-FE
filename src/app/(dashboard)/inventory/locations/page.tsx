import { StorageLocationPage } from "@/components/roles/inventory/storage-location-page";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsBoolean, parseAsFloat, parseAsString, parseAsStringEnum, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader(
	{
		...paginationSearchParams,
		search: parseAsString,
		type: parseAsString,
		temperature: parseAsFloat,
		locationType: parseAsStringEnum([
			"MAIN_WAREHOUSE",
			"KITCHEN_STORE",
			"BAR_STORE",
			"HOUSEKEEPING_STORE",
			"MAINTENANCE_STORE",
			"OFFICE_STORE",
			"COLD_STORAGE",
			"FREEZER",
			"DRY_STORE",
			"CELLAR",
			"EXTERNAL_WAREHOUSE",
			"MOBILE_STORAGE",
			"OTHER",
		]),
		active: parseAsBoolean,
		temperatureControlled: parseAsBoolean,
	}
)

function Page({ searchParams }: PageProps) {
	const { page, ...query } = use(loadSearchParams(searchParams));
	const { token } = use(getCookieData())!;
	const queryClient = getQueryClient();
	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["locations", query],
			queryFn: async () => {
				const response = await $fetch("@get/api/inventories/locations", {
					auth: { type: "Bearer", token },
					//@ts-expect-error
					query: {
						...query,
						page: page < 1 ? page : page - 1,
					},
					throw: true,
				});

				return response.data;
			},
		}),
	);
	return <StorageLocationPage locations={content} paginationMeta={paginationMeta} />;
}

export default Page;
