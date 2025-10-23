import { LostItemPage } from "@/components/roles/front-desk/lost-&-found";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { getCookieData } from "@/lib/server-fns";
import { type SearchParams, createLoader, parseAsString } from "nuqs/server";
import { use } from "react";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const loadSearchParams = createLoader({
  ...paginationSearchParams,
  claimStatus: parseAsString,
  search: parseAsString,
  dateFrom: parseAsString,
  dateTo: parseAsString,
});

function Page({ searchParams }: PageProps) {
  const { token } = use(getCookieData())!;
  const query = use(loadSearchParams(searchParams));

  const queryClient = getQueryClient();

  const { content: lostItems, ...pagination } = use(
    queryClient.ensureQueryData({
      queryKey: ["front-desks", "lost-and-found"],
      queryFn: async ({ signal }) => {
        const response = await $fetch("@get/api/front-desks/lost-and-found", {
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

  return <LostItemPage data={lostItems} paginationMeta={pagination} />;
}

export default Page;
