import { BookingsPage } from "@/components/roles/front-desk/bookings";
import { $fetch, BookingStatus } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { type SearchParams, createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { use } from "react";
import z from "zod";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

// bookingStatus: BookingStatus,
    // search: z.enum(["CHECKED_IN", "CHECKED_OUT", "RESERVED", "AVAILABLE"]),

const loadSearchParams = createLoader({
  "room:search": parseAsString,
  "room:type": parseAsString,
  search: parseAsString,
  bookingStatus: parseAsStringLiteral([
    "CHECKED_IN",
    "CHECKED_OUT",
    "RESERVED",
    "CANCELLED",
  ]),
  roomType: parseAsString,
  ...paginationSearchParams,
});

function Page({ searchParams }: PageProps) {
  const cookieData = use(getCookieData())!;
  const queryClient = getQueryClient();
  const query = use(loadSearchParams(searchParams));

  const { content, ...paginationMeta } = use(
    queryClient.ensureQueryData({
      queryKey: ["front-desk-bookings"],
      queryFn: async () => {
        const response = await $fetch("@get/api/front-desks/bookings", {
          query: {
            ...query,
            
            page: query.page ? query.page - 1 : 0,
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

    const roomTypes = use(
    queryClient.ensureQueryData({
      queryKey: ["front-desks", "all-room-types"],
      queryFn: async ({ signal }) => {
        const response = await $fetch("@get/api/front-desks/all-room-types", {
          signal,
          throw: true,
          auth: { type: "Bearer", token: cookieData.token },
        });

        return response.data;
      },
    })
  );

  const rooms = use(
    queryClient.ensureQueryData({
      queryKey: ["front-desks", "rooms"],
      queryFn: async ({ signal }) => {
        const response = await $fetch(
          "@get/api/front-desks/all-rooms-by-type",
          {
            query: {
              roomType: query["room:type"] ?? roomTypes[0],
            },
            signal,
            throw: true,
            auth: { type: "Bearer", token: cookieData.token },
          }
        );

        return response.data;
      },
    })
  );

  return (
    <BookingsPage
      bookings={content}
      rooms={rooms}
      roomTypes={roomTypes}
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
