import { StockAdjustmentPage } from "@/components/roles/inventory/stock-adjustment-page";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { adjustmentSearchParams } from "@/lib/search-params.inventory.server";
import { createLoader, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	...paginationSearchParams,
	...adjustmentSearchParams,
});

function Page({ searchParams }: PageProps) {
	// 1. Get token
	const { token } = use(getCookieData())!;
	// 2. Parse search params
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	// 3. Fetch Data
	const { content: adjustments, ...paginationMeta } = use(
		qc.ensureQueryData({
			queryKey: ["inventory", "adjustments", query],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/inventories/adjustments", {
					query: {
						// Map search params to API query params
						page: query.page < 1 ? query.page : query.page - 1,
						size: query.size,
						search: query.search || undefined, // API doesn't support generic search yet?
						// API expects 'approved'/'posted' booleans for status filtering if strict, or maybe handles 'status' string?
						// Based on Step 391 (fetch.ts), query params are: approved, posted, adjustmentType...
						// I need to map `status` (PENDING_APPROVAL, APPROVED, POSTED, REJECTED) to API params.
						// Logic from `getStockAdjustments` (Step 401):
						approved:
							query.status === "APPROVED"
								? "true"
								: query.status === "PENDING_APPROVAL"
									? "false"
									: undefined,
						posted:
							query.status === "POSTED"
								? "true"
								: query.status === "PENDING_APPROVAL" || query.status === "APPROVED"
									? "false"
									: undefined,
						adjustmentType: query.type ? undefined : query.type,
						productId: query.productId || undefined,
						locationId: query.locationId || undefined,
						startDate: query.startDate || undefined,
						endDate: query.endDate || undefined,
					},
					auth: {
						type: "Bearer",
						token,
					},
					signal,
					throw: true,
				});

				return response.data;
			},
		}),
	);

	// 4. Fetch Stats (Optional / Mocked for now as no endpoint exists)
	// I'll keep the empty stats object pattern but maybe cleaner here.
	const emptyStats = {
		pendingApprovalCount: 0,
		pendingApprovalValue: 0,
		approvedCount: 0,
		postedCount: 0,
		totalAdjustments: 0,
	};

	return (
		<StockAdjustmentPage
			adjustments={adjustments}
			stats={emptyStats}
			paginationMeta={paginationMeta}
		/>
	);
}

export default Page;
