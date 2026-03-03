import { OwnerRooms } from "@/components/roles/hotel-owner/rooms";
import { getOwnerCurrentHotel, verifySession } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import {
	createLoader,
	parseAsBoolean,
	parseAsString,
	parseAsStringLiteral,
	type SearchParams,
} from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	...paginationSearchParams,
	search: parseAsString.withDefault(""),
	roomType: parseAsString,
	roomStatus: parseAsStringLiteral([
		"AVAILABLE",
		"RESERVED",
		"CHECKED_IN",
		"CHECKED_OUT",
		"CANCELLED",
	]),
	active: parseAsBoolean,
});

function RoomsPage({ searchParams }: PageProps) {
	const session = use(verifySession());
	const currentHotel = use(getOwnerCurrentHotel());
	const query = use(loadSearchParams(searchParams));
	const queryClient = getQueryClient();

	if (!currentHotel) {
		return (
			<div className="p-6">
				<div className="bg-white p-8 rounded-2xl text-center">
					<p className="text-gray-500">
						Please select a hotel from the sidebar to manage rooms.
					</p>
				</div>
			</div>
		);
	}

	const auth = { type: "Bearer" as const, token: session.token };
	const { id } = currentHotel;
	const isDeactivatedView = query.active === false;
	const activeParam = query.active === false ? false : true;

	// Create all promises first (parallel pattern)
	const roomsPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "rooms", id, query],
		queryFn: async () => {
			const response = await $fetch(
				"@get/api/hotel-owners/hotels/:hotelId/rooms",
				{
					params: { hotelId: id },
					query: {
						search: query.search || undefined,
						roomType: query.roomType || undefined,
						status: query.roomStatus || undefined,
						active: activeParam,
						page: query.page ? query.page - 1 : 0,
						size: 20,
					},
					auth,
					throw: true,
				},
			);
			return response.data;
		},
	});

	const roomTypesPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "room-types", id],
		queryFn: async () => {
			try {
				const response = await $fetch(
					"@get/api/hotel-owners/hotels/:hotelId/room-types",
					{ params: { hotelId: id }, auth, throw: true },
				);
				return response.data;
			} catch {
				return [];
			}
		},
	});

	// Await all in parallel
	const { content, ...paginationMeta } = use(roomsPromise);
	const roomTypes = use(roomTypesPromise);

	return (
		<OwnerRooms
			rooms={content}
			paginationMeta={paginationMeta}
			roomTypes={roomTypes}
			hotelId={id}
			isDeactivatedView={isDeactivatedView}
		/>
	);
}

export default RoomsPage;
