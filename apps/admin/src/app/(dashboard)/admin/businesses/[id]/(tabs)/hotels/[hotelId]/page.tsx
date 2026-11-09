import { notFound } from "next/navigation";
import { HotelOverviewTab } from "@/components/roles/admin/business-tabs/hotel-overview";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";

export const dynamic = "force-dynamic";

export default async function BusinessHotelPage({
	params,
}: {
	params: Promise<{ id: string; hotelId: string }>;
}) {
	const { id, hotelId } = await params;
	const business = await data.platform.business(id);
	if (!business) notFound();
	const [hotels, overview] = await Promise.all([
		data.platform.businessHotels(id),
		adminData.hotelOverview(id, hotelId),
	]);
	return (
		<HotelOverviewTab
			businessId={id}
			businessName={business.name}
			hotel={hotels.find((h) => h.id === hotelId) ?? null}
			overview={overview}
			siblings={hotels}
		/>
	);
}
