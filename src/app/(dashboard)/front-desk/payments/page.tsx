
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch, type PaymentMethod, type PaymentStatus } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";
import { FrontDeskPaymentsTable } from "@/components/roles/front-desk/payments-table";

type PageProps = {
    searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
    search: parseAsString,
    method: parseAsString,
    status: parseAsString,
    startDate: parseAsString,
    endDate: parseAsString,
    ...paginationSearchParams,
});

function Page({ searchParams }: PageProps) {
    const { token } = use(getCookieData())!;
    const query = use(loadSearchParams(searchParams));

    const queryClient = getQueryClient();

    const { content, ...paginationMeta } = use(
        queryClient.ensureQueryData({
            queryKey: ["front-desks", "payments", query],
            queryFn: async ({ signal }) => {
                const response = await $fetch("@get/api/front-desks/payments", {
                    query: {
                        page: query.page ? query.page - 1 : 0,
                        size: query.size ?? 20,
                        search: query.search || undefined, // Use explicit undefined for nulls
                        method: (query.method as PaymentMethod) || undefined,
                        status: (query.status as PaymentStatus) || undefined,
                        startDate: query.startDate || undefined,
                        endDate: query.endDate || undefined,
                    },
                    signal,
                    throw: true,
                    auth: { type: "Bearer", token },
                });

                return response.data;
            },
        }),
    );

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Payments",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Front Desk", href: "/front-desk" },
                ],
            }}
        >
            <div className="space-y-4 px-4 py-4">
                <section>
                    <FrontDeskPaymentsTable data={content} paginationMeta={paginationMeta} />
                </section>
            </div>
        </BreadCrumbWrapper>
    );
}

export default Page;