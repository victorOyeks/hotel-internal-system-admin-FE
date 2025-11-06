import { FoodItemsManagement } from "@/components/roles/kitchen/item-management";
import { BreadCrumbWrapper } from "@/components/shared/BreadCrumbWrapper";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
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
  itemType: parseAsStringLiteral(["FOOD", "DRINK"]).withDefault("FOOD"),
});

function Page({ searchParams }: PageProps) {
  const cookieData = use(getCookieData())!;
  const queryClient = getQueryClient();
  const query = use(loadSearchParams(searchParams));

  const items = use(
    queryClient.ensureQueryData({
      queryKey: ["restaurant", "item-management", cookieData.token, query],
      queryFn: async ({ signal }) => {
        const res = await $fetch("@get/api/restaurants/items/all", {
          query: {
            itemType: query.itemType,
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
        title: "Item Management",
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Restaurant", href: "/dashboard/restaurant" },
          { label: "Item Management", href: "/dashboard/restaurant/item-management" },
        ] satisfies Breadcrumb[],
      }}
    >
      <div className="space-y-4 px-4 py-4">
        <FoodItemsManagement items={items} />
      </div>
    </BreadCrumbWrapper>
  );
}

export default Page;