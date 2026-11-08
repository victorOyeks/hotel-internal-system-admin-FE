import { RoomsScreen } from "@/components/roles/manager/rooms/rooms-screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Rooms: board, types & prices, out of order, add/edit room, assign cleaning. */
export default async function RoomsPage() {
	const [hotel, rooms, types, areas, staff] = await Promise.all([getActiveHotel(), data.rooms.list(), data.rooms.types(), data.rooms.areas(), data.staff.list()]);
	const attendants = staff.filter((s) => s.role === "HOUSEKEEPING" && s.status === "ACTIVE");
	return <RoomsScreen hotelName={hotel?.name ?? "This hotel"} rooms={rooms} types={types} areas={areas} attendants={attendants} />;
}
