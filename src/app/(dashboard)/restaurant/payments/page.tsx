import { RestaurantPaymentsPage } from "@/components/roles/kitchen/restaurant-payments";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader(paginationSearchParams);

const breadcrumbs = {
	title: "Restaurant Payments",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Payments", href: "/dashboard/payments" },
	],
};

export default function RestaurantPaymentsPageRoute({
	searchParams,
}: PageProps) {
	const cookieData = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: payments, ...paginationMeta } = use(
		qc.ensureQueryData({
			queryKey: ["restaurant", "payments", query],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/restaurants/payments", {
					query: {
						page: query.page < 1 ? query.page : query.page - 1,
						size: query.size,
					},
					auth: { type: "Bearer", token: cookieData.token },
					signal,
					throw: true,
				});
				return response.data;
			},
		}),
	);

	return (
		<RestaurantPaymentsPage
			payments={payments}
			paginationMeta={paginationMeta}
			breadcrumbs={breadcrumbs}
			token={cookieData.token}
		/>
	);
}
