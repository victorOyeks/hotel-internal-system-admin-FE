import { $fetch } from "@/lib/fetch";
import { StockLevelPageContent } from "@/components/roles/inventory/stock-level-page";
import { getCookieData } from "@/lib/server-fns";
import {
    createLoader,
    parseAsBoolean,
    parseAsString,
    type SearchParams,
} from "nuqs/server";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { redirect } from "next/navigation";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";

const loadSearchParams = createLoader({
    ...paginationSearchParams,
    search: parseAsString,
    category: parseAsString,
    lowStock: parseAsBoolean,
    outOfStock: parseAsBoolean,
    locationId: parseAsString,
});

export default function Page({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = use(loadSearchParams(searchParams));
    const cookieData = use(getCookieData());
    const token = cookieData?.token;

    if (!token) {
        throw redirect("/auth");
    }

    const queryClient = getQueryClient();

    const data = use(
        queryClient.ensureQueryData({
            queryKey: ["stock-levels", params],
            queryFn: async () => {
                const response = await $fetch("@get/api/inventories/stock-levels", {
                    auth: { type: "Bearer", token },
                    query: {
                        page: params.page,
                        size: params.size,
                        search: params.search ?? undefined,
                        category: params.category ?? undefined,
                        lowStock: params.lowStock ?? undefined,
                        outOfStock: params.outOfStock ?? undefined,
                        locationId: params.locationId ?? undefined,
                    },
                    throw: true,
                });
                return response.data;
            },
        }),
    );

    if (!data) {
        return <div>Error loading stock levels</div>;
    }

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Stock Levels",
                breadcrumbs: [
                    {
                        label: "Inventory",
                        href: "/dashboard",
                    },
                    {
                        label: "Stock Levels",
                        href: "/dashboard/stock-levels",
                    },
                ],
            }}
        >
            <StockLevelPageContent
                data={data.content}
                paginationMeta={{
                    pageNumber: data.pageNumber,
                    pageSize: data.pageSize,
                    totalElements: data.totalElements,
                    totalPages: data.totalPages,
                    last: data.last,
                    first: data.first,
                }}
            />
        </BreadCrumbWrapper>
    );
}
