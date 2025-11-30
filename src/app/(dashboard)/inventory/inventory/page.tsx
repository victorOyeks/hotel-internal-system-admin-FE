import { QuickActions } from "@/components/roles/inventory/dasboard";
import { InventoryOfficerInventoryPage } from "@/components/roles/inventory/inventory-page";
import { $fetch, type InventoryItemResponse } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
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

const loadSearchParams = createLoader(
	{
		...paginationSearchParams,
		section: parseAsStringLiteral(["issued", "stock-request"]),
		searchName: parseAsString,
		customId: parseAsString,
		category: parseAsString,
		unit: parseAsString,
		availability: parseAsStringLiteral([
			"AVAILABLE",
			"OUT_OF_STOCK",
			"LOW_IN_STOCK",
		]),
		department: parseAsStringLiteral([
			"BAR",
			"KITCHEN",
			"HOUSEKEEPING",
			"FRONT_DESK",
			"MAINTENANCE",
			"MANAGEMENT",
			"INVENTORY",
			"OTHER",
		]),
		approvalStatus: parseAsStringLiteral(["APPROVED", "PENDING", "REJECTED"]),
		itemCustomId: parseAsString,
	},
	{
		urlKeys: {
			searchName: "item:search",
		},
	},
);

function InventoryPage({ searchParams }: PageProps) {
	const query = use(loadSearchParams(searchParams));
	const { token } = use(getCookieData())!;
	const queryClient = getQueryClient();

	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: [query.section ?? "all", query],
			queryFn: async () => {
				switch (query.section) {
					case "issued": {
						const response = await $fetch("@get/api/inventories/issued", {
							auth: { type: "Bearer", token },
							query: {
								...query,
								page: query.page ? query.page - 1 : 0,
							},
							throw: true,
						});

						return response.data;
					}
					case "stock-request": {
						const response = await $fetch(
							"@get/api/inventories/items/restock-requests",
							{
								auth: { type: "Bearer", token },
								query: {
									...query,
									page: query.page ? query.page - 1 : 0,
								},
								throw: true,
							},
						);

						return response.data;
					}
					default: {
						const response = await $fetch("@get/api/inventories/items", {
							auth: { type: "Bearer", token },
							query: {
								...query,
								page: query.page ? query.page - 1 : 0,
							},
							throw: true,
						});

						return response.data;
					}
				}
			},
		}),
	);

	return (
		<div className="space-y-4 px-4 py-4">
			<QuickActions data={content as InventoryItemResponse[]} />
			<InventoryOfficerInventoryPage
				breadcrumb={{
					breadcrumbs: [],
					title: "Inventory",
				}}
				data={content}
				section={query.section}
				paginationMeta={paginationMeta}
			/>
		</div>
	);
}

export default InventoryPage;
