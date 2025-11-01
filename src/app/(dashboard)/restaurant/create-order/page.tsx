import { OrderPage } from "@/components/roles/kitchen/create-order";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

function Page() {
    const cookieData = use(getCookieData())!;
    const queryClient = getQueryClient();

    const foodItems = use(queryClient.ensureQueryData({
      queryKey: ["restaurant", "food-items", cookieData.token],
      queryFn: async ({ signal }) => {
        const res = await $fetch("@get/api/restaurants/food-items/all", {
          signal,
          auth: { type: "Bearer", token: cookieData.token },
          throw: true,
        });
        return res.data;
      },
    }));

  return <OrderPage foodItems={foodItems} />;
}

export default Page;
