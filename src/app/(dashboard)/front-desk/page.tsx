import { FrontDeskStats, PendingMaintenanceNotifications, QuickActions } from "@/components/roles/front-desk/dashboard"
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";


type PageProps = {
  searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
      "room:search": parseAsString,
      "room:type": parseAsString,
})

function Page({ searchParams }: PageProps) {
    const { token } = use(getCookieData())!;
    const query = use(loadSearchParams(searchParams));
  
    const queryClient = getQueryClient();

    const { content: rooms } = use(
      queryClient.ensureQueryData({
        queryKey: ["front-desks", "rooms"],
        queryFn: async ({ signal }) => {
          const response = await $fetch("@get/api/front-desks/rooms", {
            query: {
              search: query["room:search"],
              roomType: query["room:type"],
              size: 5,
              page: 0,
            },
            signal,
            throw: true,
            auth: { type: "Bearer", token },
          });

          console.log("Rooms: ", response.data, query);

          return response.data;
        }
      })
    )
  return ( 
    <div className="space-y-4 px-4 py-4">
      <section className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div className="md:col-span-5 space-y-4">
        <FrontDeskStats />
        <QuickActions rooms={rooms} />
      </div>
      <div className="md:col-span-2">
        <PendingMaintenanceNotifications />
      </div>
      </section>

    </div>
  )
}


export default Page