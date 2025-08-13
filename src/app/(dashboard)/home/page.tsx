import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { use } from "react";
import { HotelOwnerDashboard } from "@/components/roles/hotel-owner/dashboard";
import type { HotelRole } from "@/lib/types";
import type { Breadcrumb } from "@/lib/store";

function HomePage() {
	const cookieStore = use(cookies());
	// biome-ignore lint/style/noNonNullAssertion: Should exist at this point
	const tok = cookieStore.get("hms.jwt.session_token")!;
	const [role] = tok.value.split("::") as [HotelRole, string];

	const breadcrumbs: Breadcrumb[] = [
		{
			label: "Dashboard",
			href: "/home",
		},
	];

	switch (role) {
		case "HOTEL_OWNER":
			return <HotelOwnerDashboard breadcrumbs={breadcrumbs} />;
		default:
			return notFound();
	}
}

export default HomePage;
