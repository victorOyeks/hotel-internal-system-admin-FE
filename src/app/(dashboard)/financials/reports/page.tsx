import {
    getCashFlow,
    getProfitAndLoss,
    getConsumptionReport,
    getComprehensiveSummary,
    getRestaurantDetailedReport,
    getRestaurantRoomFoodSales,
    getRestaurantItemSalesDetail,
} from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { createLoader, type SearchParams } from "nuqs/server";
import { financialSearchParams } from "@/lib/search-params.financials.server";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TrendingUpIcon,
    DropletIcon,
    UtensilsIcon,
    PackageIcon,
    LayoutGridIcon,
} from "lucide-react";
import { ProfitLossStatement } from "@/components/roles/financials/profit-loss-statement";
import { CashFlowStatement } from "@/components/roles/financials/cash-flow-statement";
import { ConsumptionReport } from "@/components/roles/financials/consumption-report";
import { ComprehensiveSummary } from "@/components/roles/financials/comprehensive-summary";
import { RestaurantReports } from "@/components/roles/financials/restaurant-reports";
import { FinancialFilters } from "@/components/roles/financials/financial-filters";

const loadSearchParams = createLoader(financialSearchParams);

type PageProps = {
    searchParams: Promise<SearchParams>;
};

function ReportsPage({ searchParams }: PageProps) {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();
    const query = use(loadSearchParams(searchParams));

    // Start all promises in parallel before any use() calls
    const plPromise = queryClient.ensureQueryData({
        queryKey: ["financials", "profit-loss", cookieData.userId, query],
        queryFn: () =>
            getProfitAndLoss({
                startDate: query.startDate || "",
                endDate: query.endDate || "",
                period: query.period || "month",
            }),
    });

    const cashFlowPromise = queryClient.ensureQueryData({
        queryKey: ["financials", "cash-flow", cookieData.userId, query],
        queryFn: () =>
            getCashFlow({
                startDate: query.startDate || "",
                endDate: query.endDate || "",
                period: query.period || "month",
            }),
    });

    const consumptionPromise = queryClient.ensureQueryData({
        queryKey: ["financials", "consumption", cookieData.userId, query],
        queryFn: () =>
            getConsumptionReport({
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
                page: query.page,
                size: query.size,
            }),
    });

    const summaryPromise = queryClient.ensureQueryData({
        queryKey: ["financials", "comprehensive", cookieData.userId, query],
        queryFn: () =>
            getComprehensiveSummary({
                startDate: query.startDate,
                endDate: query.endDate,
            }),
    });

    const restaurantDetailedPromise = queryClient.ensureQueryData({
        queryKey: [
            "financials",
            "restaurant-detailed",
            cookieData.userId,
            query,
        ],
        queryFn: () =>
            getRestaurantDetailedReport({
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
            }),
    });

    const roomFoodSalesPromise = queryClient.ensureQueryData({
        queryKey: [
            "financials",
            "room-food-sales",
            cookieData.userId,
            query,
        ],
        queryFn: () =>
            getRestaurantRoomFoodSales({
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
                page: query.page ?? undefined,
                size: query.size ?? undefined,
            }),
    });

    const itemSalesPromise = queryClient.ensureQueryData({
        queryKey: ["financials", "item-sales", cookieData.userId, query],
        queryFn: () =>
            getRestaurantItemSalesDetail({
                startDate: query.startDate || undefined,
                endDate: query.endDate || undefined,
                page: query.page ?? undefined,
                size: query.size ?? undefined,
            }),
    });

    const plData = use(plPromise);
    const cashFlowData = use(cashFlowPromise);
    const consumptionData = use(consumptionPromise);
    const summaryData = use(summaryPromise);
    const restaurantDetailedData = use(restaurantDetailedPromise);
    const roomFoodSalesData = use(roomFoodSalesPromise);
    const itemSalesData = use(itemSalesPromise);

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
                        <h1 className="text-xl font-semibold text-primary">
                            Financial Reports
                        </h1>
                        <p className="text-sm text-gray-400">
                            Detailed statements and analysis of your financial
                            performance.
                        </p>
                    </div>
                    <FinancialFilters />
                </div>

                <Tabs defaultValue="pl" className="space-y-4">
                    <TabsList className="flex-wrap h-auto gap-1">
                        <TabsTrigger value="pl" className="gap-1.5">
                            <TrendingUpIcon className="size-3.5" />
                            Profit &amp; Loss
                        </TabsTrigger>
                        <TabsTrigger value="cash-flow" className="gap-1.5">
                            <DropletIcon className="size-3.5" />
                            Cash Flow
                        </TabsTrigger>
                        <TabsTrigger value="restaurant" className="gap-1.5">
                            <UtensilsIcon className="size-3.5" />
                            F&B
                        </TabsTrigger>
                        <TabsTrigger value="consumption" className="gap-1.5">
                            <PackageIcon className="size-3.5" />
                            Consumption
                        </TabsTrigger>
                        <TabsTrigger value="summary" className="gap-1.5">
                            <LayoutGridIcon className="size-3.5" />
                            Summary
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pl" className="space-y-4">
                        <ProfitLossStatement data={plData} />
                    </TabsContent>
                    <TabsContent value="cash-flow" className="space-y-4">
                        <CashFlowStatement data={cashFlowData} />
                    </TabsContent>
                    <TabsContent value="restaurant" className="space-y-4">
                        <RestaurantReports
                            detailedReport={restaurantDetailedData}
                            roomFoodSales={roomFoodSalesData}
                            itemSalesDetail={itemSalesData}
                        />
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
