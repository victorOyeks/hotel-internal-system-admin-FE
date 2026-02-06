import { RentalOrdersPage } from "@/components/roles/rentals/rental-orders";
import { $fetch } from "@/lib/fetch";
import { verifySession } from "@/lib/dal";

const breadcrumbs = {
  title: "Rental Orders",
  breadcrumbs: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Orders", href: "/rentals/orders" },
  ],
};

export default async function RentalOrdersPageRoute(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  await verifySession();
  const { token } = await verifySession();

  const page = Number(searchParams?.page) || 0;
  const size = Number(searchParams?.size) || 10;
  const search =
    typeof searchParams?.search === "string" ? searchParams.search : undefined;
  const status =
    typeof searchParams?.status === "string" && searchParams.status !== "all"
      ? searchParams.status
      : undefined;
  const paymentStatus =
    typeof searchParams?.paymentStatus === "string" &&
    searchParams.paymentStatus !== "all"
      ? searchParams.paymentStatus
      : undefined;

  const response = await $fetch("@get/api/hotels/rentals/orders", {
    query: {
      page,
      size,
      search,
      status,
      paymentStatus,
    },
    auth: {
      type: "Bearer",
      token,
    },
  });

  const orders = (response.data?.data.content || []).map((order) => ({
    ...order,
    totalAmount: order.totalAmount ?? 0,
    lateFees: order.lateFees ?? 0,
    rentalStartDate: order.rentalStartDate || new Date().toISOString(),
    rentalEndDate: order.rentalEndDate || new Date().toISOString(),
  }));

  const paginationMeta = {
    pageNumber: response.data?.data.pageNumber || 0,
    pageSize: response.data?.data.pageSize || 10,
    totalElements: response.data?.data.totalElements || 0,
    totalPages: response.data?.data.totalPages || 0,
    last: response.data?.data.last ?? true,
    first: response.data?.data.first ?? true,
  };

  return (
    <RentalOrdersPage
      orders={orders}
      paginationMeta={paginationMeta}
      breadcrumbs={breadcrumbs}
      currentPage={page}
    />
  );
}
