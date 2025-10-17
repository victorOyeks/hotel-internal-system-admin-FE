import { BookingsPage } from "@/components/roles/front-desk/bookings";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";

function Page() {
  // /api/front-desks/bookings
  // const searchParamsObj = use(searchParams);
  const cookieData = use(getCookieData())!;
  const queryClient = getQueryClient();

  const { content, ...paginationMeta } = use(
    queryClient.ensureQueryData({
      queryKey: ["front-desk-bookings"],
      queryFn: async () => {
        const response = await $fetch("@get/api/front-desks/bookings", {
          query: {
            page: 0,
          },
          auth: {
            type: "Bearer",
            token: cookieData.token,
          },
          throw: true,
        });

        return response.data;
      },
    })
  );

  return (
    <BookingsPage
      bookings={content}
      breadcrumb={{
        title: "Bookings",
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Bookings", href: "/dashboard/bookings" },
        ],
      }}
      paginationMeta={paginationMeta}
    />
  );
}

export default Page;
