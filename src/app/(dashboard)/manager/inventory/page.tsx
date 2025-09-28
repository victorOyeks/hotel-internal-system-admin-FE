import { ManagerInventoryPage } from "@/components/roles/manager/inventory";
import { getManagerCurrentHotel } from "@/lib/dal";
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
  searchName: parseAsString,
  customId: parseAsString,
  category: parseAsStringLiteral([
    "BAR",
    "KITCHEN",
    "HOUSEKEEPING",
    "FRONT_DESK",
    "MAINTENANCE",
    "MANAGEMENT",
    "INVENTORY",
    "OTHER",
  ]),
  unit: parseAsString,
  availability: parseAsString,
  approvalStatus: parseAsStringLiteral(["APPROVED", "PENDING", "REJECTED"]),
  itemCustomId: parseAsString,
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

  const { id } = use(getManagerCurrentHotel())!;
  const query = use(loadSearchParams(searchParams));
  const cookieData = use(getCookieData())!;
  const queryClient = getQueryClient();

  const statData = use(
    queryClient.ensureQueryData({
      queryKey: ["inventory-summary", id],
      queryFn: async () => {
        const response = await $fetch(
          "@get/api/managers/:hotelId/inventories/summary",
          {
            params: { hotelId: id },
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
      queryKey: [query.section ?? "inventory", id, query],
      queryFn: async ({ signal }) => {

        if (query.section === "restock") {
          const response = await $fetch(
            "@get/api/managers/:hotelId/inventories/restock-requests",
            {
              params: { hotelId: id },
              auth: { type: "Bearer", token: cookieData.token },
              query: {
                ...query,
                page: query.page ? query.page - 1 : 0,
              },
              throw: true,
              signal
            }
          );

          return response.data;
        }

        const response = await $fetch(
          "@get/api/managers/:hotelId/inventories",
          {
            params: { hotelId: id },
            auth: { type: "Bearer", token: cookieData.token },
            query: {
              ...query,
              page: query.page ? query.page - 1 : 0,
            },
            throw: true,
            signal
          }
        );

        return response.data;
      }
    })
  );

  console.log({ query, content });

  return (
    <ManagerInventoryPage
      section={query.section}
      breadcrumbs={breadcrumbs}
      statData={statData}
      inventoryData={content}
      paginationMeta={paginationMeta}
    />
  );
}

export default Page;
