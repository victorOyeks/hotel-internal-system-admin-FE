import { BookingsPage } from "@/components/roles/hotel-owner/bookings";
import { $fetch, type BookingStatus } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { format } from "date-fns";
import { use } from "react";

function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const token = use(getCookieData())!;
  const searchParamsObj = use(searchParams);
  const queryClient = getQueryClient();

  const bookings = use(
    queryClient.fetchQuery({
      queryKey: ["hotel-owner-bookings", searchParamsObj],
      queryFn: async () => {
        const response = await $fetch("@get/api/hotel-owners/hotels/bookings", {
          query: {
            status: (searchParamsObj.status || "CHECKED_IN") as BookingStatus,
            // yyyy-mm-dd format
            checkInDate: searchParamsObj.checkInDate
              ? format(new Date(searchParamsObj.checkInDate), "yyyy-MM-dd")
              : format(new Date(), "yyyy-MM-dd"),
            search: searchParamsObj.search || undefined,
            page: searchParamsObj.page || 1,
            size: searchParamsObj.size || 100,
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
      bookings={bookings.content}
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
