import { ManagerDashboard } from "@/components/roles/manager/dashboard";
import { getManagerCurrentHotel } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { notFound } from "next/navigation";
import { use } from "react";

function HomePage() {
	const breadcrumbs: Breadcrumb[] = [
		{
			label: "Dashboard",
			href: "/dashboard",
		},
	];

	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const currentHotel = use(getManagerCurrentHotel());

	if (!currentHotel) {
		return notFound();
	}

	const id = currentHotel.id;

	const overviewData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "overview", id],
			queryFn: async () => {
				const res = await $fetch("@get/api/managers/:hotelId/overview", {
					params: { hotelId: id },
					auth: { type: "Bearer", token: cookieData.token },
					throw: true,
				});
				return res.data;
			},
		}),
	);

	const graphData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "dashboardGraphData", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/managers/dashboard/:hotelId/earnings-graph",
					{
						params: { hotelId: id },
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);
				return res.data;
			},
		}),
	);

	const dashboardPerformanceData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "dashboardPerformanceData", cookieData.userId],
			queryFn: async () => {
				const res = await $fetch("@get/api/managers/dashboard-performance", {
					auth: { type: "Bearer", token: cookieData.token },
					throw: true,
				});
				return res.data;
			},
		}),
	);

	const { content } = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "bookings", id],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/managers/hotels/:hotelId/bookings",
					{
						params: { hotelId: id },
						query: { size: 7 },
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);
				return response.data;
			},
		}),
	);

	return (
		<ManagerDashboard
			breadcrumbs={breadcrumbs}
			overviewData={overviewData}
			graphData={graphData}
			dashboardPerformanceData={dashboardPerformanceData}
			bookingData={content}
		/>
	);
}

export default HomePage;
