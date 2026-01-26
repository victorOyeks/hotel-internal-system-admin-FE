import { StorageLocationPage } from "@/components/roles/inventory/storage-location-page";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader(
	{
		...paginationSearchParams,
		searchName: parseAsString,
	},
	{
		urlKeys: {
			searchName: "item:search",
		},
	},
)

function Page({ searchParams }: PageProps) {
	const query = use(loadSearchParams(searchParams));
	const { token } = use(getCookieData())!;
	const queryClient = getQueryClient();
	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["locations", query],
			queryFn: async () => {
				const response = await $fetch("@get/api/inventories/locations", {
					auth: { type: "Bearer", token },
					query: {
						page: query.page ? query.page - 1 : 0,
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
