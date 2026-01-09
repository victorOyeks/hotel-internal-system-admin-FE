import { ProductCatalogPage } from "@/components/roles/inventory/product-catalog-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader(
	{
		...paginationSearchParams,
	})

function Page({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: products, ...paginationMeta } = use(
		qc.ensureQueryData({
			queryKey: ["inventory", "products"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/inventories/products", {
					query,
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

	const { data: productsStats } = use(
		qc.ensureQueryData({
			queryKey: ["inventory", "products", "stats"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/inventories/products/statistics", {
					auth: {
						type: "Bearer",
						token,
					},
					signal,
					throw: true,
				});

				return response;
			},
		}),
	)

	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				title: "Product Catalog",
				breadcrumbs: [
					{
						href: "/dashboard",
						label: "Dashboard",
					},
					{
						href: "/dashboard/products",
						label: "Catalog",
					},
				],
			}}
		>
			<ProductCatalogPage products={products} paginationMeta={paginationMeta} productsStats={productsStats} />
		</BreadCrumbWrapper>
	);
}

export default Page;
