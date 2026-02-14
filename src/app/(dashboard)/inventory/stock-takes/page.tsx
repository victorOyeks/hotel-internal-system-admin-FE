import { StockTakePage } from "@/components/roles/inventory/stock-take-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { getStockTakes, getStorageLocations } from "@/lib/inventory-actions";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
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
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: stockTakes, ...paginationSchema } = use(qc.ensureQueryData({
		queryKey: ["stock-takes", query],
		queryFn: async () => {
			const res = await getStockTakes({
				page: query.page < 1 ? query.page : query.page - 1,
				size: query.size,
				search: query.search || undefined,
				status: query.status as any,
			});
			if (!res.success || !res.data) throw new Error(res.error || "Failed to fetch stock takes");
			return res.data;
		},
	}))

	const locations = use(qc.ensureQueryData({
		queryKey: ["locations", query],
		queryFn: async () => {
			// Using existing server action or fetch if getStorageLocations signature matches
			// getStorageLocations takes (search?: string)
			const res = await getStorageLocations(query.locationSearch || undefined);
			if (!res.success || !res.data) throw new Error(res.error || "Failed to fetch locations");
			return res.data;
		},
	}))

	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				breadcrumbs: [],
				title: "Stock takes",
			}}
		>
			<StockTakePage stockTakes={stockTakes || []}
				stats={undefined}
				paginationSchema={paginationSchema}
				inventoryLocations={locations || []}
			/>
		</BreadCrumbWrapper>
	);
}
