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

	const auth = { type: "Bearer" as const, token: cookieData.token };

	// Create all promises first (parallel pattern)
	const restaurantPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "operations", "restaurant", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/managers/:hotelId/restaurant/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const laundryPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "operations", "laundry", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/managers/:hotelId/laundry/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const rentalsPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "operations", "rentals", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/managers/:hotelId/rentals/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const barPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "operations", "bar", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/managers/:hotelId/bar/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const accommodationPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "operations", "accommodation", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/managers/:hotelId/accommodation/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const inventoryPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "operations", "inventory", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/managers/:hotelId/inventories/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	// Await all in parallel
	const restaurantData = use(restaurantPromise);
	const laundryData = use(laundryPromise);
	const rentalsData = use(rentalsPromise);
	const barData = use(barPromise);
	const accommodationData = use(accommodationPromise);
	const inventoryData = use(inventoryPromise);

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
