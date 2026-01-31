import { StockMovementPage } from "@/components/roles/inventory/stock-movement-page";
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
    search: parseAsString,
    type: parseAsString,
    productSearch: parseAsString,
    locationSearch: parseAsString,
    startDate: parseAsString,
    endDate: parseAsString,
    productId: parseAsString,
    locationId: parseAsString,
}, {
    urlKeys: {
        search: "search",
        type: "type",
        productSearch: "product-list:search",
        locationSearch: "location-list:search",
        productId: "productId",
        locationId: "locationId",
    }
});

export default function Page({ searchParams }: PageProps) {
    const { token } = use(getCookieData())!;
    const searchParamsValues = use(loadSearchParams(searchParams));
    const qc = getQueryClient();

    const { content: movements, ...paginationSchema } = use(qc.ensureQueryData({
        queryKey: ["stock-movements", searchParamsValues],
        queryFn: async () => {
            const res = await $fetch("@get/api/inventories/stock-movements", {
                auth: {
                    token,
                    type: "Bearer"
                },
                query: {
                    page: searchParamsValues.page < 1 ? searchParamsValues.page : searchParamsValues.page - 1,
                    size: searchParamsValues.size,
                    search: searchParamsValues.search,
                    movementType: searchParamsValues.type,
                    startDate: searchParamsValues.startDate,
                    endDate: searchParamsValues.endDate,
                    productId: searchParamsValues.productId,
                    locationId: searchParamsValues.locationId,
                },
                throw: true,
            })

            return res.data;
        },
    }));

    const locations = use(qc.ensureQueryData({
        queryKey: ["inventory-locations-list", searchParamsValues.locationSearch],
        queryFn: async () => {
            const res = await $fetch("@get/api/inventories/locations/list", {
                auth: {
                    token,
                    type: "Bearer"
                },
                query: {
                    search: searchParamsValues.locationSearch ?? undefined
                },
                throw: true,
            });
            return res.data.map(l => ({ id: l.id, name: l.locationName }));
        }
    }));

    const products = use(qc.ensureQueryData({
        queryKey: ["inventory-products-list", searchParamsValues.productSearch],
        queryFn: async () => {
            const res = await $fetch("@get/api/inventories/products/list", {
                auth: {
                    token,
                    type: "Bearer"
                },
                query: {
                    search: searchParamsValues.productSearch ?? undefined
                },
                throw: true,
            });

            const data: any = res.data;
            if (Array.isArray(data)) {
                return data.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku }));
            } else if (Array.isArray(data.content)) {
                return data.content.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku }));
            }
            return [];
        }
    }));

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Inventory", href: "/dashboard/inventory" },
                ],
                title: "Stock Movements",
            }}
        >
            <StockMovementPage
                movements={movements}
                paginationSchema={paginationSchema}
                locations={locations}
                products={products}
            />
        </BreadCrumbWrapper>
    );
}
