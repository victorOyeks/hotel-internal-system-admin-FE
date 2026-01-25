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
}, {
    urlKeys: {
        search: "search",
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
                },
                throw: true,
            })
            return res.data;
        },
    }))

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
            />
        </BreadCrumbWrapper>
    );
}
