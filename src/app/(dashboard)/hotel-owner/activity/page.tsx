import { ManagerActivityLogPage } from "@/components/roles/manager/activity-log";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import {
	createLoader,
	parseAsIsoDateTime,
	parseAsString,
	type SearchParams,
} from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	...paginationSearchParams,
	search: parseAsString,
	startDate: parseAsIsoDateTime,
	endDate: parseAsIsoDateTime,
});

function Page({ searchParams }: PageProps) {
	const breadcrumbs = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Activity Log", href: "/dashboard/activity" },
	];

	const query = use(loadSearchParams(searchParams));
	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["log", query],
			queryFn: async () => {
				const response = await $fetch("@get/api/hotel-owners/logs", {
					auth: {
						type: "Bearer",
						token: cookieData.token,
					},
					query: {
						...query,
						endDate: query.endDate ? query.endDate.toISOString() : undefined,
						startDate: query.startDate
							? query.startDate.toISOString()
							: undefined,
						page: query.page ? query.page - 1 : 0,
					},
					throw: true,
				});
				return response.data;
			},
		}),
	);

	return (
		<ManagerActivityLogPage
			breadcrumbs={{
				breadcrumbs,
				title: "Activity Log",
			}}
			data={content}
			paginationMeta={paginationMeta}
		/>
	);
}

export default Page;
