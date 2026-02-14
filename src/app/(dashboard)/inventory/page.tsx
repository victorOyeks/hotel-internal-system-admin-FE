import {
	InventoryDashboard,
	QuickActions,
} from "@/components/roles/inventory/dasboard";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
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
	const _query = use(loadSearchParams(searchParams));

	const queryClient = getQueryClient();
	const { data } = use(
		queryClient.ensureQueryData({
			queryKey: ["inventory-dashboard"],
			queryFn: async () => {
				const response = await $fetch("@get/api/inventories/dashboard", {
					auth: { type: "Bearer", token },
					query: {},
					throw: true,
				});

				return response;
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
		<BreadCrumbWrapper breadcrumbs={breadcrumb}>
			<div className="space-y-4 px-4 py-4">
				<QuickActions data={[]} />
				<InventoryDashboard dashboardData={data} />
			</div>
		</BreadCrumbWrapper>
	);
}

export default Page;
