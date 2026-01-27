import { GRNPage } from "@/components/roles/inventory/grn-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

export default function Page({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { token } = use(getCookieData())!;
	const queryClient = getQueryClient();

	const { "supplier-search": supplierSearch, "location-search": locationSearch } =
		use(searchParams);

	const { content: grns } = use(
		queryClient.fetchQuery({
			queryKey: ["inventory-grns"],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/inventories/grn", {
					query: {},
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
						search: (locationSearch as string) || "",
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
						search: (supplierSearch as string) || "",
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

	const { "product-search": productSearch } = use(searchParams);

	const { content: products } = use(
		queryClient.ensureQueryData({
			queryKey: ["products", productSearch],
			queryFn: async ({ signal }) => {
				const res = await $fetch("@get/api/inventories/products", {
					query: {
						search: (productSearch as string) || "",
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

	console.log({
		grns,
		inventoryLocs,
	});

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
			/>
		</BreadCrumbWrapper>
	);
}


