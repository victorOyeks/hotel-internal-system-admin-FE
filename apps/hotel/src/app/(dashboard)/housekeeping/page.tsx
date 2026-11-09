import { MyRoomsScreen } from "@/components/roles/housekeeping/my-rooms";
import { getActiveHotel, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function HousekeepingHome() {
	const [tasks, rooms, staff, user, hotel] = await Promise.all([
		data.housekeeping.tasks(),
		data.rooms.list(),
		data.staff.list(),
		getUser(),
		getActiveHotel(),
	]);
	const me =
		staff.find((s) => s.fullName === user?.fullName) ??
		staff.find((s) => s.role === "HOUSEKEEPING") ??
		null;
	return (
		<MyRoomsScreen
			tasks={tasks}
			rooms={rooms}
			me={me}
			hotelName={hotel?.name ?? "This hotel"}
		/>
	);
}
