import { HotelOwnerDashboard } from "@/components/roles/hotel-owner/dashboard";
import { verifySession } from "@/lib/dal";
import { $fetch } from "@/lib/fetch";
import { getQueryClient } from "@/lib/queries";
import type { Breadcrumb } from "@/lib/store";
import { use } from "react";

function HomePage() {
  const breadcrumbs: Breadcrumb[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
  ];

  const queryClient = getQueryClient();
  const session = use(verifySession())

  const hotelOwnerData = use(queryClient.fetchQuery({
    queryKey: ["hotel-owners", "owner"],
    queryFn: async () => {
      const { data, error } = await $fetch("@get/api/hotel-owners/owner", {
        auth: {
          type: "Bearer",
          token: session.token,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    }
  }));


  console.log(typeof(hotelOwnerData));

  return <HotelOwnerDashboard breadcrumbs={breadcrumbs} />;
}

export default HomePage;
