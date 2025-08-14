import { HotelOwnerHotels } from "@/components/roles/hotel-owner/hotels";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getToken } from "@/lib/server-fns";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { use } from "react";

function HotelsPage() {
  const token = use(getToken()) as string;

  const queryClient = getQueryClient();

  const hotels = use(queryClient.fetchQuery({
    queryKey: ["hotels"],
    queryFn: async () => {
      const response = await $fetch("@get/api/hotel-owners/hotels", {
        auth: {
          type: "Bearer",
          token,
        },
        throw: true,
      });
      return response.data;
    },
  }));

  const managers = use(queryClient.fetchQuery({
    queryKey: ['hotel-managers'],
    queryFn: async () => {
      const response = await $fetch("@get/api/hotel-owners/managers", {
        auth: {
          type: "Bearer",
          token,
        },
        throw: true,
      });
      return response.data;
    },
  }))

  const breadcrumb = {
    title: "Hotels",
    breadcrumbs: [
      {
        label: "Dashboard",
        href: "/owner",
      },
      {
        label: "Hotels",
        href: "/owner/hotels",
      },
    ],
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HotelOwnerHotels breadcrumb={breadcrumb} hotels={hotels} managers={managers} />
    </HydrationBoundary>
  );
}

export default HotelsPage;
