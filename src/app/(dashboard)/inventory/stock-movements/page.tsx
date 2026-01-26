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
}, {
    urlKeys: {
        search: "search",
        type: "type",
    }
});

export default function Page({ searchParams }: PageProps) {
    const { token } = use(getCookieData())!;
    const query = use(loadSearchParams(searchParams));
    const qc = getQueryClient();

    const { content: movements, ...paginationSchema } = use(qc.ensureQueryData({
        queryKey: ["stock-movements", query],
        queryFn: async () => {
            const res = await $fetch("@get/api/inventories/stock-movements", {
                auth: {
                    token,
                    type: "Bearer"
                },
                query: {
                    page: query.page < 1 ? query.page : query.page - 1,
                    size: query.size,
                    search: query.search,
                    movementType: query.type,
                },
                throw: true,
            })
            return res.data;
        },
    }));

    const locations = use(qc.ensureQueryData({
        queryKey: ["inventory-locations-list"],
        queryFn: async () => {
            const res = await $fetch("@get/api/inventories/locations/list", {
                auth: {
                    token,
                    type: "Bearer"
                },
                throw: true,
            });
            return res.data.map(l => ({ id: l.id, name: l.locationName }));
        }
    }));

    const products = use(qc.ensureQueryData({
        queryKey: ["inventory-products-list"],
        queryFn: async () => {
            const res = await $fetch("@get/api/inventories/products/list", {
                auth: {
                    token,
                    type: "Bearer"
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
