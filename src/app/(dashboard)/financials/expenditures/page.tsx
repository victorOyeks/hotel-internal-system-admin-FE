import { ExpenditureTable } from "@/components/roles/financials/expenditure-table";
import { getExpenditures } from "@/lib/financials-actions";
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

function ExpendituresPage({ searchParams }: PageProps) {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();
    const query = use(loadSearchParams(searchParams));

    // Using ensureQueryData for RSC data fetching
    const expenditureData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "expenditures", cookieData.userId, query],
            queryFn: () => getExpenditures({
                search: query.search || undefined,
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
                // category: query.category || undefined, // Not in getExpenditures signature currently but might be needed
                page: query.page,
                size: query.size
            })
        })
    );

    const data = expenditureData?.content || [];

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Expenditures",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Financials", href: "/dashboard/financials" },
                    { label: "Expenditures", href: "/dashboard/financials/expenditures" },
                ],
            }}
        >
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Expenditures</h1>
                    <p className="text-muted-foreground">
                        Track and manage hotel expenses and outgoing payments.
                    </p>
                </div>

                <ExpenditureTable data={data} />
            </div>
        </BreadCrumbWrapper>
    );
}

export default ExpendituresPage;
