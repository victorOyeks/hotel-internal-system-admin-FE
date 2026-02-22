import { ViewRoomsInHotelPage } from "@/components/roles/manager/view-hotel-rooms";
import { getManagerCurrentHotel } from "@/lib/dal";
import { $fetch, type ListRoomsQuery } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
	createLoader,
	parseAsBoolean,
	parseAsStringEnum,
	parseAsString,
	type SearchParams,
} from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

enum RoomStatus {
	CHECKED_IN = "CHECKED_IN",
	CHECKED_OUT = "CHECKED_OUT",
	RESERVED = "RESERVED",
	CANCELLED = "CANCELLED",
	AVAILABLE = "AVAILABLE",
}

const loadSearchParams = createLoader({
	...paginationSearchParams,
	roomType: parseAsString,
	roomStatus: parseAsStringEnum(Object.values(RoomStatus)),
	search: parseAsString,
	active: parseAsBoolean,
});

export default function Page({ searchParams }: PageProps) {
	const { id } = use(getManagerCurrentHotel())!;
	const query = use(loadSearchParams(searchParams));
	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();

	const isDeactivatedView = query.active === false;
	const activeParam = query.active === false ? false : true;

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["hotel", id, query],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/managers/hotels/:hotelId/rooms",
					{
						params: {
							hotelId: id,
						},
						auth: {
							type: "Bearer",
							token: cookieData.token,
						},
						query: {
							search: query.search,
							roomType: query.roomType,
							status: query.roomStatus as ListRoomsQuery["status"],
							active: activeParam,
							page: query.page ? query.page - 1 : 0,
							size: query.size,
						},
						throw: true,
					},
				);

				return response.data;
			},
		}),
	);

	const breadcrumbs = {
		title: "Hotel Details",
		breadcrumbs: [
			{
				label: "Dashboard",
				href: "/dashboard",
			},
			{
				label: "Rooms",
				href: "/dashboard/rooms",
			},
			// {
			//   label: content.length > 0 ? content[0].hotelName : "Hotel",
			//   href: `/dashboard/hotels/${id}`,
			// },
		],
	};

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ViewRoomsInHotelPage
				breadcrumbs={breadcrumbs}
				rooms={content}
				paginationMeta={paginationMeta}
				isDeactivatedView={isDeactivatedView}
			/>
		</HydrationBoundary>
	);
}
