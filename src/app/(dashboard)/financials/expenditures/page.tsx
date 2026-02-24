import { ExpenditureTable } from "@/components/roles/financials/expenditure-table";
import { getExpenditures, getOverdueExpenditures, getFinancialDashboard } from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { createLoader, type SearchParams } from "nuqs/server";
import { financialSearchParams } from "@/lib/search-params.financials.server";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { OverdueAlerts } from "@/components/roles/financials/overdue-alerts";
import type { Expenditure } from "@/lib/api-routes/financials";

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
                page: query.page,
                size: query.size
            })
        })
    );

    // Fetch Overdue Expenditures
    const overdueData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "expenditures", "overdue", cookieData.userId],
            queryFn: () => getOverdueExpenditures()
        })
    );

    // Fetch Dashboard metrics for earnings
    const dashboardData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "dashboard", cookieData.userId, query.startDate, query.endDate],
            queryFn: () => getFinancialDashboard({
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
            })
        })
    );

    const data = (expenditureData?.content || []) as Expenditure[];
    const totalPages = expenditureData?.totalPages || 0;
    const overdueItems = (overdueData || []) as Expenditure[];
    const metrics = dashboardData
        ? { totalRevenue: dashboardData.totalRevenue, netProfit: dashboardData.netProfit, totalExpenses: dashboardData.totalExpenses }
        : { totalRevenue: 0, netProfit: 0, totalExpenses: 0 };

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Expenditures",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Expenditures", href: "/dashboard/expenditures" },
                ],
            }}
        >
            <div className="p-4 space-y-4">
                <OverdueAlerts overdueItems={overdueItems} />

                <ExpenditureTable data={data} totalPages={totalPages} metrics={metrics} />
            </div>
        </BreadCrumbWrapper>
    );
}

export default ExpendituresPage;
