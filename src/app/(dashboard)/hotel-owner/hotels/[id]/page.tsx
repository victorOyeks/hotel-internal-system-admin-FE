import { ViewSingleHotelPage } from "@/components/roles/hotel-owner/view-single-hotel";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
	createLoader,
	parseAsStringEnum,
	parseAsString,
	type SearchParams,
} from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
	params: Promise<{ id: string }>;
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
	status: parseAsStringEnum(Object.values(RoomStatus)),
	search: parseAsString,
});

export default function Page({ params, searchParams }: PageProps) {
	const { id } = use(params);
	const query = use(loadSearchParams(searchParams));
	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["hotel", id, query],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/hotel-owners/hotels/:hotelId/rooms",
					{
						params: {
							hotelId: id,
						},
						auth: {
							type: "Bearer",
							token: cookieData.token,
						},
						query: {
							...query,
							page: query.page ? query.page - 1 : 0,
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
				href: "/home",
			},
			{
				label: "Branches",
				href: "/hotels",
			},
			{
				label: content.length > 0 ? content[0].hotelName : "Branch",
				href: `/dashboard/hotels/${id}`,
			},
		],
	};

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ViewSingleHotelPage
				breadcrumbs={breadcrumbs}
				rooms={content}
				paginationMeta={paginationMeta}
			/>
		</HydrationBoundary>
	);
}
