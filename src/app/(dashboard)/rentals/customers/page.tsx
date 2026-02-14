import { RentalCustomersPage } from "@/components/roles/rentals/rental-customers";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

const breadcrumbs = {
	title: "Customers",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Customers", href: "/dashboard/customers" },
	],
};

export default function RentalCustomersPageRoute() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const customers = use(
		qc.ensureQueryData({
			queryKey: ["rentals", "customers"],
			queryFn: async ({ signal }) => {
				const response = await $fetch(
					"@get/api/hotels/rentals/customers/log",
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
		<RentalCustomersPage
			customers={customers}
			breadcrumbs={breadcrumbs}
		/>
	);
}
