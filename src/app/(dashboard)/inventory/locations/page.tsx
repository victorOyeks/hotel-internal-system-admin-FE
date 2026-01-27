import { StorageLocationPage } from "@/components/roles/inventory/storage-location-page";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsFloat, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader(
	{
		...paginationSearchParams,
		searchName: parseAsString,
		type: parseAsString,
		temperature: parseAsFloat,
	},
	{
		urlKeys: {
			searchName: "item:search",
		},
	},
)

function Page({ searchParams }: PageProps) {
	const { searchName, type, temperature } = use(loadSearchParams(searchParams));
	const { token } = use(getCookieData())!;
	const queryClient = getQueryClient();
	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["locations", searchName, type, temperature],
			queryFn: async () => {
				const response = await $fetch("@get/api/inventories/locations", {
					auth: { type: "Bearer", token },
					query: {
						page: 0,
						search: searchName || "",
						type: (type) || undefined,
						temperature: (temperature) || undefined,
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
