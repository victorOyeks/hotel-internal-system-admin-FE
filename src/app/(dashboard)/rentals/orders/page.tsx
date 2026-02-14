import { RentalOrdersPage } from "@/components/roles/rentals/rental-orders";
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
	title: "Rental Orders",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Orders", href: "/dashboard/orders" },
	],
};

export default function RentalOrdersPageRoute({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: orders, ...paginationMeta } = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "orders", query],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/hotels/rentals/orders", {
					query: {
						page: query.page < 1 ? query.page : query.page - 1,
						size: query.size,
					},
					auth: { type: "Bearer", token },
					signal,
					throw: true,
				});
				return response.data;
			},
		}),
	);

	return (
		<RentalOrdersPage
			orders={orders}
			paginationMeta={paginationMeta}
			breadcrumbs={breadcrumbs}
		/>
	);
}
