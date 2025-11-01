import {
  KitchenToolbar,
  Orders,
  QuickActions,
} from "@/components/roles/kitchen/dashboard";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import {
  createLoader,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringLiteral,
  type SearchParams,

} from "nuqs/server";
import { use } from "react";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
  searchText: parseAsString,
  startDate: parseAsIsoDateTime,
  endDate: parseAsIsoDateTime,
  status: parseAsStringLiteral(["PENDING", "COMPLETED", "CANCELLED"]),
  ...paginationSearchParams,
});

function Page({ searchParams }: PageProps) {
  const cookieData = use(getCookieData())!;
  const queryClient = getQueryClient();
  const query = use(loadSearchParams(searchParams));

  const { content, ...paginationProps } = use(
    queryClient.ensureQueryData({
      queryKey: ["restaurant", "dashboard-data", cookieData.token],
      queryFn: async ({ signal }) => {
        const res = await $fetch("@get/api/restaurants/kitchen-orders", {
          //@ts-expect-error -- IGNORE --
          query: {
            ...query,
            page: query.page ? query.page - 1 : 0,
          },
          signal,
          auth: { type: "Bearer", token: cookieData.token },
          throw: true,
        });
        return res.data;
      },
    })
  );

  return (
    <BreadCrumbWrapper
      breadcrumbs={{
        title: "Restaurant",
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
        ] satisfies Breadcrumb[],
      }}
    >
      <div className="space-y-4 px-4 py-4">
        <QuickActions />
        <KitchenToolbar />
        <Orders orders={content} pagination={paginationProps} />
      </div>
    </BreadCrumbWrapper>
  );
}

export default Page;
