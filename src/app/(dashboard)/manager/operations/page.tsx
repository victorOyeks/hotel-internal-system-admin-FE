import { Operations } from "@/components/roles/manager/operations";
import { getManagerCurrentHotel } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { use } from "react";

function OperationsPage() {
	const breadcrumbs: Breadcrumb[] = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Operations", href: "/dashboard/operations" },
	];

	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const { id } = use(getManagerCurrentHotel())!;

	const restaurantData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "operations", "restaurant", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/managers/:hotelId/restaurant/summary",
					{
						params: { hotelId: id },
						query: {},
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);
				return res.data;
			},
		}),
	);

	const laundryData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "operations", "laundry", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/managers/:hotelId/laundry/summary",
					{
						params: { hotelId: id },
						query: {},
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);
				return res.data;
			},
		}),
	);

	const rentalsData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "operations", "rentals", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/managers/:hotelId/rentals/summary",
					{
						params: { hotelId: id },
						query: {},
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);
				return res.data;
			},
		}),
	);

	const barData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "operations", "bar", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/managers/:hotelId/bar/summary",
					{
						params: { hotelId: id },
						query: {},
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);
				return res.data;
			},
		}),
	);

	const accommodationData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "operations", "accommodation", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/managers/:hotelId/accommodation/summary",
					{
						params: { hotelId: id },
						query: {},
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);
				return res.data;
			},
		}),
	);

	const inventoryData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "operations", "inventory", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/managers/:hotelId/inventories/summary",
					{
						params: { hotelId: id },
						query: {},
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);
				return res.data;
			},
		}),
	);

	return (
		<Operations
			breadcrumbs={breadcrumbs}
			restaurantData={restaurantData}
			barData={barData}
			laundryData={laundryData}
			rentalsData={rentalsData}
			accommodationData={accommodationData}
			inventoryData={inventoryData}
		/>
	);
}

export default OperationsPage;
