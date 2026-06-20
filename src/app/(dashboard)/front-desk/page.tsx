import {
	FrontDeskStats,
	QuickActions,
	DashboardRoomsSection,
} from "@/components/roles/front-desk/dashboard";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	"room:search": parseAsString,
	"room:type": parseAsString,
});

function Page({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));

	const queryClient = getQueryClient();

	const roomTypes = use(
		queryClient.ensureQueryData({
			queryKey: ["front-desks", "all-room-types"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/front-desks/all-room-types", {
					signal,
					throw: true,
					auth: { type: "Bearer", token },
				});

				return response.data;
			},
		}),
	);

	const rooms = use(
		queryClient.ensureQueryData({
			queryKey: ["front-desks", "rooms", query["room:search"], query["room:type"]],
			queryFn: async ({ signal }) => {
				const response = await $fetch(
					"@get/api/front-desks/rooms",
					{
						query: {
							roomType: query["room:type"] || undefined,
							search: query["room:search"] || undefined,
							roomStatus: "AVAILABLE",
							size: 100, // Limit for dropdown
						},
						signal,
						throw: true,
						auth: { type: "Bearer", token },
					},
				);

				return response.data.content;
			},
		}),
	);

	const { content: dashboardRooms, totalElements } = use(
		queryClient.ensureQueryData({
			queryKey: ["front-desks", "rooms-dashboard"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/front-desks/rooms", {
					query: { size: 50 },
					signal,
					throw: true,
					auth: { type: "Bearer", token },
				});

				return response.data;
			},
		}),
	);

	const stats = use(
		queryClient.ensureQueryData({
			queryKey: ["front-desks", "stats"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/front-desks/dashboard-cards", {
					signal,
					throw: true,
					auth: { type: "Bearer", token },
				});

				return response.data;
			},
		}),
	);

	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				title: "Front desk",
				breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }],
			}}
		>
			<div className="space-y-4 px-4 py-4">
				<section className="space-y-4">
					<FrontDeskStats stats={stats} />
					<QuickActions rooms={rooms} roomTypes={roomTypes} />
				</section>

				<section>
					<DashboardRoomsSection rooms={dashboardRooms} totalElements={totalElements} />
				</section>
			</div>
		</BreadCrumbWrapper>
	);
}

export default Page;
