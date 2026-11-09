import { notFound } from "next/navigation";
import { HotelSetupScreen } from "@/components/roles/manager/hotel-setup";
import { getActiveHotel, getActiveRole } from "@hospio/api/dal";
import { loadOutlets, loadSetup } from "../load";

export const dynamic = "force-dynamic";

export default async function HotelSetupSectionPage({
	params,
}: {
	params: Promise<{ section: string }>;
}) {
	const { section } = await params;
	const [hotel, role, sections, { outlets, stores }] = await Promise.all([
		getActiveHotel(),
		getActiveRole(),
		loadSetup(),
		loadOutlets(),
	]);
	if (!sections.some((s) => s.key === section)) notFound();
	return (
		<HotelSetupScreen
			sections={sections}
			activeKey={section}
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id}
			outlets={outlets}
			stores={stores}
			isOwner={role === "OWNER"}
		/>
	);
}
