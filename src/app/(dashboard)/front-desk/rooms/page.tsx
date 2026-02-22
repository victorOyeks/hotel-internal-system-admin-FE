import { RoomPage } from "@/components/roles/front-desk/rooms-page";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsBoolean, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	...paginationSearchParams,
	roomStatus: parseAsString,
	search: parseAsString,
	roomType: parseAsString,
	active: parseAsBoolean,
});

function Page({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));

	const queryClient = getQueryClient();

	const isDeactivatedView = query.active === false;
	const activeParam = query.active === false ? false : true;

	const { content: rooms, ...pagination } = use(
		queryClient.ensureQueryData({
			queryKey: ["front-desks", "rooms", query],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/front-desks/rooms", {
					query: {
						...query,
						active: activeParam,
						page: query.page ? query.page - 1 : 0,
					},
					signal,
					throw: true,
					auth: { type: "Bearer", token },
				});

				return response.data;
			},
		}),
	);

	return (
		<RoomPage
			breadcrumb={{
				title: "Rooms",
				breadcrumbs: [
					{ label: "Dashboard", href: "/dashboard" },
					{ label: "Rooms", href: "/dashboard/rooms" },
				],
			}}
			paginationMeta={pagination}
			rooms={rooms}
			isDeactivatedView={isDeactivatedView}
		/>
	);
}

export default Page;
