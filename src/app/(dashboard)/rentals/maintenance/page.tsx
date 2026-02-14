import { RentalMaintenancePage } from "@/components/roles/rentals/rental-maintenance";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

const breadcrumbs = {
	title: "Maintenance",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Maintenance", href: "/dashboard/maintenance" },
	],
};

export default function RentalMaintenancePageRoute() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const pendingMaintenance = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "maintenance", "pending"],
			queryFn: async ({ signal }) => {
				const response = await $fetch(
					"@get/api/hotels/rentals/maintenance/pending",
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

	return (
		<RentalMaintenancePage
			pendingMaintenance={pendingMaintenance}
			breadcrumbs={breadcrumbs}
		/>
	);
}
