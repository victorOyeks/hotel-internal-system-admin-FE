import { SuppliesPage } from "@/components/roles/inventory/supplies-page";
import {
	$fetch,
} from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import {
	createLoader,
	type SearchParams,
} from "nuqs/server";
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

const loadSearchParams = createLoader({
	...paginationSearchParams,
});

function Page({ searchParams }: PageProps) {
	const query = use(loadSearchParams(searchParams));
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
	return (
		<SuppliesPage
			breadcrumb={breadcrumb}
			data={content}
			paginationMeta={paginationMeta}
		/>
	);
}

export default Page;
