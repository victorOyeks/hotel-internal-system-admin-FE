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

	const historyPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "approvals", "history", id],
		queryFn: async () => {
			const res = await $fetch("@get/api/manager/approvals/history", {
				query: { hotelId: id, size: 50 },
				auth,
				throw: true,
			});
			return res.data.content;
		},
	});

	// Fetch ALL bar restock requests (pending + history combined)
	const barRestockAllPromise = queryClient.ensureQueryData({
		queryKey: ["manager", "approvals", "bar-restock-all", id],
		queryFn: async () => {
			const res = await $fetch("@get/api/restaurants/bar-restock-requests", {
				query: { size: 200, hotelId: id },
				auth,
				throw: true,
			});
			return res.data.content;
		},
	});

	// Await all in parallel
	const summaryData = use(summaryPromise);
	const pendingData = use(pendingPromise);
	const historyData = use(historyPromise);
	const barRestockAll = use(barRestockAllPromise);

	const barRestockPending = barRestockAll.filter((r) => r.status === "PENDING");
	const barRestockHistory = barRestockAll.filter((r) => r.status !== "PENDING");

	return (
		<Approvals
			breadcrumbs={breadcrumbs}
			summaryData={summaryData}
			pendingData={pendingData}
			historyData={historyData}
			barRestockData={barRestockPending}
			barRestockHistory={barRestockHistory}
			hotelId={id}
		/>
	);
}

export default ApprovalsPage;
