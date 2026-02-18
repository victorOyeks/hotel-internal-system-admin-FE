import { RentalCustomersPage } from "@/components/roles/rentals/rental-customers";
import { $fetch } from "@/lib/fetch";
import { createLoader, parseAsInteger, type SearchParams } from "nuqs/server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	page: parseAsInteger.withDefault(1),
	size: parseAsInteger.withDefault(20),
});

const breadcrumbs = {
	title: "Customers",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Customers", href: "/dashboard/customers" },
	],
};

export default function RentalCustomersPageRoute({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: customers, ...paginationMeta } = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "customers", query],
			queryFn: async ({ signal }) => {
				const response = await $fetch(
					"@get/api/hotels/rentals/customers/log",
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
		<RentalCustomersPage
			customers={customers}
			paginationMeta={paginationMeta}
			breadcrumbs={breadcrumbs}
		/>
	);
}
