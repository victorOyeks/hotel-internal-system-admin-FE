import { getCashFlow, getProfitAndLoss, getConsumptionReport, getComprehensiveSummary } from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { createLoader, type SearchParams } from "nuqs/server";
import { financialSearchParams } from "@/lib/search-params.financials.server";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfitLossStatement } from "@/components/roles/financials/profit-loss-statement";
import { CashFlowStatement } from "@/components/roles/financials/cash-flow-statement";
import { ConsumptionReport } from "@/components/roles/financials/consumption-report";
import { ComprehensiveSummary } from "@/components/roles/financials/comprehensive-summary";
import { FinancialFilters } from "@/components/roles/financials/financial-filters";

const loadSearchParams = createLoader(financialSearchParams);

type PageProps = {
    searchParams: Promise<SearchParams>;
};

function ReportsPage({ searchParams }: PageProps) {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();
    const query = use(loadSearchParams(searchParams));

    // Fetch Profit & Loss Data
    const plData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "profit-loss", cookieData.userId, query],
            queryFn: () => getProfitAndLoss({
                startDate: query.startDate || "",
                endDate: query.endDate || "",
                period: query.period || "month"
            })
        })
    );

    // Fetch Cash Flow Data
    const cashFlowData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "cash-flow", cookieData.userId, query],
            queryFn: () => getCashFlow({
                startDate: query.startDate || "",
                endDate: query.endDate || "",
                period: query.period || "month"
            })
        })
    );

    // Fetch Consumption Data
    const consumptionData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "consumption", cookieData.userId, query],
            queryFn: () => getConsumptionReport({
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
                page: query.page,
                size: query.size
            })
        })
    );

    // Fetch Comprehensive Summary
    const summaryData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "comprehensive", cookieData.userId, query],
            queryFn: () => getComprehensiveSummary({
                startDate: query.startDate,
                endDate: query.endDate
            })
        })
    );

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Financial Reports",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Reports", href: "/dashboard/reports" },
                ],
            }}
        >
            <div className="space-y-4 px-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h1 className="text-xl font-semibold text-primary">Financial Reports</h1>
                        <p className="text-sm text-gray-400">
                            Detailed statements and analysis of your financial performance.
                        </p>
                    </div>
                    <FinancialFilters />
                </div>

                <Tabs defaultValue="pl" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="pl">Profit &amp; Loss</TabsTrigger>
                        <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
                        <TabsTrigger value="consumption">Consumption</TabsTrigger>
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pl" className="space-y-4">
                        <ProfitLossStatement data={plData} />
                    </TabsContent>
                    <TabsContent value="cash-flow" className="space-y-4">
                        <CashFlowStatement data={cashFlowData} />
                    </TabsContent>
                    <TabsContent value="consumption" className="space-y-4">
                        <ConsumptionReport data={consumptionData} />
                    </TabsContent>
                    <TabsContent value="summary" className="space-y-4">
                        <ComprehensiveSummary data={summaryData} />
                    </TabsContent>
                </Tabs>
            </div>
        </BreadCrumbWrapper>
    );
}

export default ReportsPage;
