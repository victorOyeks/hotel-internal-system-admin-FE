import { RentalsDashboard } from "@/components/roles/rentals/dashboard";
import { $fetch } from "@/lib/fetch";
import { verifySession } from "@/lib/dal";

const breadcrumbs = {
  title: "Dashboard",
  breadcrumbs: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
  ],
};

export default async function RentalsHomePage() {
  await verifySession();
  const { token } = await verifySession();

  const response = await $fetch("@get/api/hotels/rentals/dashboard/stats", {
    auth: {
      type: "Bearer",
      token,
    },
  });

  const apiStats = response.data?.data;

  const stats = {
    totalActiveItems: apiStats?.totalActiveItems ?? 0,
    totalQuantity: apiStats?.totalQuantity ?? 0,
    currentlyRented: apiStats?.currentlyRented ?? 0,
    availableItems: apiStats?.availableItems ?? 0,
    totalOrders: apiStats?.totalOrders ?? 0,
    activeRentals: apiStats?.activeRentals ?? 0,
    overdueRentals: apiStats?.overdueRentals ?? 0,
    completedRentals: apiStats?.completedRentals ?? 0,
    ordersToday: apiStats?.ordersToday ?? 0,
    completedToday: apiStats?.completedToday ?? 0,
    totalRevenue: apiStats?.totalRevenue ?? 0,
    outstandingAmount: apiStats?.outstandingAmount ?? 0,
    revenueToday: apiStats?.revenueToday ?? 0,
    depositsHeld: apiStats?.depositsHeld ?? 0,
    pendingRefunds: apiStats?.pendingRefunds ?? 0,
    lateFeeRevenue: apiStats?.lateFeeRevenue ?? 0,
    damageFeeRevenue: apiStats?.damageFeeRevenue ?? 0,
    averageRentalDuration: apiStats?.averageRentalDuration ?? 0,
    mostPopularItems: apiStats?.mostPopularItems ?? [],
  };

  return <RentalsDashboard stats={stats} breadcrumbs={breadcrumbs} />;
}
