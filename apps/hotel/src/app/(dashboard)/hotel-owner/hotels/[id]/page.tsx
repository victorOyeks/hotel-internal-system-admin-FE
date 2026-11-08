import { notFound } from "next/navigation";
import { OwnerHotelDetail } from "@/components/roles/owner/hotel-detail";
import { data } from "@hospio/api/data";
import { ownerHotels } from "@hospio/api/demo/fixtures/owner";

export const dynamic = "force-dynamic";

/** Hotel Owner · 03 Hotel details & rooms. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const hotel = ownerHotels.find((h) => h.hotelId === id);
	if (!hotel) notFound();
	const [rooms, types, staff] = await Promise.all([data.rooms.list(), data.rooms.types(), data.staff.list()]);
	// The fixtures describe Ikeja; other branches show a slice sized to their room count.
	const scaled = rooms.slice(0, hotel.rooms).map((r) => ({ ...r, id: `${hotel.hotelId}-${r.id}` }));
	return <OwnerHotelDetail hotel={hotel} rooms={scaled} types={types} staff={staff.filter((s) => s.role !== "OWNER")} />;
}
