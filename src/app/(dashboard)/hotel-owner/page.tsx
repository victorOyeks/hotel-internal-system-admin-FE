import { HotelOwnerDashboard } from "@/components/roles/hotel-owner/dashboard";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import type { Breadcrumb } from "@/lib/store";
import { use } from "react";

function HomePage() {
  const cookieData = use(getCookieData())!;
  const queryClient = getQueryClient();

  const breadcrumbs: Breadcrumb[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
  ];

  const graphData = use(
    queryClient.ensureQueryData({
      queryKey: ["hotel-owner", "dashboard-graph"],
      queryFn: async ({ signal }) => {
        const res = await $fetch("@get/api/hotel-owners/dashboard/graph", {
          signal,
          auth: {
            type: "Bearer",
            token: cookieData.token,
          },
          throw: true,
        });

        return res.data;
      },
    })
  );

  const overviewData = use(
    queryClient.ensureQueryData({
      queryKey: ["hotel-owner", "dashboard-overview"],
      queryFn: async ({ signal }) => {
        const res = await $fetch("@get/api/hotel-owners/dashboard/overview", {
          query: {},
          signal,
          auth: { type: "Bearer", token: cookieData.token },
          throw: true,
        });

        return res.data;
      },
    })
  );

  return (
    <HotelOwnerDashboard
      overviewData={overviewData}
      breadcrumbs={breadcrumbs}
      graphData={graphData}
    />
  );
}

export default HomePage;
