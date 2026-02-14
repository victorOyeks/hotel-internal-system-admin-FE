import { OverdueRentalsPage } from "@/components/roles/rentals/overdue-rentals";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

const breadcrumbs = {
	title: "Overdue Rentals",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Overdue Rentals", href: "/dashboard/overdue" },
	],
};

export default function OverdueRentalsPageRoute() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const orders = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "orders", "overdue"],
			queryFn: async ({ signal }) => {
				const response = await $fetch(
					"@get/api/hotels/rentals/orders/overdue",
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

	return <OverdueRentalsPage orders={orders} breadcrumbs={breadcrumbs} />;
}
