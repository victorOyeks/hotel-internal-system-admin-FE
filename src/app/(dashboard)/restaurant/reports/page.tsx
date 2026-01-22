import { KitchenSalesReportPage } from "@/components/roles/kitchen/sales-report";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

const loadSearchParams = createLoader({
	...paginationSearchParams,
	search: parseAsString,
	startDate: parseAsString,
	endDate: parseAsString,
});

type PageProps = {
	searchParams: Promise<SearchParams>;
};

function Page({ searchParams }: PageProps) {
	const queryClient = getQueryClient();
	const cookieData = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));

	const { content: data, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["restaurants", "kitchen", "sales-reports"],
			queryFn: async () => {
				const data = await $fetch("@get/api/restaurants/bar-sales", {
					auth: { type: "Bearer", token: cookieData.token },
					query: {
						...query,
						page: query.page ? query.page - 1 : 0,
					},
					throw: true,
				});

				return data.data;
			},
		}),
	);

	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				title: "Sales Reports",
				breadcrumbs: [
					{
						label: "Dashboard",
						href: "/dashboard",
					},
					{
						label: "Reports",
						href: "/dashboard/reports",
					},
				],
			}}
		>
			<KitchenSalesReportPage data={data} paginationMeta={paginationMeta} />
		</BreadCrumbWrapper>
	);
}

export default Page;
