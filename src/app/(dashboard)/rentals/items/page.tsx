import { RentalItemsPage } from "@/components/roles/rentals/rental-items";
import { $fetch } from "@/lib/fetch";
import { verifySession } from "@/lib/dal";

const breadcrumbs = {
  title: "Rental Items",
  breadcrumbs: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Rental Items", href: "/rentals/items" },
  ],
};

export default async function RentalItemsPageRoute(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  await verifySession(); // Ensure user is authenticated
  const { token } = await verifySession();

  const page = Number(searchParams?.page) || 0;
  const size = Number(searchParams?.size) || 10;
  const search =
    typeof searchParams?.search === "string" && searchParams.search.length > 0
      ? searchParams.search
      : undefined;

  // Status filter logic
  let activeOnly: boolean | undefined = undefined;
  if (searchParams?.status === "available") {
    activeOnly = true;
  } else if (searchParams?.status === "active") {
    activeOnly = true;
  }

  const category =
    typeof searchParams?.category === "string" &&
    searchParams.category !== "all"
      ? searchParams.category
      : undefined;

  const response = await $fetch("@get/api/hotels/rentals/items", {
    query: {
      page,
      size,
      search,
      category,
      activeOnly,
    },
    auth: {
      type: "Bearer",
      token,
    },
  });

  const items = Array.isArray(response.data?.data) ? response.data.data : [];

  const paginationMeta = {
    pageNumber: 0,
    pageSize: items.length > 0 ? items.length : 10,
    totalElements: items.length,
    totalPages: 1,
    last: true,
    first: true,
  };

  return (
    <RentalItemsPage
      items={items}
      paginationMeta={paginationMeta}
      breadcrumbs={breadcrumbs}
    />
  );
}
