import { RoomBoard } from "@/components/roles/front-office/room-board";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FrontDeskRoomsPage() {
	const [rooms, tasks] = await Promise.all([
		data.rooms.list(),
		data.housekeeping.tasks(),
	]);
	return <RoomBoard rooms={rooms} tasks={tasks} />;
}
