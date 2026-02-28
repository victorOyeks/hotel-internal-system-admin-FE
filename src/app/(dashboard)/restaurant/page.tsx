import {
	type DashboardStats,
	KitchenToolbar,
	Orders,
	QuickActions,
	RestaurantAnalytics,
} from "@/components/roles/kitchen/dashboard";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import {
	createLoader,
	parseAsIsoDateTime,
	parseAsString,
	parseAsStringLiteral,
	type SearchParams,
} from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	searchText: parseAsString,
	startDate: parseAsIsoDateTime,
	endDate: parseAsIsoDateTime,
	status: parseAsStringLiteral(["PENDING", "COMPLETED", "CANCELLED"]),
	...paginationSearchParams,
});

function Page({ searchParams }: PageProps) {
	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const query = use(loadSearchParams(searchParams));

	const ordersPromise = queryClient.ensureQueryData({
		queryKey: ["restaurant", "dashboard-data", cookieData.token],
		queryFn: async ({ signal }) => {
			const res = await $fetch("@get/api/restaurants/restaurant-orders", {
				//@ts-expect-error -- IGNORE --
				query: {
					...query,
					size: 9,
					page: query.page ? query.page - 1 : 0,
				},
				signal,
				auth: { type: "Bearer", token: cookieData.token },
				throw: true,
			});
			return res.data;
		},
	});

	const statsPromise = queryClient.ensureQueryData({
		queryKey: ["restaurant", "dashboard-stats", cookieData.token],
		queryFn: async ({ signal }) => {
			const res = await $fetch("@get/api/restaurants/dashboard-stats", {
				signal,
				auth: { type: "Bearer", token: cookieData.token },
				throw: true,
			});
			return res.data as DashboardStats;
		},
	});

	const [ordersData, stats] = use(Promise.all([ordersPromise, statsPromise]));
	const { content, ...paginationProps } = ordersData;

	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				title: "Restaurant",
				breadcrumbs: [
					{ label: "Dashboard", href: "/dashboard" },
				] satisfies Breadcrumb[],
			}}
		>
			<div className="space-y-4 px-4 py-4">
				<RestaurantAnalytics stats={stats} />
				<QuickActions />
				<KitchenToolbar />
				<Orders orders={content} pagination={paginationProps} />
			</div>
		</BreadCrumbWrapper>
	);
}

export default Page;
