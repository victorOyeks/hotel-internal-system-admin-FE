import { getOverdueExpenditures } from "@/lib/financials-actions";
import { getCookieData } from "@/lib/server-fns";
import { getQueryClient } from "@/lib/queries";
import { use } from "react";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { OverdueExpendituresList } from "@/components/roles/financials/overdue-expenditures-list";
import type { Expenditure } from "@/lib/api-routes/financials";

function OverdueExpendituresPage() {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();

    const overdueData = use(
        queryClient.ensureQueryData({
            queryKey: ["financials", "expenditures", "overdue", cookieData.userId],
            queryFn: () => getOverdueExpenditures()
        })
    );

    const items = (overdueData || []) as Expenditure[];

    return (
        <BreadCrumbWrapper
            breadcrumbs={{
                title: "Overdue Expenditures",
                breadcrumbs: [
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Expenditures", href: "/dashboard/expenditures" },
                    { label: "Overdue", href: "/dashboard/expenditures/overdue" },
                ],
            }}
        >
            <div className="p-4">
                <OverdueExpendituresList items={items} />
            </div>
        </BreadCrumbWrapper>
    );
}

export default OverdueExpendituresPage;
