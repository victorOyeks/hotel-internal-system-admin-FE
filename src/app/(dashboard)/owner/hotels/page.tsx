import { HotelOwnerHotels } from "@/components/roles/hotel-owner/hotels";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { use } from "react";
import { fromPromise } from "neverthrow";
import { revalidatePath } from "next/cache";

async function invalidatePage(
  query: Record<string, string | number | boolean>
) {
  const queryClient = getQueryClient();
  await queryClient.invalidateQueries({
    queryKey: ["hotels", query],
    exact: true,
  });
  await queryClient.invalidateQueries({
    queryKey: ["hotel-managers", query],
    exact: true,
  });
  revalidatePath("/owner/hotels");
}

function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] }>;
}) {
  const cookieData = use(getCookieData())!;
  const queryClient = getQueryClient();
  const searchParamsObj = use(searchParams);
  const query = {
    page: searchParamsObj.page ? Number(searchParamsObj.page) : 0,
    size: searchParamsObj.size ? Number(searchParamsObj.size) : 10,
  };

  const hotels = use(
    queryClient.ensureQueryData({
      queryKey: ["hotels", query],
      queryFn: async () => {
        const response = await fromPromise(
          $fetch("@get/api/hotel-owners/hotels", {
            auth: {
              type: "Bearer",
              token: cookieData.token,
            },
            query,
            throw: true,
          }),
          (error) => new Error("Failed to fetch hotels", { cause: error })
        );
        if (response.isErr()) {
          throw response.error;
        }
        return response.value.data;
      },
    })
  );

  const managers = use(
    queryClient.ensureQueryData({
      queryKey: ["hotel-managers", query],
      queryFn: async () => {
        const response = await fromPromise(
          $fetch("@get/api/hotel-owners/managers", {
            auth: {
              type: "Bearer",
              token: cookieData.token,
            },
            query: {
              page: 0,
              size: 10,
            },
            throw: true,
          }),
          (error) =>
            new Error("Failed to fetch hotel managers", { cause: error })
        );
        if (response.isErr()) {
          throw response.error;
        }
        return response.value.data;
      },
    })
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

  async function revalidate() {
    "use server";
    return invalidatePage(query);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HotelOwnerHotels
        breadcrumb={breadcrumb}
        hotels={hotels.content}
        managers={managers.content}
        revalidate={revalidate}
      />
    </HydrationBoundary>
  );
}

export default HotelsPage;
