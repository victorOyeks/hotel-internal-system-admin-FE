import { HotelOwnerDashboard } from "@/components/roles/hotel-owner/dashboard";
import { getOwnerCurrentHotel } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { use } from "react";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";

export const dynamic = "force-dynamic";

const loadSearchParams = createLoader({
	selectedMonth: parseAsString,
});

type PageProps = {
	searchParams: Promise<SearchParams>;
};

function HomePage({ searchParams }: PageProps) {
	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const currentHotel = use(getOwnerCurrentHotel());
	const query = use(loadSearchParams(searchParams));
	const selectedMonth = query.selectedMonth ?? undefined;

	const breadcrumbs: Breadcrumb[] = [
		{
			label: "Dashboard",
			href: "/dashboard",
		},
	];

	const auth = { type: "Bearer" as const, token: cookieData.token };

	// Create all promises first (parallel pattern)
	const graphPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "dashboard-graph"],
		queryFn: async ({ signal }) => {
			const res = await $fetch("@get/api/hotel-owners/dashboard/graph", {
				signal,
				auth,
				throw: true,
			});
			return res.data;
		},
	});

	const overviewPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "dashboard-overview", selectedMonth],
		queryFn: async ({ signal }) => {
			const res = await $fetch("@get/api/hotel-owners/dashboard/overview", {
				query: { selectedMonth },
				signal,
				auth,
				throw: true,
			});
			return res.data;
		},
	});

	const performancePromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "dashboard-performance"],
		queryFn: async ({ signal }) => {
			const res = await $fetch(
				"@get/api/hotel-owners/dashboard-performance",
				{ query: {}, signal, auth, throw: true },
			);
			return res.data;
		},
	});

	const hotelOverviewPromise = currentHotel
		? queryClient.ensureQueryData({
				queryKey: ["hotel-owner", "hotel-overview", currentHotel.id, selectedMonth],
				queryFn: async () => {
					try {
						const res = await $fetch(
							"@get/api/hotel-owners/:hotelId/overview",
							{
								params: { hotelId: currentHotel.id },
								query: { selectedMonth },
								auth,
								throw: true,
							},
						);
						return res.data;
					} catch {
						return null;
					}
				},
			})
		: null;

	// Await all in parallel
	const graphData = use(graphPromise);
	const overviewData = use(overviewPromise);
	const dashboardPerformanceData = use(performancePromise);
	const hotelOverviewData = hotelOverviewPromise
		? use(hotelOverviewPromise)
		: null;

	return (
		<HotelOwnerDashboard
			key={selectedMonth ?? "current"}
			overviewData={overviewData}
			breadcrumbs={breadcrumbs}
			graphData={graphData}
			performanceData={dashboardPerformanceData}
			hotelOverviewData={hotelOverviewData}
			selectedHotelName={currentHotel?.name}
		/>
	);
}

export default HomePage;
