import { ProductCatalogPage } from "@/components/roles/inventory/product-catalog-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

function Page() {
	const { token } = use(getCookieData())!;
	const qc = getQueryClient();

	const { content: products } = use(
		qc.ensureQueryData({
			queryKey: ["inventory", "products"],
			queryFn: async ({ signal }) => {
				const response = await $fetch("@get/api/inventories/products", {
					query: {},
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
			<ProductCatalogPage products={products} />
		</BreadCrumbWrapper>
	);
}

export default Page;
