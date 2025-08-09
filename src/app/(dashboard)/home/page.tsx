import { HotelOwnerDashboard } from "@/components/roles/hotel-owner/dashboard";

function HomePage() {
  const role = "hotel-owner";

  switch (role) {
    case "hotel-owner":
      return <HotelOwnerDashboard />;
    default:
      return <div>Unauthorized</div>;
  }
}

export default HomePage;
