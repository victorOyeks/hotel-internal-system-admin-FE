import { StockTakePage } from "@/components/roles/inventory/stock-take-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	...paginationSearchParams,
	productSearch: parseAsString,
	locationSearch: parseAsString,
	search: parseAsString.withDefault(""),
	status: parseAsString,
}, {
	urlKeys: {
		locationSearch: "location-list:search",
		productSearch: "product-list:search",
	}
});

export default function Page({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: stockTakes, ...paginationSchema } = use(qc.ensureQueryData({
		queryKey: ["stock-takes", query],
		queryFn: async () => {
			const res = await $fetch("@get/api/inventories/stock-takes", {
				auth: {
					token,
					type: "Bearer"
				},
				query: {
					page: query.page < 1 ? query.page : query.page - 1,
					size: query.size,
					search: query.search,
					status: query.status as any,
				},
				throw: true,
			})
			return res.data;
		},
	}))

	const locations = use(qc.ensureQueryData({
		queryKey: ["locations", query],
		queryFn: async () => {
			const res = await $fetch("@get/api/inventories/locations/list", {
				auth: {
					token,
					type: "Bearer"
				},
				query: {
					search: query.locationSearch
				},
				throw: true,
			})
			return res.data;
		},
	}))

	const products = use(qc.ensureQueryData({
		queryKey: ["products", query],
		queryFn: async () => {
			const res = await $fetch("@get/api/inventories/products/list", {
				auth: {
					token,
					type: "Bearer"
				},
				query: {
					search: query.productSearch
				},
				throw: true,
			})
			return res.data;
		},
	}))

	console.log(products)

	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				breadcrumbs: [],
				title: "Stock takes",
			}}
		>
			<StockTakePage stockTakes={stockTakes}
				products={products}
				stats={undefined}
				paginationSchema={paginationSchema}
				inventoryLocations={locations}
			/>
		</BreadCrumbWrapper>
	);
}
