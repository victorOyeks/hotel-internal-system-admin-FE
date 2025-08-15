import { HotelOwnerHotels } from "@/components/roles/hotel-owner/hotels";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getToken } from "@/lib/server-fns";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { use } from "react";
import { fromPromise } from "neverthrow";

function HotelsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] }> }) {
  const token = use(getToken()) as string;
  const searchParamsObj = use(searchParams);
  const query = {
    page: searchParamsObj.page ? Number(searchParamsObj.page) : 0,
    size: searchParamsObj.size ? Number(searchParamsObj.size) : 100,
  }

  const queryClient = getQueryClient();

  const hotels = use(
    queryClient.fetchQuery({
      queryKey: ["hotels", query],
      queryFn: async () => {
        const response = await fromPromise(
          $fetch("@get/api/hotel-owners/hotels", {
            auth: {
              type: "Bearer",
              token,
            },
            query,
            throw: true,
          }),
          (error) => new Error("Failed to fetch hotels", { cause: error }));
        if (response.isErr()) {
          throw response.error;
        }
        return response.value.data;
      },
    }),
  );

  const managers = use(
    queryClient.fetchQuery({
      queryKey: ["hotel-managers", query],
      queryFn: async () => {
        const response = await fromPromise(
          $fetch("@get/api/hotel-owners/managers", {
            auth: {
              type: "Bearer",
              token,
            },
            query: {
              page:0,
              size: 1000
            },
            throw: true,
          }),
          (error) => new Error("Failed to fetch hotel managers", { cause: error }));
        if (response.isErr()) {
          throw response.error;
        }
        return response.value.data;
      },
    }),
  );

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
      <HotelOwnerHotels breadcrumb={breadcrumb} hotels={hotels.content} managers={managers.content} />
    </HydrationBoundary>
  );
}

export default HotelsPage;
