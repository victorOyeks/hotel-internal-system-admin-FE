import { StockAdjustmentPage } from "@/components/roles/inventory/stock-adjustment-page";
import { $fetch } from "@/lib/fetch";
import { getProducts, getStorageLocations } from "@/lib/inventory-actions";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { adjustmentSearchParams } from "@/lib/search-params.inventory.server";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	...paginationSearchParams,
	...adjustmentSearchParams,
	productSearch: parseAsString.withDefault(""),
	locationSearch: parseAsString.withDefault(""),
});

function Page({ searchParams }: PageProps) {
	// 1. Get token
	const { token } = use(getCookieData())!;
	// 2. Parse search params
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const products = use(
		qc.ensureQueryData({
			queryKey: ["products", query.productSearch],
			queryFn: async () => {
				const res = await getProducts(query.productSearch);
				if (res.success && res.data) {
					return res.data;
				}
				return [];
			},
		}),
	);

	const locations = use(
		qc.ensureQueryData({
			queryKey: ["locations", query.locationSearch],
			queryFn: async () => {
				const res = await getStorageLocations(query.locationSearch);
				if (res.success && res.data) {
					return res.data;
				}
				return [];
			},
		}),
	);

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
									: null,
						posted:
							query.status === "POSTED"
								? "true"
								: query.status === "PENDING_APPROVAL" || query.status === "APPROVED"
									? "false"
									: null,
						adjustmentType: query.type,
						productId: query.productId,
						locationId: query.locationId,
						startDate: query.startDate,
						endDate: query.endDate,
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
			products={products}
			locations={locations}
		/>
	);
}

export default Page;
