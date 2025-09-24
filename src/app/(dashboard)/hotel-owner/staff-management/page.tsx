import { HotelOwnerStaff } from "@/components/roles/hotel-owner/staff-management";
import { verifySession } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { paginationSearchParams } from "@/lib/nuqs.server";
import { getQueryClient } from "@/lib/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  createLoader,
  parseAsString,
  parseAsStringLiteral,
  type SearchParams,
} from "nuqs/server";
import { use } from "react";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const hotelRoles = [
  "HOTEL_OWNER",
  "MANAGER",
  "FRONT_DESK",
  "MAINTENANCE",
  "INVENTORY",
  "BAR",
  "KITCHEN",
  "SUPER_ADMIN",
] as const;

const loadSearchParams = createLoader({
  ...paginationSearchParams,
  search: parseAsString.withDefault(""),
  role: parseAsStringLiteral(hotelRoles),
  status: parseAsString.withDefault(""),
});

function StaffManagementPage({ searchParams }: PageProps) {
  const session = use(verifySession());
  const query = use(loadSearchParams(searchParams));
  const queryClient = getQueryClient();
  const breadcrumb = {
    title: "Staff Management",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Staff Management", href: "/dashboard/staff-management" },
    ],
  };

  const { content, ...paginationMeta } = use(
    queryClient.ensureQueryData({
      queryKey: ["staffs", query],
      queryFn: async () => {
        const response = await $fetch("@get/api/hotel-owners/staff", {
          query: {
            ...query,
            page: query.page ? query.page - 1 : 0
          },
          auth: {
            type: "Bearer",
            token: session.token,
          },
          throw: true,
        });
        return response.data;
      },
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HotelOwnerStaff
        breadcrumb={breadcrumb}
        staffs={content}
        paginationMeta={paginationMeta}
      />
    </HydrationBoundary>
  );
}

export default StaffManagementPage;
