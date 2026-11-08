import { RoomBoard } from "@/components/roles/front-office/room-board";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function FrontDeskRoomsPage() {
	const rooms = await data.rooms.list();
	return <RoomBoard rooms={rooms} />;
}
