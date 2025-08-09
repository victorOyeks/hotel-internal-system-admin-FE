import { notFound } from "next/navigation";
import { HotelOwnerDashboard } from "@/components/roles/hotel-owner/dashboard";

function HomePage() {
	const role = "hotel-owner";

	switch (role) {
		case "hotel-owner":
			return <HotelOwnerDashboard />;
		default:
			return notFound();
	}
}

export default HomePage;
