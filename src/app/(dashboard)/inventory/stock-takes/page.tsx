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

	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				breadcrumbs: [],
				title: "Stock takes",
			}}
		>
			<StockTakePage stockTakes={[]} stats={{}} />
		</BreadCrumbWrapper>
	);
}
