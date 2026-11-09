import { notFound } from "next/navigation";
import { HotelSetupScreen } from "@/components/roles/manager/hotel-setup";
import { loadSetup } from "@/app/(dashboard)/manager/hotel-setup/load";
import { getActiveHotel } from "@hospio/api/dal";

export const dynamic = "force-dynamic";

/** Owner · Hotel setup for the active hotel: the manager's screen with the owner-only sections (taxes, approvals, danger zone) unlocked. */
export default async function OwnerHotelSetupPage({
	params,
}: {
	params: Promise<{ section?: string[] }>;
}) {
	const { section } = await params;
	const key = section?.[0] ?? "basics";
	const [hotel, sections] = await Promise.all([getActiveHotel(), loadSetup()]);
	if (!sections.some((s) => s.key === key)) notFound();
	return (
		<HotelSetupScreen
			sections={sections}
			activeKey={key}
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id}
			isOwner
		/>
	);
}
