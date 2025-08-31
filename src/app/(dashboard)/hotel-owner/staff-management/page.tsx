import { HotelOwnerStaff } from "@/components/roles/hotel-owner/staff-management";
import { getQueryClient } from "@/lib/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

function StaffManagementPage() {
  const queryClient = getQueryClient();
  const breadcrumb = {
    title: "Staff Management",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Staff Management", href: "/dashboard/staff-management" },
    ],
  };
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HotelOwnerStaff breadcrumb={breadcrumb} staffs={[]} />
    </HydrationBoundary>
  );
}

export default StaffManagementPage;
