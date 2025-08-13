import { HotelOwnerDashboard } from "@/components/roles/hotel-owner/dashboard";
import type { Breadcrumb } from "@/lib/store";

function HomePage() {
  const breadcrumbs: Breadcrumb[] = [
    {
      label: "Dashboard",
      href: "/home",
    },
  ];
  return <HotelOwnerDashboard breadcrumbs={breadcrumbs} />;
}

export default HomePage;
