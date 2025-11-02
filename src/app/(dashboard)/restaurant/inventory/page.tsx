import { RestaurantInventoryPage } from "@/components/roles/kitchen/inventory";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { parseAsString } from "nuqs/server";
import {
  createLoader,
  parseAsStringLiteral,
  type SearchParams,
} from "nuqs/server";
import { use } from "react";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
  ...paginationSearchParams,
  section: parseAsStringLiteral(["restock"]),
  search: parseAsString,
  customId: parseAsString,
  department: parseAsStringLiteral([
    "RESTAURANT",
    "HOUSEKEEPING",
    "FRONT_DESK",
    "MAINTENANCE",
    "MANAGEMENT",
    "INVENTORY",
    "OTHER",
  ]),
  status: parseAsStringLiteral(["APPROVED", "PENDING", "REJECTED"]),
  startDate: parseAsString,
  endDate: parseAsString,
});

function Page({ searchParams }: PageProps) {
  const breadcrumbs = {
    title: "Inventory",
    breadcrumbs: [
      {
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        label: "Inventory",
        href: "/dashboard/inventory",
      },
    ],
  };

  const query = use(loadSearchParams(searchParams));
  const cookieData = use(getCookieData())!;
  const queryClient = getQueryClient();

  const statData = use(
    queryClient.ensureQueryData({
      queryKey: ["inventory-summary", cookieData.token],
      queryFn: async () => {
        const response = await $fetch(
          "@get/api/restaurants/bar-inventory-summary",
          {
            auth: { type: "Bearer", token: cookieData.token },
            throw: true,
          }
        );

        return response.data;
      },
    })
  );

  const { content, ...paginationMeta } = use(
    queryClient.ensureQueryData({
      queryKey: [query.section ?? "inventory", cookieData.token, query],
      queryFn: async ({ signal }) => {
        if (query.section === "restock") {
          const response = await $fetch(
            "@get/api/restaurants/bar-restock-requests",
            {
              auth: { type: "Bearer", token: cookieData.token },
              query: {
                ...query,
                startDate: query.startDate ? query.startDate : null,
                endDate: query.endDate ? query.endDate : null,
                page: query.page ? query.page - 1 : 0,
              },
              throw: true,
              signal,
            }
          );

          return response.data;
        }

        const response = await $fetch("@get/api/restaurants/stock", {
          auth: { type: "Bearer", token: cookieData.token },
          query: {
            ...query,
            page: query.page ? query.page - 1 : 0,
          },
          throw: true,
          signal,
        });

        return response.data;
      },
    })
  );

  return (
    <BreadCrumbWrapper breadcrumbs={breadcrumbs}>
      <RestaurantInventoryPage
        section={query.section}
        statData={statData}
        inventoryData={content}
        paginationMeta={paginationMeta}
      />
    </BreadCrumbWrapper>
  );
}

export default Page;
