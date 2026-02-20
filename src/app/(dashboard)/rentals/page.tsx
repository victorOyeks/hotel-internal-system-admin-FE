import { RentalsDashboard } from "@/components/roles/rentals/dashboard";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

const breadcrumbs = {
	title: "Dashboard",
	breadcrumbs: [
		{
			label: "Dashboard",
			href: "/dashboard",
		},
	],
};

export default function RentalsHomePage() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const stats = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "dashboard-stats"],
			queryFn: async ({ signal }) => {
				const response = await $fetch(
					"@get/api/hotels/rentals/dashboard/stats",
					{
						auth: { type: "Bearer", token },
						signal,
						throw: true,
					},
				);
				return response.data;
			},
		}),
	);

	const normalizedStats = {
		...stats,
		overdueRentals:
			stats?.overdueRentals ??
			stats?.overdueOrders ??
			stats?.overdueCount ??
			0,
	};

	return (
		<RentalsDashboard
			stats={normalizedStats}
			breadcrumbs={breadcrumbs}
		/>
	);
}
