import { compareFinancials } from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { createLoader, type SearchParams } from "nuqs/server";
import { compareSearchParams } from "@/lib/search-params.financials.server";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { PeriodComparison } from "@/components/roles/financials/period-comparison";

const loadSearchParams = createLoader(compareSearchParams);

type PageProps = {
    searchParams: Promise<SearchParams>;
};

function ComparePage({ searchParams }: PageProps) {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();
    const query = use(loadSearchParams(searchParams));

    // Default date ranges: P1 = last 30 days, P2 = prior 30 days
    const today = new Date();
    const p1End =
        query.period1End ??
        today.toISOString().split("T")[0];
    const p1Start =
        query.period1Start ??
        new Date(today.getTime() - 30 * 86_400_000)
            .toISOString()
            .split("T")[0];
    const p2End =
        query.period2End ??
        new Date(new Date(p1Start).getTime() - 86_400_000)
            .toISOString()
            .split("T")[0];
    const p2Start =
        query.period2Start ??
        new Date(new Date(p1Start).getTime() - 30 * 86_400_000)
            .toISOString()
            .split("T")[0];

    const comparisonPromise = queryClient.ensureQueryData({
        queryKey: [
            "financials",
            "compare",
            cookieData.userId,
            p1Start,
            p1End,
            p2Start,
            p2End,
        ],
        queryFn: () =>
            compareFinancials({
                period1Start: p1Start,
                period1End: p1End,
                period2Start: p2Start,
                period2End: p2End,
            }),
    });

    const comparisonData = use(comparisonPromise);

    const p1Label = `${p1Start} → ${p1End}`;
    const p2Label = `${p2Start} → ${p2End}`;

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Period Comparison",
                breadcrumbs: [
                    { label: "Financials", href: "/financials" },
                    { label: "Compare", href: "/financials/compare" },
                ],
            }}
        >
            <div className="space-y-4 px-2">
                <div>
                    <h1 className="text-xl font-semibold text-primary">
                        Period Comparison
                    </h1>
                    <p className="text-sm text-gray-400">
                        Select two date ranges below to compare financial
                        performance side by side.
                    </p>
                </div>

                <PeriodComparison
                    data={comparisonData}
                    period1Label={p1Label}
                    period2Label={p2Label}
                />
            </div>
        </BreadCrumbWrapper>
    );
}

export default ComparePage;
