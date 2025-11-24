import { RentalItemsPage } from "@/components/roles/rentals/rental-items";

const breadcrumbs = {
  title: "Rental Items",
  breadcrumbs: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Rental Items", href: "/dashboard/items" },
  ],
};

// TODO: Replace with actual API call when backend is ready
const mockItems = [
  {
    id: "1",
    name: "Wheelchair - Standard",
    category: "MOBILITY_AIDS",
    dailyRate: 15.00,
    depositAmount: 100.00,
    totalQuantity: 10,
    availableQuantity: 7,
    active: true,
  },
  {
    id: "2",
    name: "Laptop - Dell XPS 15",
    category: "ELECTRONICS",
    dailyRate: 45.00,
    depositAmount: 500.00,
    totalQuantity: 5,
    availableQuantity: 2,
    active: true,
  },
  {
    id: "3",
    name: "Projector - HD 1080p",
    category: "CONFERENCE_EQUIPMENT",
    dailyRate: 75.00,
    depositAmount: 300.00,
    totalQuantity: 8,
    availableQuantity: 5,
    active: true,
  },
  {
    id: "4",
    name: "Baby Stroller - Premium",
    category: "BABY_ITEMS",
    dailyRate: 20.00,
    depositAmount: 150.00,
    totalQuantity: 6,
    availableQuantity: 4,
    active: true,
  },
  {
    id: "5",
    name: "Tennis Racket Set",
    category: "SPORTS_EQUIPMENT",
    dailyRate: 25.00,
    depositAmount: 75.00,
    totalQuantity: 12,
    availableQuantity: 8,
    active: true,
  },
  {
    id: "6",
    name: "Mountain Bike",
    category: "RECREATION",
    dailyRate: 35.00,
    depositAmount: 200.00,
    totalQuantity: 15,
    availableQuantity: 10,
    active: true,
  },
  {
    id: "7",
    name: "Conference Phone System",
    category: "CONFERENCE_EQUIPMENT",
    dailyRate: 30.00,
    depositAmount: 250.00,
    totalQuantity: 4,
    availableQuantity: 3,
    active: true,
  },
  {
    id: "8",
    name: "Golf Cart",
    category: "VEHICLES",
    dailyRate: 80.00,
    depositAmount: 500.00,
    totalQuantity: 3,
    availableQuantity: 1,
    active: true,
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

export default function RentalItemsPageRoute() {
  return (
    <RentalItemsPage
      items={mockItems}
      paginationMeta={mockPaginationMeta}
      breadcrumbs={breadcrumbs}
    />
  );
}
