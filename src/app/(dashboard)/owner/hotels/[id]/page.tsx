import { ViewSingleHotelPage } from "@/components/roles/hotel-owner/view-single-hotel";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getToken } from "@/lib/server-fns";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { use } from "react";

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
}) {
  const { id } = use(params);
  const searchParamsObj = use(searchParams);
  const token = use(getToken())!;
  const queryClient = getQueryClient();

  const query = {
    page: searchParamsObj.page ? Number(searchParamsObj.page) : 0,
    size: searchParamsObj.size ? Number(searchParamsObj.size) : 100,
  }

  const rooms = use(
    queryClient.ensureQueryData({
      queryKey: ["hotel", id, query],
      queryFn: async () => {
        const response = await $fetch(
          "@get/api/hotel-owners/hotels/:hotelCustomId/rooms",
          {
            params: {
              hotelCustomId: id,
            },
            auth: {
              type: "Bearer",
              token: token,
            },
            query,
            throw: true,
          }
        );

        return response.data;
      },
    })
  );

  const breadcrumbs = {
    title: "Hotel Details",
    breadcrumbs: [
      {
        label: "Dashboard",
        href: "/home",
      },
      {
        label: "Hotels",
        href: "/hotels",
      },
      {
        label: rooms.content.length > 0 ? rooms.content[0].hotelName : "Hotel",
        href: `/owner/hotels/${id}`,
      },
    ],
  };
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ViewSingleHotelPage breadcrumbs={breadcrumbs} rooms={rooms.content} />
    </HydrationBoundary>
  );
}
