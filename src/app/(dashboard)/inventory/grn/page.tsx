import { GRNPage } from "@/components/roles/inventory/grn-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { type SearchParams, createLoader, parseAsString } from "nuqs/server";
import { use } from "react";

const loadSearchParams = createLoader({
	search: parseAsString.withDefault(""),
	status: parseAsString,
	posted: parseAsString,
	"supplier-search": parseAsString.withDefault(""),
	"location-search": parseAsString.withDefault(""),
	"product-search": parseAsString.withDefault(""),
	"po-search": parseAsString.withDefault(""),
	...paginationSearchParams
});

type PageProps = {
	searchParams: Promise<SearchParams>;
};

export default function Page({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const queryClient = getQueryClient();

	const {
		"supplier-search": supplierSearch,
		"location-search": locationSearch,
		search,
		status,
		posted,
		"product-search": productSearch,
		"po-search": poSearch,
	} = use(loadSearchParams(searchParams));

	const { content: grns } = use(
		queryClient.fetchQuery({
			queryKey: ["inventory-grns", search, status, posted],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/inventories/grn", {
					query: {
						search,
						status: (status as any) || undefined,
						posted: (posted as any) || undefined,
					},
					auth: {
						type: "Bearer",
						token: token,
					},
					signal,
					throw: true,
				});

				return res.data;
			},
		}),
	);

	const { content: inventoryLocs } = use(
		queryClient.fetchQuery({
			queryKey: ["inventory-locs", locationSearch],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/inventories/locations", {
					query: {
						search: locationSearch,
					},
					auth: {
						type: "Bearer",
						token: token,
					},
					signal,
					throw: true,
				});

				return res.data;
			},
		}),
	);

	const statsData = use(
		queryClient.ensureQueryData({
			queryKey: ["stats-data"],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/inventories/grn/statistics", {
					signal,
					auth: {
						type: "Bearer",
						token,
					},
					throw: true,
				});

				return res.data;
			},
		}),
	);

	const { data: suppliers } = use(
		queryClient.ensureQueryData({
			queryKey: ["suppliers", supplierSearch],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/inventories/suppliers/list", {
					query: {
						search: supplierSearch,
					},
					auth: {
						type: "Bearer",
						token,
					},
					signal,
					throw: true,
				});

				return res;
			},
		}),
	);

	const products = use(
		queryClient.ensureQueryData({
			queryKey: ["products", productSearch],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/inventories/products/list", {
					query: {
						search: productSearch,
					},
					auth: {
						type: "Bearer",
						token,
					},
					signal,
					throw: true,
				});

				return res.data;
			},
		}),
	);

	const purchaseOrders = use(
		queryClient.ensureQueryData({
			queryKey: ["purchase-orders-list", poSearch],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/inventories/purchase-orders/list", {
					query: {
						search: poSearch,
					},
					auth: {
						type: "Bearer",
						token,
					},
					signal,
					throw: true,
				});

				return res.data;
			},
		}),
	)

	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				title: "Goods Receipt Notes",
				breadcrumbs: [
					{
						label: "Dashboard",
						href: "/dashboard",
					},
					{
						label: "GRN",
						href: "/grn",
					},
				],
			}}
		>
			<GRNPage
				statsData={statsData}
				grnsData={grns}
				grnLocations={inventoryLocs}
				suppliers={suppliers}
				products={products}
				purchaseOrders={purchaseOrders}
			/>
		</BreadCrumbWrapper>
	);
}


