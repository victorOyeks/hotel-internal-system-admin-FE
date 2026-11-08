import { MyRoomsScreen } from "@/components/roles/housekeeping/my-rooms";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function HousekeepingHome() {
	const [tasks, rooms, staff, user] = await Promise.all([data.housekeeping.tasks(), data.rooms.list(), data.staff.list(), getUser()]);
	const me = staff.find((s) => s.fullName === user?.fullName) ?? staff.find((s) => s.role === "HOUSEKEEPING") ?? null;
	return <MyRoomsScreen tasks={tasks} rooms={rooms} me={me} />;
}
