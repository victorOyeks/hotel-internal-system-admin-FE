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

    // Default: last complete month (P1) vs the month before (P2) — industry-standard MoM
    const today = new Date();
    const toISO = (d: Date) => d.toISOString().split("T")[0];
    // P1 = last complete calendar month
    const p1Start =
        query.period1Start ??
        toISO(new Date(today.getFullYear(), today.getMonth() - 1, 1));
    const p1End =
        query.period1End ??
        toISO(new Date(today.getFullYear(), today.getMonth(), 0));
    // P2 = the month before that
    const p2Start =
        query.period2Start ??
        toISO(new Date(today.getFullYear(), today.getMonth() - 2, 1));
    const p2End =
        query.period2End ??
        toISO(new Date(today.getFullYear(), today.getMonth() - 1, 0));

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

    const fmtLabel = (start: string, end: string) => {
        const s = new Date(`${start}T00:00:00`);
        const e = new Date(`${end}T00:00:00`);
        const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
        return s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
            ? monthFmt.format(s)
            : `${start} → ${end}`;
    };
    const p1Label = query.period1Start ? `${p1Start} → ${p1End}` : fmtLabel(p1Start, p1End);
    const p2Label = query.period2Start ? `${p2Start} → ${p2End}` : fmtLabel(p2Start, p2End);

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
