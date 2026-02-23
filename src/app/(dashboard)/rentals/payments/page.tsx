import { RentalPaymentsPage } from "@/components/roles/rentals/rental-payments";
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
	title: "Payments",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Payments", href: "/dashboard/payments" },
	],
};

export default function RentalPaymentsPageRoute({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: payments, ...paginationMeta } = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "payments", query],
			queryFn: async ({ signal }) => {
				const response = await $fetch(
					"@get/api/hotels/rentals/payments/history",
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
				return response.data;
			},
		}),
	);

	return (
		<RentalPaymentsPage
			payments={payments}
			paginationMeta={paginationMeta}
			breadcrumbs={breadcrumbs}
		/>
	);
}
