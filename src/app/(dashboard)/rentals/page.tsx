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
	totalRevenue: 125480.5,
	outstandingAmount: 8750.0,
	revenueToday: 2340.0,
	depositsHeld: 15600.0,
	pendingRefunds: 450.0,
};

export default function RentalsHomePage() {
	return (
		<RentalsDashboard stats={mockDashboardStats} breadcrumbs={breadcrumbs} />
	);
}
