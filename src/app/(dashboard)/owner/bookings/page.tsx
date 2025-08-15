import { BookingsPage } from "@/components/roles/hotel-owner/bookings";
import { $fetch, type BookingStatus } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getToken } from "@/lib/server-fns";
import { use } from "react";

function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const token = use(getToken())!;
  const searchParamsObj = use(searchParams);
  const queryClient = getQueryClient();

  const bookings = use(
    queryClient.fetchQuery({
      queryKey: ["hotel-owner-bookings", searchParamsObj],
      queryFn: async () => {
        const response = await $fetch("@get/api/hotel-owners/hotels/bookings", {
          query: {
            status: searchParamsObj.status as BookingStatus,
            checkInDate: searchParamsObj.checkInDate ? new Date(searchParamsObj.checkInDate).toISOString() : undefined,
            search: searchParamsObj.search,
            page: searchParamsObj.page ? Number(searchParamsObj.page) : 0,
            size: searchParamsObj.size ? Number(searchParamsObj.size) : 100,
          },
          auth: {
            type: "Bearer",
            token,
          },
          throw: true,
        });

        return response.data;
      },
    })
  );

  return (
    <BookingsPage
      bookings={bookings}
      breadcrumb={{
        title: "Bookings",
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Bookings", href: "/dashboard/bookings" },
        ],
      }}
    />
  );
}

export default Page;
