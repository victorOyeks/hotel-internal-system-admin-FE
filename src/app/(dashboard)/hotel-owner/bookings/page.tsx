import { BookingsPage } from "@/components/roles/hotel-owner/bookings";
import { getOwnerCurrentHotel } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";
import z from "zod";

const ParamsSchema = z
	.object({
		roomType: z.string(),
		search: z.string(),
		bookingStatus: z.enum(["CHECKED_IN", "CHECKED_OUT", "RESERVED", "CANCELLED"]),
		page: z.coerce.number().default(0),
		size: z.coerce.number().default(10),
	})
	.partial();

function Page({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const cookieData = use(getCookieData())!;
	const currentHotel = use(getOwnerCurrentHotel());
	const searchParamsObj = use(searchParams);
	const queryClient = getQueryClient();
	const validatedParams = ParamsSchema.parse(searchParamsObj);

	if (!currentHotel) {
		return (
			<div className="p-6">
				<div className="bg-white p-8 rounded-2xl text-center">
					<p className="text-gray-500">
						Please select a hotel from the sidebar to view bookings.
					</p>
				</div>
			</div>
		);
	}

	const { id } = currentHotel;

	const { content, ...paginationProps } = use(
		queryClient.ensureQueryData({
			queryKey: ["hotel-owner-bookings", id, validatedParams],
			queryFn: async () => {
				const response = await $fetch(
					"@get/api/hotel-owners/:hotelId/bookings",
					{
						params: { hotelId: id },
						query: {
							...validatedParams,
							page: validatedParams.page ? validatedParams.page - 1 : 0,
						},
						auth: {
							type: "Bearer",
							token: cookieData.token,
						},
						throw: true,
					},
				);

				return response.data;
			},
		}),
	);

	return (
		<BookingsPage
			bookings={content}
			paginationMeta={paginationProps}
			breadcrumb={{
				title: "Bookings",
				breadcrumbs: [
					{ label: "Dashboard", href: "/dashboard" },
					{ label: "Bookings", href: "/dashboard/bookings" },
				],
			}}
		/>
	);
}

export default Page;
