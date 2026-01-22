import { RentalPaymentsPage } from "@/components/roles/rentals/rental-payments";

const breadcrumbs = {
	title: "Payments",
	breadcrumbs: [
		{ label: "Dashboard", href: "/dashboard" },
		{ label: "Payments", href: "/dashboard/payments" },
	],
};

// TODO: Replace with actual API call when backend is ready
const mockPayments = [
	{
		id: "1",
		orderNumber: "RO-2024-001",
		amount: 450.0,
		paymentType: "RENTAL_FEE",
		paymentMethod: "CARD",
		paymentDate: "2024-01-15",
		customerName: "John Smith",
	},
	{
		id: "2",
		orderNumber: "RO-2024-002",
		amount: 500.0,
		paymentType: "DEPOSIT",
		paymentMethod: "CASH",
		paymentDate: "2024-01-18",
		customerName: "Sarah Johnson",
	},
	{
		id: "3",
		orderNumber: "RO-2024-001",
		amount: 100.0,
		paymentType: "DEPOSIT",
		paymentMethod: "CARD",
		paymentDate: "2024-01-14",
		customerName: "John Smith",
	},
	{
		id: "4",
		orderNumber: "RO-2024-003",
		amount: 320.0,
		paymentType: "RENTAL_FEE",
		paymentMethod: "MOBILE_MONEY",
		paymentDate: "2024-01-10",
		customerName: "Michael Brown",
	},
	{
		id: "5",
		orderNumber: "RO-2024-004",
		amount: 250.0,
		paymentType: "DEPOSIT",
		paymentMethod: "BANK_TRANSFER",
		paymentDate: "2024-01-20",
		customerName: "Emily Davis",
	},
	{
		id: "6",
		orderNumber: "RO-2023-189",
		amount: 180.0,
		paymentType: "LATE_FEE",
		paymentMethod: "CASH",
		paymentDate: "2024-01-19",
		customerName: "Patricia White",
	},
	{
		id: "7",
		orderNumber: "RO-2024-005",
		amount: 600.0,
		paymentType: "DEPOSIT",
		paymentMethod: "CARD",
		paymentDate: "2024-01-25",
		customerName: "David Wilson",
	},
	{
		id: "8",
		orderNumber: "RO-2023-142",
		amount: 45.0,
		paymentType: "LATE_FEE",
		paymentMethod: "CASH",
		paymentDate: "2024-01-16",
		customerName: "Robert Martinez",
	},
];

const mockPaginationMeta = {
	pageNumber: 0,
	pageSize: 10,
	totalElements: 8,
	totalPages: 1,
	last: true,
	first: true,
};

export default function RentalPaymentsPageRoute() {
	return (
		<RentalPaymentsPage
			payments={mockPayments}
			paginationMeta={mockPaginationMeta}
			breadcrumbs={breadcrumbs}
		/>
	);
}
