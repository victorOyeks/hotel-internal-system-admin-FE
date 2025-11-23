import { OverdueRentalsPage } from "@/components/roles/rentals/overdue-rentals";

const breadcrumbs = {
  title: "Overdue Rentals",
  breadcrumbs: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Overdue Rentals", href: "/dashboard/overdue" },
  ],
};

// TODO: Replace with actual API call when backend is ready
const mockOverdueOrders = [
  {
    id: "1",
    orderNumber: "RO-2023-142",
    customerName: "Robert Martinez",
    customerPhone: "+1-555-0201",
    daysOverdue: 3,
    lateFees: 45.00,
    totalAmount: 520.00,
    rentalEndDate: "2024-01-12",
  },
  {
    id: "2",
    orderNumber: "RO-2023-156",
    customerName: "Lisa Anderson",
    customerPhone: "+1-555-0202",
    daysOverdue: 7,
    lateFees: 105.00,
    totalAmount: 1250.00,
    rentalEndDate: "2024-01-08",
  },
  {
    id: "3",
    orderNumber: "RO-2024-008",
    customerName: "James Taylor",
    customerPhone: "+1-555-0203",
    daysOverdue: 1,
    lateFees: 15.00,
    totalAmount: 340.00,
    rentalEndDate: "2024-01-14",
  },
  {
    id: "4",
    orderNumber: "RO-2023-189",
    customerName: "Patricia White",
    customerPhone: "+1-555-0204",
    daysOverdue: 12,
    lateFees: 180.00,
    totalAmount: 895.00,
    rentalEndDate: "2024-01-03",
  },
  {
    id: "5",
    orderNumber: "RO-2024-015",
    customerName: "Christopher Lee",
    customerPhone: "+1-555-0205",
    daysOverdue: 5,
    lateFees: 75.00,
    totalAmount: 670.00,
    rentalEndDate: "2024-01-10",
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

export default function OverdueRentalsPageRoute() {
  return (
    <OverdueRentalsPage
      orders={mockOverdueOrders}
      paginationMeta={mockPaginationMeta}
      breadcrumbs={breadcrumbs}
    />
  );
}
