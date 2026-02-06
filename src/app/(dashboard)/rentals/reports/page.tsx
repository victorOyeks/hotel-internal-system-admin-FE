import { RentalReportsPage } from "@/components/roles/rentals/rental-reports";
import { verifySession } from "@/lib/dal";

const breadcrumbs = {
  title: "Reports",
  breadcrumbs: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Rentals", href: "/rentals" },
    { label: "Reports", href: "/rentals/reports" },
  ],
};

export default async function RentalReportsRoute() {
  await verifySession();

  return <RentalReportsPage breadcrumbs={breadcrumbs} />;
}
