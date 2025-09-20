import { BookingsPage } from "@/components/roles/hotel-owner/bookings";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";
import z from "zod";


const ParamsSchema = z.object({
  roomType: z.string(),
  search: z.string(),
  bookingStatus: z.string(),
  page: z.coerce.number().default(0),
  size: z.coerce.number().default(10),
}).partial();

function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const cookieData = use(getCookieData())!;
  const searchParamsObj = use(searchParams);
  const queryClient = getQueryClient();
  const validatedParams = ParamsSchema.parse(searchParamsObj);

  const { content, ...paginationProps } = use(
    queryClient.ensureQueryData({
      queryKey: ["hotel-owner-bookings", validatedParams],
      queryFn: async () => {
        const response = await $fetch("@get/api/hotel-owners/hotels/bookings", {
          query: validatedParams,
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
      paginationMeta={paginationProps}
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
