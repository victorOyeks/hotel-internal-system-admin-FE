import { ViewSingleHotelPage } from "@/components/roles/hotel-owner/view-single-hotel";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getToken } from "@/lib/server-fns";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { use } from "react";

export default function Page({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = use(params);
  const token = use(getToken())!;
  const queryClient = getQueryClient();
  const rooms = use(
    queryClient.ensureQueryData({
      queryKey: ["hotel", id],
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
        label: `Room Detail`,
        href: `/owner/hotels/${id}`,
      },
    ],
  };
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ViewSingleHotelPage breadcrumbs={breadcrumbs} rooms={rooms} />
    </HydrationBoundary>
  );
}
