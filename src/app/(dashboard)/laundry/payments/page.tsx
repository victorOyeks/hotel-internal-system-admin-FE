import { LaundryPaymentsPage } from "@/components/roles/laundry/laundry-payments";
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
	title: "Laundry Payments",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Payments", href: "/dashboard/payments" },
	],
};

export default function LaundryPaymentsPageRoute({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: orders, ...paginationMeta } = use(
		qc.ensureQueryData({
			queryKey: ["laundry", "payments", query],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/hotels/laundry/orders", {
					query: {
						page: query.page < 1 ? query.page : query.page - 1,
						size: query.size,
						sort: "createdAt,desc",
					},
					auth: { type: "Bearer", token },
					signal,
					throw: true,
				});
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return response.data as any;
			},
		}),
	);

	const stats = use(
		qc.ensureQueryData({
			queryKey: ["laundry", "dashboard", "stats"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/hotels/laundry/dashboard/stats", {
					auth: { type: "Bearer", token },
					signal,
					throw: true,
				});
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return response.data as any;
			},
		}),
	);

	return (
		<LaundryPaymentsPage
			orders={orders}
			paginationMeta={paginationMeta}
			breadcrumbs={breadcrumbs}
			stats={stats}
		/>
	);
}
