import { notFound } from "next/navigation";
import { HotelSetupScreen } from "@/components/roles/manager/hotel-setup";
import { getActiveHotel, getActiveRole } from "@/lib/dal";
import { loadSetup } from "../load";

export const dynamic = "force-dynamic";

export default async function HotelSetupSectionPage({ params }: { params: Promise<{ section: string }> }) {
	const { section } = await params;
	const [hotel, role, sections] = await Promise.all([getActiveHotel(), getActiveRole(), loadSetup()]);
	if (!sections.some((s) => s.key === section)) notFound();
	return <HotelSetupScreen sections={sections} activeKey={section} hotelName={hotel?.name ?? "This hotel"} isOwner={role === "OWNER"} />;
}
