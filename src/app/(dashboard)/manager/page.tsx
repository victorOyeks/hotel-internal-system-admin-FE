import { ManagerDashboard } from "@/components/roles/manager/dashboard";
import { getManagerCurrentHotel } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { notFound } from "next/navigation";
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
	const breadcrumbs: Breadcrumb[] = [
		{
			label: "Dashboard",
			href: "/dashboard",
		},
	];

	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const currentHotel = use(getManagerCurrentHotel());
	const query = use(loadSearchParams(searchParams));
	const selectedMonth = query.selectedMonth ?? undefined;

	if (!currentHotel) {
		return notFound();
	}

	const id = currentHotel.id;
	const auth = { type: "Bearer" as const, token: cookieData.token };

	// Create all promises first (parallel pattern)
	const overviewPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "overview", id, selectedMonth],
		queryFn: async () => {
			const res = await $fetch("@get/api/managers/:hotelId/overview", {
				params: { hotelId: id },
				query: { selectedMonth },
				auth,
				throw: true,
			});
			return res.data;
		},
	});

	const graphPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "dashboardGraphData", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/managers/dashboard/:hotelId/earnings-graph",
				{ params: { hotelId: id }, auth, throw: true },
			);
			return res.data;
		},
	});

	const performancePromise = queryClient.ensureQueryData({
		queryKey: ["manager", "dashboardPerformanceData", cookieData.userId],
		queryFn: async () => {
			const res = await $fetch("@get/api/managers/dashboard-performance", {
				auth,
				throw: true,
			});
			return res.data;
		},
	});

	const bookingsPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "bookings", id],
		queryFn: async () => {
			const response = await $fetch(
				"@get/api/managers/hotels/:hotelId/bookings",
				{ params: { hotelId: id }, query: { size: 7 }, auth, throw: true },
			);
			return response.data;
		},
	});

	// Await all in parallel
	const overviewData = use(overviewPromise);
	const graphData = use(graphPromise);
	const dashboardPerformanceData = use(performancePromise);
	const { content } = use(bookingsPromise);

	return (
		<ManagerDashboard
			key={selectedMonth ?? "current"}
			breadcrumbs={breadcrumbs}
			overviewData={overviewData}
			graphData={graphData}
			dashboardPerformanceData={dashboardPerformanceData}
			bookingData={content}
		/>
	);
}

export default HomePage;
