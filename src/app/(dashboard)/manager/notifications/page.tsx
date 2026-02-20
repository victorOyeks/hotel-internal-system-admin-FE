import { Notifications } from "@/components/roles/manager/notifications";
import { getManagerCurrentHotel } from "@/lib/dal";
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
	const { id } = use(getManagerCurrentHotel())!;

	const notificationData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "notifications", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/managers/:hotelId/notifications",
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
		<Notifications
			breadcrumbs={breadcrumbs}
			notificationData={notificationData}
		/>
	);
}

export default NotificationsPage;
