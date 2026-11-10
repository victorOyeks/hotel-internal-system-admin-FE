import { RoomsScreen } from "@/components/roles/manager/rooms/rooms-screen";
import { getActiveHotel, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Manager · Rooms: board, types & prices, out of order, add/edit room, assign cleaning. */
export default async function RoomsPage() {
	const [hotel, rooms, types, areas, staff, settings, user] = await Promise.all(
		[
			getActiveHotel(),
			data.rooms.list(),
			data.rooms.types(),
			data.rooms.areas(),
			data.staff.list(),
			data.hotels.limits(),
			getUser(),
		],
	);
	const attendants = staff.filter(
		(s) => s.role === "HOUSEKEEPING" && s.status === "ACTIVE",
	);
	// Approval limits: a manager's base price change goes to the owner above the threshold (0 = every change).
	const priceRule = {
		needsOwner: settings.limits.rateChangesNeedOwner !== false,
		pct: settings.limits.rateChangeOwnerPct ?? 0,
		owner: !!user?.roles?.includes("OWNER"),
	};
	return (
		<RoomsScreen
			hotelName={hotel?.name ?? "This hotel"}
			rooms={rooms}
			types={types}
			areas={areas}
			attendants={attendants}
			priceRule={priceRule}
		/>
	);
}
