import { OtherIncomeTable } from "@/components/roles/financials/other-income-table";
import { getOtherIncome, getFinancialDashboard } from "@/lib/financials-actions";
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

    const data = (
        otherIncomeData && "data" in otherIncomeData && otherIncomeData.data && typeof otherIncomeData.data === "object" && "content" in otherIncomeData.data
            ? otherIncomeData.data.content
            : otherIncomeData && "content" in otherIncomeData
                ? otherIncomeData.content
                : []
    );

    const metrics = dashboardData
        ? { totalRevenue: dashboardData.totalRevenue, netProfit: dashboardData.netProfit, totalExpenses: dashboardData.totalExpenses }
        : undefined;

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Other Income",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Other Income", href: "/dashboard/other-income" },
                ],
            }}
        >
            <div className="p-4">
                <OtherIncomeTable data={data} metrics={metrics} />
            </div>
        </BreadCrumbWrapper>
    );
}

export default OtherIncomePage;
