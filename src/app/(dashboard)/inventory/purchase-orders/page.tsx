import { PurchaseOrderPage } from "@/components/roles/inventory/purchase-order-page";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
	searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
	...paginationSearchParams,
	productSearch: parseAsString,
	supplierSearch: parseAsString,
}, {
	urlKeys: {
		productSearch: "product-list:search",
		supplierSearch: "supplier-list:search",
	}
});

export default function Page({ searchParams }: PageProps) {
	const { token } = use(getCookieData())!;
	const query = use(loadSearchParams(searchParams));
	const qc = getQueryClient();

	const { content: orders } = use(qc.ensureQueryData({
		queryKey: ["purchase-orders", query],
		queryFn: async () => {
			const res = await $fetch("@get/api/inventories/purchase-orders", {
				auth: {
					token,
					type: "Bearer"
				},
				query: {
					page: query.page < 1 ? query.page : query.page - 1,
					size: query.size,
				},
				throw: true,
			})
			return res.data;
		},
	}));

	const stats = use(qc.ensureQueryData({
		queryKey: ["purchase-orders-stats"],
		queryFn: async () => {
			const res = await $fetch("@get/api/inventories/purchase-orders/statistics", {
				auth: {
					token,
					type: "Bearer"
				},
				throw: true,
			})
			return res.data;
		},
	}));

	const suppliers = use(qc.ensureQueryData({
		queryKey: ["suppliers", query],
		queryFn: async () => {
			const res = await $fetch("@get/api/inventories/suppliers/list", {
				auth: {
					token,
					type: "Bearer"
				},
				query: {
					search: query.supplierSearch // Assuming API supports search
				},
				throw: true,
			})
			return res.data;
		},
	}));

	console.log(suppliers)

	const products = use(qc.ensureQueryData({
		queryKey: ["products", query],
		queryFn: async () => {
			const res = await $fetch("@get/api/inventories/products/list", {
				auth: {
					token,
					type: "Bearer"
				},
				query: {
					search: query.productSearch
				},
				throw: true,
			})
			return res.data;
		},
	}));
	console.log({ stats })
	return (
		<BreadCrumbWrapper
			breadcrumbs={{
				title: "Purchase Orders",
				breadcrumbs: [
					{
						label: "Dashboard",
						href: "/dashboard",
					},
					{
						label: "Purchase Orders",
						href: "/dashboard/purchase-orders",
					},
				],
			}}
		>
			<PurchaseOrderPage
				orders={orders}
				stats={stats}
				suppliers={suppliers}
				products={products}
			/>
		</BreadCrumbWrapper>
	);
}
