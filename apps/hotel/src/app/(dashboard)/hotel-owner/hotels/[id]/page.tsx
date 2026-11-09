import { notFound } from "next/navigation";
import { OwnerHotelDetail } from "@/components/roles/owner/hotel-detail";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 03 Hotel details & rooms. The hotel is live; rooms and staff come from the active hotel's services. */
export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const hotel = await data.hotels.get(id);
	if (!hotel) notFound();
	const [rooms, types, staff] = await Promise.all([
		data.rooms.list(),
		data.rooms.types(),
		data.staff.list(),
	]);
	// Rooms and staff are read for the active hotel; another branch shows a slice sized to its room count.
	const scaled = rooms
		.slice(0, hotel.rooms)
		.map((r) => ({ ...r, id: `${hotel.hotelId}-${r.id}` }));
	return (
		<OwnerHotelDetail
			hotel={hotel}
			rooms={scaled}
			types={types}
			staff={staff.filter((s) => s.role !== "OWNER")}
		/>
	);
}
