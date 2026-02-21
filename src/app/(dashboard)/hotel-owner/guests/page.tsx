import { OwnerGuests } from "@/components/roles/hotel-owner/guests";
import { getOwnerCurrentHotel, verifySession } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import {
	createLoader,
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
	status: parseAsStringLiteral([
		"RESERVED",
		"CHECKED_IN",
		"CHECKED_OUT",
		"CANCELLED",
	]),
});

function GuestsPage({ searchParams }: PageProps) {
	const session = use(verifySession());
	const currentHotel = use(getOwnerCurrentHotel());
	const query = use(loadSearchParams(searchParams));
	const queryClient = getQueryClient();

	if (!currentHotel) {
		return (
			<div className="p-6">
				<div className="bg-white p-8 rounded-2xl text-center">
					<p className="text-gray-500">
						Please select a hotel from the sidebar to view guest logs.
					</p>
				</div>
			</div>
		);
	}

	const { id } = currentHotel;

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["hotel-owner", "guests", id, query],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/hotel-owners/:hotelId/guest-logs",
					{
						params: { hotelId: id },
						query: {
							search: query.search || undefined,
							status: query.status || undefined,
							page: query.page ? query.page - 1 : 0,
							size: 20,
						},
						auth: {
							type: "Bearer",
							token: session.token,
						},
						throw: true,
					},
				);
				return response.data;
			},
		}),
	);

	return (
		<OwnerGuests
			guests={content}
			paginationMeta={paginationMeta}
		/>
	);
}

export default GuestsPage;
