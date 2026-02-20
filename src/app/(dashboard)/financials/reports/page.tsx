import { ProfitLossStatement } from "@/components/roles/financials/profit-loss-statement";
import { CashFlowStatement } from "@/components/roles/financials/cash-flow-statement";
import { getProfitAndLoss, getCashFlow } from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { createLoader, type SearchParams } from "nuqs/server";
import { financialSearchParams } from "@/lib/search-params.financials.server";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const loadSearchParams = createLoader(financialSearchParams);

type PageProps = {
    searchParams: Promise<SearchParams>;
};

function ReportsPage({ searchParams }: PageProps) {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();
    const query = use(loadSearchParams(searchParams));

    // Default dates if not provided (e.g., current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const startDate = query.startDate || firstDay;
    const endDate = query.endDate || lastDay;

    // Fetch Profit & Loss
    const plData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "pnl", cookieData.userId, startDate, endDate],
            queryFn: () => getProfitAndLoss({
                startDate,
                endDate
            })
        })
    );

    // Fetch Cash Flow - using mocked data structure for now as backend might not match perfectly
    // or return null. Using ensureQueryData largely.
    const cfData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "cash-flow", cookieData.userId, startDate, endDate],
            queryFn: async () => {
                const res = await getCashFlow({ startDate, endDate });
                // If response is null/empty, we might want to return null/empty structure
                // But let's assume valid response for now or null
                return res;
            }
        })
    );


    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Financial Reports",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Financials", href: "/dashboard/financials" },
                    { label: "Reports", href: "/dashboard/financials/reports" },
                ],
            }}
        >
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">
                        Comprehensive financial statements for performance analysis.
                    </p>
                </div>

                <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <InfoIcon className="h-4 w-4 text-blue-800" />
                    <AlertTitle>Reporting Period</AlertTitle>
                    <AlertDescription>
                        Showing reports for <strong>{startDate}</strong> to <strong>{endDate}</strong>.
                        Use the filters to change the period.
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="pnl" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
                        <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pnl">
                        <ProfitLossStatement data={plData} />
                    </TabsContent>
                    <TabsContent value="cash-flow">
                        {/* Pass cfData. If types mismatch, we'll need to adapt or mock in fetcher */}
                        <CashFlowStatement data={cfData} />
                    </TabsContent>
                </Tabs>
            </div>
        </BreadCrumbWrapper>
    );
}

export default ReportsPage;
