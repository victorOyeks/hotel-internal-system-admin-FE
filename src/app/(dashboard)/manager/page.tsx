import { ManagerDashboard } from "@/components/roles/manager/dashboard";
import type { Breadcrumb } from "@/lib/store";

function HomePage() {
  const breadcrumbs: Breadcrumb[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
  ];

  return <ManagerDashboard breadcrumbs={breadcrumbs} />;
}

export default HomePage;
