import { notFound } from "next/navigation";
import { OwnerHotelDetail } from "@/components/roles/owner/hotel-detail";
import { atHotel } from "@hospio/api/api/server";
import { data } from "@hospio/api/data";
import { roleLabels, isHotelRole } from "@hospio/api/roles";

export const dynamic = "force-dynamic";

/** Hotel Owner · 03 Hotel details & rooms: that hotel's own rooms, room types and staff (read at that hotel). */
export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const hotel = (await data.owner.hotels()).find((h) => h.hotelId === id);
	if (!hotel) notFound();
	const [rooms, types, staff] = await Promise.all([
		atHotel(id, () => data.rooms.list()),
		atHotel(id, () => data.rooms.types()),
		data.owner.staff(),
	]);
	return (
		<OwnerHotelDetail
			hotel={hotel}
			rooms={rooms}
			types={types}
			staff={staff
				.filter((s) => s.hotelId === id)
				.map((s) => ({
					...s,
					role: isHotelRole(s.role) ? roleLabels[s.role] : s.role,
				}))}
		/>
	);
}
