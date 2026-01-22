import { RentalOrdersPage } from "@/components/roles/rentals/rental-orders";

const breadcrumbs = {
	title: "Rental Orders",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Orders", href: "/dashboard/orders" },
	],
};

// TODO: Replace with actual API call when backend is ready
const mockOrders = [
	{
		id: "1",
		orderNumber: "RO-2024-001",
		customerName: "John Smith",
		customerPhone: "+1-555-0101",
		status: "ACTIVE",
		paymentStatus: "PAID",
		totalAmount: 450.0,
		rentalStartDate: "2024-01-15",
		rentalEndDate: "2024-01-25",
	},
	{
		id: "2",
		orderNumber: "RO-2024-002",
		customerName: "Sarah Johnson",
		customerPhone: "+1-555-0102",
		status: "ACTIVE",
		paymentStatus: "PARTIAL",
		totalAmount: 890.0,
		rentalStartDate: "2024-01-18",
		rentalEndDate: "2024-01-28",
	},
	{
		id: "3",
		orderNumber: "RO-2024-003",
		customerName: "Michael Brown",
		customerPhone: "+1-555-0103",
		status: "COMPLETED",
		paymentStatus: "PAID",
		totalAmount: 320.0,
		rentalStartDate: "2024-01-10",
		rentalEndDate: "2024-01-20",
	},
	{
		id: "4",
		orderNumber: "RO-2024-004",
		customerName: "Emily Davis",
		customerPhone: "+1-555-0104",
		status: "ACTIVE",
		paymentStatus: "PENDING",
		totalAmount: 675.0,
		rentalStartDate: "2024-01-20",
		rentalEndDate: "2024-01-30",
	},
	{
		id: "5",
		orderNumber: "RO-2024-005",
		customerName: "David Wilson",
		customerPhone: "+1-555-0105",
		status: "RESERVED",
		paymentStatus: "DEPOSIT_PAID",
		totalAmount: 1200.0,
		rentalStartDate: "2024-02-01",
		rentalEndDate: "2024-02-10",
	},
];

const mockPaginationMeta = {
	pageNumber: 0,
	pageSize: 10,
	totalElements: 5,
	totalPages: 1,
	last: true,
	first: true,
};

export default function RentalOrdersPageRoute() {
	return (
		<RentalOrdersPage
			orders={mockOrders}
			paginationMeta={mockPaginationMeta}
			breadcrumbs={breadcrumbs}
		/>
	);
}
