import { RentalsDashboard } from "@/components/roles/rentals/dashboard";

const breadcrumbs = {
  title: "Dashboard",
  breadcrumbs: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
  ],
};

// TODO: Replace with actual API call when backend is ready
const mockDashboardStats = {
  totalActiveItems: 45,
  totalQuantity: 180,
  currentlyRented: 68,
  availableItems: 112,
  totalOrders: 342,
  activeRentals: 28,
  overdueRentals: 5,
  completedRentals: 287,
  ordersToday: 12,
  completedToday: 8,
  totalRevenue: 125480.50,
  outstandingAmount: 8750.00,
  revenueToday: 2340.00,
  depositsHeld: 15600.00,
  pendingRefunds: 450.00,
};

export default function RentalsHomePage() {
  return <RentalsDashboard stats={mockDashboardStats} breadcrumbs={breadcrumbs} />;
}
