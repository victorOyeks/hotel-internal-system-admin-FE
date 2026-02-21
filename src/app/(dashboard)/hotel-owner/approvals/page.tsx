import { OwnerApprovals } from "@/components/roles/hotel-owner/approvals";
import { getOwnerCurrentHotel, verifySession } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import type { Breadcrumb } from "@/lib/store";
import { use } from "react";

function ApprovalsPage() {
	const breadcrumbs: Breadcrumb[] = [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Approvals", href: "/dashboard/approvals" },
	];

	const session = use(verifySession());
	const queryClient = getQueryClient();
	const currentHotel = use(getOwnerCurrentHotel());

	if (!currentHotel) {
		return (
			<div className="p-6">
				<div className="bg-white p-8 rounded-2xl text-center">
					<p className="text-gray-500">
						Please select a hotel from the sidebar to view approvals.
					</p>
				</div>
			</div>
		);
	}

	const auth = { type: "Bearer" as const, token: session.token };
	const { id } = currentHotel;

	// Create all promises first (parallel pattern)
	const summaryPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "approvals", "summary", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/hotel-owner/approvals/pending/summary",
					{ query: { hotelId: id }, auth, throw: true },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	const pendingPromise = queryClient.ensureQueryData({
		queryKey: ["hotel-owner", "approvals", "pending", id],
		queryFn: async () => {
			try {
				const res = await $fetch(
					"@get/api/hotel-owner/approvals/pending",
					{ query: { hotelId: id, page: 0, size: 20 }, auth, throw: true },
				);
				return res.data;
			} catch {
				return null;
			}
		},
	});

	// Await all in parallel
	const summaryData = use(summaryPromise);
	const pendingData = use(pendingPromise);

	return (
		<OwnerApprovals
			breadcrumbs={breadcrumbs}
			summaryData={summaryData}
			pendingData={pendingData}
		/>
	);
}

export default ApprovalsPage;
