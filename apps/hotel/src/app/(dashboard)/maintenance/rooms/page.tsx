import { OutOfOrderScreen } from "@/components/roles/maintenance/rooms";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function MaintenanceRoomsPage() {
	const [rooms, workOrders] = await Promise.all([
		data.rooms.list(),
		data.maintenance.workOrders("open"),
	]);
	return <OutOfOrderScreen rooms={rooms} workOrders={workOrders} />;
}
