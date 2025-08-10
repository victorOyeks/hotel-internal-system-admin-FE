import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { use } from "react";
import { HotelOwnerDashboard } from "@/components/roles/hotel-owner/dashboard";
import type { HotelRole } from "@/lib/types";

function HomePage() {
	const cookieStore = use(cookies());
	// biome-ignore lint/style/noNonNullAssertion: Should exist at this point
	const tok = cookieStore.get("hms.jwt.session_token")!;
	const [role] = tok.value.split("::") as [HotelRole, string];

	switch (role) {
		case "HOTEL_OWNER":
			return <HotelOwnerDashboard />;
		default:
			return notFound();
	}
}

export default HomePage;
