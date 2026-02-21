import { HotelOwnerStaff } from "@/components/roles/hotel-owner/staff-management";
import { getOwnerCurrentHotel, verifySession } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
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

const hotelRoles = [
	"HOTEL_OWNER",
	"MANAGER",
	"FRONT_DESK",
	"INVENTORY",
	"RESTAURANT",
	"MARKETER",
	"RENTALS",
	"SUPER_ADMIN",
	"LAUNDRY",
	"FINANCIALS",
] as const;

const loadSearchParams = createLoader({
	...paginationSearchParams,
	search: parseAsString.withDefault(""),
	role: parseAsStringLiteral(hotelRoles),
	status: parseAsString.withDefault(""),
});

function StaffManagementPage({ searchParams }: PageProps) {
	const session = use(verifySession());
	const currentHotel = use(getOwnerCurrentHotel());
	const query = use(loadSearchParams(searchParams));
	const queryClient = getQueryClient();
	const breadcrumb = {
		title: "Staff Management",
		breadcrumbs: [
			{ label: "Dashboard", href: "/dashboard" },
			{ label: "Staff Management", href: "/dashboard/staff-management" },
		],
	};

	if (!currentHotel) {
		return (
			<div className="p-6">
				<div className="bg-white p-8 rounded-2xl text-center">
					<p className="text-gray-500">
						Please select a hotel from the sidebar to view staff.
					</p>
				</div>
			</div>
		);
	}

	const { id } = currentHotel;

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["staffs", id, query],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/hotel-owners/:hotelId/staff",
					{
						params: { hotelId: id },
						query: {
							...query,
							page: query.page ? query.page - 1 : 0,
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
		<HydrationBoundary state={dehydrate(queryClient)}>
			<HotelOwnerStaff
				breadcrumb={breadcrumb}
				staffs={content}
				paginationMeta={paginationMeta}
			/>
		</HydrationBoundary>
	);
}

export default StaffManagementPage;
