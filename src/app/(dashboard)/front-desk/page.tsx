import {
	FrontDeskStats,
	PendingMaintenanceNotifications,
	QuickActions,
} from "@/components/roles/front-desk/dashboard";
import { RoomsListTable } from "@/components/roles/front-desk/rooms-table";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
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
	search: parseAsString,
	roomType: parseAsString,
	...paginationSearchParams,
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

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["front-desks", "rooms", query],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/front-desks/rooms", {
					query: {
						page: query.page ? query.page - 1 : 0,
						roomType: query.roomType,
						search: query.search,
						size: query.size ?? 10,
					},
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
				<section className="grid grid-cols-1 md:grid-cols-7 gap-4">
					<div className="md:col-span-5 space-y-4">
						<FrontDeskStats stats={stats} />
						<QuickActions rooms={rooms} roomTypes={roomTypes} />
					</div>
					<div className="md:col-span-2">
						<PendingMaintenanceNotifications />
					</div>
				</section>

				<section>
					<RoomsListTable rooms={content} paginationMeta={paginationMeta} />
				</section>
			</div>
		</BreadCrumbWrapper>
	);
}

export default Page;
