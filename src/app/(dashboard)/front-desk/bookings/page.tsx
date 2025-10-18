import { BookingsPage } from "@/components/roles/front-desk/bookings";
import { $fetch, BookingStatus } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { use } from "react";
import z from "zod";

const ParamsSchema = z
  .object({
    bookingStatus: BookingStatus,
    search: z.enum(["CHECKED_IN", "CHECKED_OUT", "RESERVED", "AVAILABLE"]),
    page: z.coerce.number().default(0),
    size: z.coerce.number().default(10),
  })
  .partial();

function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // /api/front-desks/bookings
  const searchParamsObj = use(searchParams);
  const cookieData = use(getCookieData())!;
  const queryClient = getQueryClient();
  const validatedParams = ParamsSchema.parse(searchParamsObj);

  const { content, ...paginationMeta } = use(
    queryClient.ensureQueryData({
      queryKey: ["front-desk-bookings"],
      queryFn: async () => {
        const response = await $fetch("@get/api/front-desks/bookings", {
          query: {
            ...validatedParams,
            page: validatedParams.page ? validatedParams.page - 1 : 0,
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
