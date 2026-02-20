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

	const dashboardData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "dashboardData", cookieData.userId],
			queryFn: async () => {
				const res = await $fetch("@get/api/managers/dashboard/:hotelId", {
					params: { hotelId: currentHotel?.id },
					auth: {
						type: "Bearer",
						token: cookieData.token,
					},
					query: {},
					throw: true,
				});

				return res.data;
			},
		}),
	);

	const graphData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "dashboardGraphData", cookieData.userId],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/managers/dashboard/:hotelId/earnings-graph",
					{
						params: { hotelId: currentHotel?.id },
						auth: {
							type: "Bearer",
							token: cookieData.token,
						},
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
					auth: {
						type: "Bearer",
						token: cookieData.token,
					},
					throw: true,
				});

				return res.data;
			},
		}),
	);

	const { content } = use(
		queryClient.ensureQueryData({
			queryKey: ["hotel-owner-bookings"],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/managers/hotels/:hotelId/bookings",
					{
						params: {
							hotelId: currentHotel.id,
						},
						query: {},
						auth: {
							type: "Bearer",
							token: cookieData.token,
						},
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
			graphData={graphData}
			dashboardData={dashboardData}
			dashboardPerformanceData={dashboardPerformanceData}
			bookingData={content}
		/>
	);
}

export default HomePage;
