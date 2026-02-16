import { LaundryItemsPage } from "@/components/roles/laundry/laundry-items";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

const breadcrumbs = {
	title: "Laundry Items",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Laundry Items", href: "/dashboard/items" },
	],
};

export default function LaundryItemsPageRoute() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const items = use(
		qc.ensureQueryData({
			queryKey: ["laundry", "items"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/hotels/laundry/items", {
					auth: { type: "Bearer", token },
					signal,
					throw: true,
				});
				return response.data;
			},
		}),
	);

	return <LaundryItemsPage items={items} breadcrumbs={breadcrumbs} />;
}
