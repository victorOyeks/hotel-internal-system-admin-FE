import { StockTakePage } from "@/components/roles/inventory/stock-take-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	...paginationSearchParams,
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
				query,
				throw: true,
			})
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
			<StockTakePage stockTakes={stockTakes} stats={{}} />
		</BreadCrumbWrapper>
	);
}
