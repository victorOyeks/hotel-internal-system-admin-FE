import { InspectScreen } from "@/components/roles/housekeeping/inspect";
import { getSession } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { isHousekeepingSupervisor } from "@hospio/api/supervisor";
import { Note } from "@hospio/ui/shared/detail-list";
import { PageHeader } from "@hospio/ui/shared/page-header";

export const dynamic = "force-dynamic";

export default async function InspectPage() {
	// Inspect and assign are the supervisor's (Housekeeping Full) or a manager's, as housekeeping-service decides.
	if (!isHousekeepingSupervisor(await getSession()))
		return (
			<>
				<PageHeader title="Inspect & assign" subtitle="For the housekeeping supervisor" />
				<Note tone="info">
					Inspecting and assigning rooms is for the housekeeping supervisor (Full
					access) or a manager. Your finished rooms go to them from My rooms.
				</Note>
			</>
		);
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
		/>
	);
}
