import { FinancialsDashboard } from "@/components/roles/financials/financials-dashboard";
import {
    getFinancialDashboard,
    getRevenue,
    getOverdueExpenditures,
    getTodaySummary,
    getThisWeekSummary,
} from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { createLoader, type SearchParams } from "nuqs/server";
import { financialSearchParams } from "@/lib/search-params.financials.server";
import { FinancialFilters } from "@/components/roles/financials/financial-filters";
import type { Expenditure } from "@/lib/api-routes/financials";

const loadSearchParams = createLoader(financialSearchParams);

type PageProps = {
    searchParams: Promise<SearchParams>;
};

function Page({ searchParams }: PageProps) {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();
    const query = use(loadSearchParams(searchParams));

    // Start all promises before any use() calls for parallel execution
    const dashboardPromise = queryClient.ensureQueryData({
        queryKey: ["financials", "dashboard", cookieData.userId, query],
        queryFn: () =>
            getFinancialDashboard({
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
                period: query.period || undefined,
            }),
    });

    const revenuePromise = queryClient.ensureQueryData({
        queryKey: ["financials", "revenue", cookieData.userId, query],
        queryFn: () =>
            getRevenue({
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
                period: query.period || undefined,
            }),
    });

    const overduePromise = queryClient.ensureQueryData({
        queryKey: ["financials", "expenditures", "overdue", cookieData.userId],
        queryFn: () => getOverdueExpenditures(),
    });

    const todayPromise = queryClient.ensureQueryData({
        queryKey: ["financials", "today", cookieData.userId],
        queryFn: () => getTodaySummary(),
    });

    const thisWeekPromise = queryClient.ensureQueryData({
        queryKey: ["financials", "this-week", cookieData.userId],
        queryFn: () => getThisWeekSummary(),
    });

    const dashboardData = use(dashboardPromise);
    const revenueData = use(revenuePromise);
    const overdueData = use(overduePromise);
    const todayData = use(todayPromise);
    const thisWeekData = use(thisWeekPromise);

    const graphData = dashboardData?.trendData ?? [];
    const overdueExpenditures = ((overdueData as any)?.content ?? overdueData ?? []) as Expenditure[];

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
            <FinancialsDashboard
                metrics={dashboardData ?? undefined}
                graphData={graphData}
                revenueBreakdown={revenueData ?? undefined}
                overdueExpenditures={overdueExpenditures}
                todayData={todayData}
                thisWeekData={thisWeekData}
            />
        </div>
    );
}

export default Page;
