import { HotelSetupScreen } from "@/components/roles/manager/hotel-setup";
import { getActiveHotel, getActiveRole } from "@hospio/api/dal";
import { loadSetup } from "./load";

export const dynamic = "force-dynamic";

export default async function HotelSetupPage() {
	const [hotel, role, sections] = await Promise.all([
		getActiveHotel(),
		getActiveRole(),
		loadSetup(),
	]);
	return (
		<HotelSetupScreen
			sections={sections}
			activeKey="basics"
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id}
			isOwner={role === "OWNER"}
		/>
	);
}
