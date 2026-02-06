import { RentalCustomersPage } from "@/components/roles/rentals/rental-customers";
import { verifySession } from "@/lib/dal";

const breadcrumbs = {
  title: "Customers",
  breadcrumbs: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Rentals", href: "/rentals" },
    { label: "Customers", href: "/rentals/customers" },
  ],
};

export default async function RentalCustomersRoute() {
  await verifySession();

  return <RentalCustomersPage breadcrumbs={breadcrumbs} />;
}
