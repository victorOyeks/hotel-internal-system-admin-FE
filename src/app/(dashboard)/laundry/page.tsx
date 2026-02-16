import { LaundryDashboard } from "@/components/roles/laundry/dashboard";
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

export default function LaundryHomePage() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const stats = use(
		qc.ensureQueryData({
			queryKey: ["laundry", "dashboard-stats"],
			queryFn: async ({ signal }) => {
				const response = await $fetch(
					"@get/api/hotels/laundry/dashboard/stats",
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

	return <LaundryDashboard stats={stats} breadcrumbs={breadcrumbs} />;
}
