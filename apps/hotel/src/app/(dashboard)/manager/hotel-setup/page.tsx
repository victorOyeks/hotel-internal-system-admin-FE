import { HotelSetupScreen } from "@/components/roles/manager/hotel-setup";
import { getActiveHotel, getActiveRole } from "@hospio/api/dal";
import { loadOutlets, loadSetup } from "./load";

export const dynamic = "force-dynamic";

export default async function HotelSetupPage() {
	const [hotel, role, sections, { outlets, stores }] = await Promise.all([
		getActiveHotel(),
		getActiveRole(),
		loadSetup(),
		loadOutlets(),
	]);
	return (
		<HotelSetupScreen
			sections={sections}
			activeKey="basics"
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id}
			outlets={outlets}
			stores={stores}
			isOwner={role === "OWNER"}
		/>
	);
}
