import { OverdueRentalsPage } from "@/components/roles/rentals/overdue-rentals";
import { $fetch } from "@/lib/fetch";
import { verifySession } from "@/lib/dal";
import { differenceInDays } from "date-fns";

const breadcrumbs = {
  title: "Overdue Rentals",
  breadcrumbs: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Overdue Rentals", href: "/rentals/overdue" },
  ],
};

export default async function OverdueRentalsPageRoute(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  await verifySession();
  const { token } = await verifySession();

  const page = Number(searchParams?.page) || 0;
  const size = Number(searchParams?.size) || 10;

  const response = await $fetch("@get/api/hotels/rentals/orders", {
    query: {
      page,
      size,
      status: "OVERDUE",
    },
    auth: {
      type: "Bearer",
      token,
    },
  });

  const orders = response.data?.data.content || [];

  const overdueOrders = orders.map((order) => {
    const daysOverdue = differenceInDays(
      new Date(),
      new Date(order.rentalEndDate),
    );
    return {
      ...order,
      daysOverdue: Math.max(0, daysOverdue),
      lateFees: 0, // Placeholder as API doesn't return this yet
    };
  });

  const paginationMeta = {
    pageNumber: response.data?.data.pageNumber || 0,
    pageSize: response.data?.data.pageSize || 10,
    totalElements: response.data?.data.totalElements || 0,
    totalPages: response.data?.data.totalPages || 0,
    last: response.data?.data.last ?? true,
    first: response.data?.data.first ?? true,
  };

  return (
    <OverdueRentalsPage
      orders={overdueOrders}
      paginationMeta={paginationMeta}
      breadcrumbs={breadcrumbs}
      currentPage={page}
    />
  );
}
