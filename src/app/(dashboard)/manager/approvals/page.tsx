import { Approvals } from "@/components/roles/manager/approvals";
import { getManagerCurrentHotel } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { use } from "react";

function ApprovalsPage() {
	const breadcrumbs: Breadcrumb[] = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Approvals", href: "/dashboard/approvals" },
	];

	const cookieData = use(getCookieData())!;
	const queryClient = getQueryClient();
	const { id } = use(getManagerCurrentHotel())!;

	const summaryData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "approvals", "summary", id],
			queryFn: async () => {
				const res = await $fetch(
					"@get/api/manager/approvals/pending/summary",
					{
						query: { hotelId: id },
						auth: { type: "Bearer", token: cookieData.token },
						throw: true,
					},
				);
				return res.data;
			},
		}),
	);

	const pendingData = use(
		queryClient.ensureQueryData({
			queryKey: ["manager", "approvals", "pending", id],
			queryFn: async () => {
				const res = await $fetch("@get/api/manager/approvals/pending", {
					query: { hotelId: id },
					auth: { type: "Bearer", token: cookieData.token },
					throw: true,
				});
				return res.data;
			},
		}),
	);

	return (
		<Approvals
			breadcrumbs={breadcrumbs}
			summaryData={summaryData}
			pendingData={pendingData}
			hotelId={id}
		/>
	);
}

export default ApprovalsPage;
