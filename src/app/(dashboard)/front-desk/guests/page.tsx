import { GuestsLogPage } from "@/components/roles/front-desk/guests-page";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";
import { use } from "react";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
  ...paginationSearchParams,
  status: parseAsString,
  search: parseAsString,
  roomType: parseAsString,
}, {
  urlKeys: {
    status: "roomStatus",
  }
});

function Page({ searchParams }: PageProps) {
  const { token } = use(getCookieData())!;
  const query = use(loadSearchParams(searchParams));

  const queryClient = getQueryClient();

  const { content: guestLogs, ...pagination } = use(
    queryClient.ensureQueryData({
      queryKey: ["front-desks", "guests"],
      queryFn: async ({ signal }) => {
        const response = await $fetch("@get/api/front-desks/guest-logs", {
          query: {
            ...query,
            page: query.page ? query.page - 1 : 0,
          },
          signal,
          throw: true,
          auth: { type: "Bearer", token },
        });

        return response.data;
      },
    })
  );

  console.log(query)

  return (
    <GuestsLogPage
      breadcrumb={{
        title: "Guests Log",
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Guests Log", href: "/dashboard/guests" },
        ],
      }}
      paginationMeta={pagination}
      guests={guestLogs}
    />
  );
}

export default Page;
