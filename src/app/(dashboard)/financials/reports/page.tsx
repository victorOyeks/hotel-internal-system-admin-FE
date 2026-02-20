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
                startDate: query.startDate || "",
                endDate: query.endDate || "",
                page: "0",
                size: "20"
            })
        })
    );

    // Fetch Comprehensive Summary
    const summaryData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "comprehensive", cookieData.userId, query],
            queryFn: () => getComprehensiveSummary({
                startDate: query.startDate || "",
                endDate: query.endDate || ""
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
            <div className="p-4 space-y-6">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">
                        Detailed statements and analysis of your financial performance.
                    </p>
                </div>

                <Tabs defaultValue="pl" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <TabsList>
                            <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
                            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
                            <TabsTrigger value="consumption">Consumption</TabsTrigger>
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                        </TabsList>
                    </div>

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
