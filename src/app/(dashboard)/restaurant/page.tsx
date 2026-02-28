import { RestaurantDashboard } from "@/components/roles/kitchen/restaurant-dashboard";
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

export default function RestaurantHomePage() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const statsPromise = qc.ensureQueryData({
		queryKey: ["restaurant", "dashboard-stats"],
		queryFn: async ({ signal }) => {
			const res = await $fetch("@get/api/restaurants/dashboard-stats", {
				auth: { type: "Bearer", token },
				signal,
				throw: true,
			});
			return res.data;
		},
	});

	const recentOrdersPromise = qc.ensureQueryData({
		queryKey: ["restaurant", "recent-orders"],
		queryFn: async ({ signal }) => {
			const res = await $fetch("@get/api/restaurants/restaurant-orders", {
				query: { page: 0, size: 5 },
				signal,
				auth: { type: "Bearer", token },
				throw: true,
			});
			return res.data.content;
		},
	});

	const [stats, recentOrders] = use(
		Promise.all([statsPromise, recentOrdersPromise]),
	);

	return (
		<RestaurantDashboard
			stats={stats}
			recentOrders={recentOrders}
			breadcrumbs={breadcrumbs}
		/>
	);
}
