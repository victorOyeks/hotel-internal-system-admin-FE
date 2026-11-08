import { InspectScreen } from "@/components/roles/housekeeping/inspect";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InspectPage() {
	const [tasks, rooms, staff] = await Promise.all([data.housekeeping.tasks(), data.rooms.list(), data.staff.list()]);
	return <InspectScreen tasks={tasks} rooms={rooms} attendants={staff.filter((s) => s.role === "HOUSEKEEPING" && s.jobTitle !== "Housekeeping supervisor")} />;
}
