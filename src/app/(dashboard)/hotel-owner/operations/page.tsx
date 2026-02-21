import { OwnerOperations } from "@/components/roles/hotel-owner/operations";
import { getOwnerCurrentHotel } from "@/lib/dal";
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
	const currentHotel = use(getOwnerCurrentHotel());

	if (!currentHotel) {
		return (
			<div className="p-6">
				<div className="bg-white p-8 rounded-2xl text-center">
					<p className="text-gray-500">
						Please select a hotel from the sidebar to view operations data.
					</p>
				</div>
			</div>
		);
	}

	const { id } = currentHotel;
	const auth = { type: "Bearer" as const, token: cookieData.token };

	// Create all promises first (parallel pattern)
	const restaurantPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "operations", "restaurant", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/hotel-owners/:hotelId/restaurant/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const barPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "operations", "bar", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/hotel-owners/:hotelId/bar/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const laundryPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "operations", "laundry", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/hotel-owners/:hotelId/laundry/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const rentalsPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "operations", "rentals", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/hotel-owners/:hotelId/rentals/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const accommodationPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "operations", "accommodation", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/hotel-owners/:hotelId/accommodation/summary",
				{ params: { hotelId: id }, query: {}, auth, throw: true },
			);
			return res.data;
		},
	});

	const inventoryPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "operations", "inventory", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/hotel-owners/:hotelId/inventories/summary",
				{ params: { hotelId: id }, auth, throw: true },
			);
			return res.data;
		},
	});

	// Await all in parallel
	const restaurantData = use(restaurantPromise);
	const barData = use(barPromise);
	const laundryData = use(laundryPromise);
	const rentalsData = use(rentalsPromise);
	const accommodationData = use(accommodationPromise);
	const inventoryData = use(inventoryPromise);

	return (
		<OwnerOperations
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
