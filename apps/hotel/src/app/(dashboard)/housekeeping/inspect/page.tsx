import { InspectScreen } from "@/components/roles/housekeeping/inspect";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";

export const dynamic = "force-dynamic";

export default async function InspectPage() {
	const [tasks, toInspect, rooms, staff] = await Promise.all([
		data.housekeeping.tasks(),
		data.housekeeping.toInspect(),
		data.rooms.list(),
		data.staff.list(),
	]);
	// The supervisor's list is the day's tasks plus every cleaned room waiting for inspection, whoever cleaned it.
	const all = [
		...tasks,
		...toInspect.filter((t) => !tasks.some((x) => x.id === t.id)),
	];
	return (
		<InspectScreen
			tasks={all}
			rooms={rooms}
			attendants={staff.filter(
				(s) =>
					s.role === "HOUSEKEEPING" && s.jobTitle !== "Housekeeping supervisor",
			)}
			demo={!live("housekeeping")}
		/>
	);
}
