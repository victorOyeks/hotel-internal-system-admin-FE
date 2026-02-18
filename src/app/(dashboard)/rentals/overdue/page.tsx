import { OverdueRentalsPage } from "@/components/roles/rentals/overdue-rentals";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import {
	createLoader,
	parseAsInteger,
	type SearchParams,
} from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	page: parseAsInteger.withDefault(1),
	size: parseAsInteger.withDefault(20),
});

const breadcrumbs = {
	title: "Overdue Rentals",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Overdue Rentals", href: "/dashboard/overdue" },
	],
};

export default function OverdueRentalsPageRoute({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: orders, ...paginationMeta } = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "orders", "overdue", query],
			queryFn: async ({ signal }) => {
				const response = await $fetch(
					"@get/api/hotels/rentals/orders/overdue",
					{
						query: {
							page: query.page < 1 ? query.page : query.page - 1,
							size: query.size,
						},
						auth: { type: "Bearer", token },
						signal,
						throw: true,
					},
				);
				const data = response.data;
				if (Array.isArray(data?.content)) return data;
				if (Array.isArray(data)) {
					return {
						content: data,
						pageNumber: 0,
						pageSize: query.size,
						totalElements: data.length,
						totalPages: 1,
						last: true,
						first: true,
					};
				}
				return {
					content: [],
					pageNumber: 0,
					pageSize: query.size,
					totalElements: 0,
					totalPages: 1,
					last: true,
					first: true,
				};
			},
		}),
	);

	return (
		<OverdueRentalsPage
			orders={orders}
			paginationMeta={paginationMeta}
			breadcrumbs={breadcrumbs}
		/>
	);
}
