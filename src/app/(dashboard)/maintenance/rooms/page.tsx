import { OutOfOrderScreen } from "@/components/roles/maintenance/rooms";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MaintenanceRoomsPage() {
	const rooms = await data.rooms.list();
	return <OutOfOrderScreen rooms={rooms} />;
}
