import { FinancialsDashboard } from "@/components/roles/financials/financials-dashboard";
import { getFinancialDashboard } from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { createLoader, type SearchParams } from "nuqs/server";
import { financialSearchParams } from "@/lib/search-params.financials.server";
import { FinancialFilters } from "@/components/roles/financials/financial-filters";

const loadSearchParams = createLoader(financialSearchParams);

type PageProps = {
    searchParams: Promise<SearchParams>;
};

function Page({ searchParams }: PageProps) {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();
    const query = use(loadSearchParams(searchParams));

    const dashboardData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "dashboard", cookieData.userId, query],
            queryFn: () =>
                getFinancialDashboard({
                    startDate: query.startDate || undefined,
                    endDate: query.endDate || undefined,
                    period: query.period || undefined,
                }),
        })
    );

    const graphData = dashboardData?.trendData ?? [];

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
                    <p className="text-muted-foreground">
                        Monitor your hotel's financial health, revenue, and expenses.
                    </p>
                </div>
                <FinancialFilters />
            </div>
            <FinancialsDashboard metrics={dashboardData ?? undefined} graphData={graphData} />
        </div>
    );
}

export default Page;