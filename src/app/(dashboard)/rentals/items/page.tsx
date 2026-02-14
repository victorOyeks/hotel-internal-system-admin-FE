import { RentalItemsPage } from "@/components/roles/rentals/rental-items";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

const breadcrumbs = {
	title: "Rental Items",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Rental Items", href: "/dashboard/items" },
	],
};

export default function RentalItemsPageRoute() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const items = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "items"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/hotels/rentals/items", {
					query: { activeOnly: true },
					auth: { type: "Bearer", token },
					signal,
					throw: true,
				});
				return response.data;
			},
		}),
	);

	return <RentalItemsPage items={items} breadcrumbs={breadcrumbs} />;
}
