import { OrderPage } from "@/components/roles/kitchen/create-order";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { getUser } from "@/lib/dal";
import {
	createLoader,
	parseAsString,
	parseAsStringEnum,
	type SearchParams,
} from "nuqs/server";
import { use } from "react";

const loadSearchParams = createLoader(
	{
		search: parseAsString,
		itemType: parseAsStringEnum(["FOOD", "DRINK"]),
	},
	{
		urlKeys: {
			search: "booking:search",
		},
	},
);

type PageProps = {
	searchParams: Promise<SearchParams>;
};

function Page({ searchParams }: PageProps) {
	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const params = use(loadSearchParams(searchParams));
	const user = use(getUser());
	const hotelName = user?.hotels?.[0]?.name ?? "Hospio360";

	const foodItems = use(
		queryClient.ensureQueryData({
			queryKey: ["restaurant", "items", cookieData.token],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/restaurants/items/all", {
					signal,
					query: {
						itemType: params.itemType,
					},
					auth: { type: "Bearer", token: cookieData.token },
					throw: true,
				});
				return res.data;
			},
		}),
	);

	const currentBookings = use(
		queryClient.ensureQueryData({
			queryKey: ["restaurant", "current-bookings", cookieData.token],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/restaurants/current-bookings", {
					signal,
					query: {
						search: params.search,
						bookingStatus: "CHECKED_IN",
					},
					auth: { type: "Bearer", token: cookieData.token },
					throw: true,
				});
				return res.data.content;
			},
		}),
	);

	const destinations = use(
		queryClient.ensureQueryData({
			queryKey: ["restaurant", "destinations", cookieData.token],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/restaurants/destinations", {
					signal,
					auth: { type: "Bearer", token: cookieData.token },
					throw: true,
				});
				return res.data;
			},
		}),
	);

	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				title: "Create Order",
				breadcrumbs: [
					{
						label: "Dashboard",
						href: "/dashboard",
					},
					{
						label: "Create Order",
						href: "/dashboard/create-order",
					},
				],
			}}
		>
			<OrderPage
				foodItems={foodItems}
				currentBookings={currentBookings}
				destinations={destinations}
				hotelName={hotelName}
			/>
		</BreadCrumbWrapper>
	);
}

export default Page;
