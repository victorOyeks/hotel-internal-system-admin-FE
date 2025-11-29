import { SuppliesPage } from "@/components/roles/inventory/supplies-page";
import {
	$fetch,
	type InventoryDelivery,
	type InventorySuppliers,
} from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import {
	createLoader,
	parseAsStringLiteral,
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
	section: parseAsStringLiteral(["DELIVERY-HISTORY"]),
});

function Page({ searchParams }: PageProps) {
	const query = use(loadSearchParams(searchParams));
	const { token } = use(getCookieData())!;
	const queryClient = getQueryClient();

	const isDeliveryHistory = query.section === "DELIVERY-HISTORY";

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: [isDeliveryHistory ? "deliveries" : "supplies", query],
			queryFn: async () => {
				if (isDeliveryHistory) {
					const response = await $fetch("@get/api/inventories/deliveries", {
						auth: { type: "Bearer", token },
						query: {
							...query,
							page: query.page ? query.page - 1 : 0,
						},
						throw: true,
					});
					return response.data;
				}
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
			data={!isDeliveryHistory ? (content as InventorySuppliers[]) : []}
			paginationMeta={paginationMeta}
			deliveries={isDeliveryHistory ? (content as InventoryDelivery[]) : []}
			deliveriesPagination={isDeliveryHistory ? paginationMeta : undefined}
		/>
	);
}

export default Page;
