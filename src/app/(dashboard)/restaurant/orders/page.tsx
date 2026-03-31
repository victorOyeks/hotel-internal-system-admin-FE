import { RestaurantOrdersPage } from "@/components/roles/kitchen/restaurant-orders";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { getUser } from "@/lib/dal";
import {
	createLoader,
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
	startDate: parseAsString,
	endDate: parseAsString,
	status: parseAsStringLiteral(["PENDING", "COMPLETED", "CANCELLED"]),
	...paginationSearchParams,
});

const breadcrumbs = {
	title: "F&B Orders",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Orders", href: "/dashboard/orders" },
	],
};

export default function RestaurantOrdersPageRoute({
	searchParams,
}: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const user = use(getUser());
	const hotelName = user?.hotels?.[0]?.name ?? "Hospio360";
	const qc = getQueryClient();

	const { content: orders, ...paginationMeta } = use(
		qc.ensureQueryData({
			queryKey: ["restaurant", "orders", query],
			queryFn: async ({ signal }) => {
				const res = await $fetch(
					"@get/api/restaurants/restaurant-orders",
					{
						//@ts-expect-error -- IGNORE --
						query: {
							...query,
							size: 9,
							page: query.page ? query.page - 1 : 0,
						},
						signal,
						auth: { type: "Bearer", token },
						throw: true,
					},
				);
				return res.data;
			},
		}),
	);

	return (
		<RestaurantOrdersPage
			orders={orders}
			paginationMeta={paginationMeta}
			breadcrumbs={breadcrumbs}
			hotelName={hotelName}
		/>
	);
}
