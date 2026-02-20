import { FinancialsDashboard } from "@/components/roles/financials/financials-dashboard";
import { getFinancialDashboard } from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { createLoader, type SearchParams } from "nuqs/server";
import { financialSearchParams } from "@/lib/search-params.financials.server";

const loadSearchParams = createLoader(financialSearchParams);

type PageProps = {
    searchParams: Promise<SearchParams>;
};

function Page({ searchParams }: PageProps) {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();
    const query = use(loadSearchParams(searchParams));

    // Prefetching logic or just ensuring data
    const dashboardStats = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "dashboard", cookieData.userId, query],
            queryFn: () => getFinancialDashboard({
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
                period: query.period || undefined
            })
        })
    );

    // Mock data if API returns null/undefined during development/testing if endpoints aren't fully ready
    // You might want to remove this once backend is fully verified to return strict shape
    const metrics = dashboardStats?.metrics || {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        grossProfitMargin: 0,
        revenueGrowth: 0,
        expenseGrowth: 0,
        occupancyRate: 0,
        revPAR: 0,
        adr: 0
    };

    const graphData = dashboardStats?.graphData || [];

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
                <p className="text-muted-foreground">
                    Monitor your hotel's financial health, revenue, and expenses.
                </p>
            </div>

            <FinancialsDashboard metrics={metrics} graphData={graphData} />
        </div>
    );
}

export default Page;