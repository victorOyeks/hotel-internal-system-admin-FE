import { SuppliesPage } from "@/components/roles/inventory/supplies-page";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

const breadcrumb = {
	title: "Supplies & Deliveries",
	breadcrumbs: [
		{ label: "Inventory", href: "/dashboard" },
		{ label: "Supplies & Deliveries", href: "/dashboard/supplies" },
	] satisfies Breadcrumb[],
};

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader(
	{
		productSearch: parseAsString,
		search: parseAsString,
		...paginationSearchParams,
	},
	{
		urlKeys: {
			productSearch: "product-list:search",
		},
	},
);

function Page({ searchParams }: PageProps) {
	const { productSearch, ...query } = use(loadSearchParams(searchParams));
	const { token } = use(getCookieData())!;
	const queryClient = getQueryClient();

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["supplies", query],
			queryFn: async () => {
				const response = await $fetch("@get/api/inventories/suppliers", {
					auth: { type: "Bearer", token },
					query: {
						...query,
						page: query.page ? query.page - 1 : 0,
					},
					throw: true,
				});
				return response.data;
			},
		}),
	);

	const { data: productsList } = use(
		queryClient.ensureQueryData({
			queryKey: ["products"],
			queryFn: async () => {
				const response = await $fetch("@get/api/inventories/products/list", {
					auth: { type: "Bearer", token },
					throw: true,
					query: {
						search: productSearch,
					},
				});
				return response;
			},
		}),
	);
	return (
		<SuppliesPage
			breadcrumb={breadcrumb}
			data={content}
			paginationMeta={paginationMeta}
			productsList={productsList}
		/>
	);
}

export default Page;
