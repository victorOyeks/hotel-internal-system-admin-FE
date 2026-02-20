import { OtherIncomeTable } from "@/components/roles/financials/other-income-table";
import { getOtherIncome } from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { createLoader, type SearchParams } from "nuqs/server";
import { financialSearchParams } from "@/lib/search-params.financials.server";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";

const loadSearchParams = createLoader(financialSearchParams);

type PageProps = {
    searchParams: Promise<SearchParams>;
};

function OtherIncomePage({ searchParams }: PageProps) {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();
    const query = use(loadSearchParams(searchParams));

    // Using ensureQueryData for RSC data fetching
    const otherIncomeData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "other-income", cookieData.userId, query],
            queryFn: () => getOtherIncome({
                search: query.search || undefined,
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
                category: query.category || undefined,
                page: query.page,
                size: query.size
            })
        })
    );

    const data = otherIncomeData?.content || [];

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Other Income",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Financials", href: "/dashboard/financials" },
                    { label: "Other Income", href: "/dashboard/financials/other-income" },
                ],
            }}
        >
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Other Income</h1>
                    <p className="text-muted-foreground">
                        Manage miscellaneous income sources for the hotel.
                    </p>
                </div>

                <OtherIncomeTable data={data} />
            </div>
        </BreadCrumbWrapper>
    );
}

export default OtherIncomePage;
