import { OwnerNotifications } from "@/components/roles/hotel-owner/notifications";
import { getOwnerCurrentHotel } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { use } from "react";

function NotificationsPage() {
	const breadcrumbs: Breadcrumb[] = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Notifications", href: "/dashboard/notifications" },
	];

	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const currentHotel = use(getOwnerCurrentHotel());

	if (!currentHotel) {
		return (
			<div className="p-6">
				<div className="bg-white p-8 rounded-2xl text-center">
					<p className="text-gray-500">
						Please select a hotel from the sidebar to view notifications.
					</p>
				</div>
			</div>
		);
	}

	const { id } = currentHotel;

	const notificationData = use(
		queryClient.ensureQueryData({
			queryKey: ["hotel-owner", "notifications", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/hotel-owners/:hotelId/notifications",
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
		<OwnerNotifications
			breadcrumbs={breadcrumbs}
			notificationData={notificationData}
		/>
	);
}

export default NotificationsPage;
