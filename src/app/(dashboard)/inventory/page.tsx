import {
	InventoryDashboard,
	InventoryStat,
	QuickActions,
} from "@/components/roles/inventory/dasboard";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
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
		searchName: parseAsString,
		customId: parseAsString,
		category: parseAsString,
		unit: parseAsString,
		availability: parseAsStringLiteral([
			"AVAILABLE",
			"LOW_IN_STOCK",
			"OUT_OF_STOCK",
		]),
		itemCustomId: parseAsString,
	},
	{
		urlKeys: {
			searchName: "item:search",
		},
	},
);

function Page({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));

	const queryClient = getQueryClient();
	const { content, ...paginationMeta } = use(
		queryClient.ensureQueryData({
			queryKey: ["inventory-items"],
			queryFn: async () => {
				const response = await $fetch("@get/api/inventories/items", {
					auth: { type: "Bearer", token },
					query: {
						...query,
						page: 0,
						size: 10,
					},
					throw: true,
				});

				return response.data;
			},
		}),
	);
	const inventoryStatData = use(
		queryClient.ensureQueryData({
			queryKey: ["inventory-stat"],
			queryFn: async () => {
				const response = await $fetch("@get/api/inventories/summary", {
					auth: { type: "Bearer", token },
					throw: true,
				});

				return response.data;
			},
		}),
	);

	const breadcrumb = {
		title: "Inventory",
		breadcrumbs: [
			{ label: "Dashboard", href: "/dashboard" },
			{ label: "Inventory", href: "/dashboard/inventory" },
		] satisfies Breadcrumb[],
	};

	return (
		<div className="space-y-4 px-4 py-4">
			<InventoryStat data={inventoryStatData} />
			<QuickActions data={content} />
			<InventoryDashboard
				breadcrumb={breadcrumb}
				content={content}
				paginationMeta={paginationMeta}
			/>
		</div>
	);
}

export default Page;
