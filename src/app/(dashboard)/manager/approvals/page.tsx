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

	const auth = { type: "Bearer" as const, token: cookieData.token };

	// Create all promises first (parallel pattern)
	const summaryPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "approvals", "summary", id],
		queryFn: async () => {
			const res = await $fetch(
				"@get/api/manager/approvals/pending/summary",
				{ query: { hotelId: id }, auth, throw: true },
			);
			return res.data;
		},
	});

	const pendingPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "approvals", "pending", id],
		queryFn: async () => {
			const res = await $fetch("@get/api/manager/approvals/pending", {
				query: { hotelId: id },
				auth,
				throw: true,
			});
			return res.data;
		},
	});

	// Await all in parallel
	const summaryData = use(summaryPromise);
	const pendingData = use(pendingPromise);

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
