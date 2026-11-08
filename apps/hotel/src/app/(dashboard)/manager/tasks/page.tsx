import { TasksScreen } from "@/components/roles/manager/tasks/screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { demoAreas, demoTeamTasks } from "@hospio/api/demo/fixtures/manager-ops";

export const dynamic = "force-dynamic";

/** Manager · Tasks & maintenance: the board, repeating jobs, spare parts and past tasks. */
export default async function TasksPage() {
	const [hotel, repairs, jobs, parts] = await Promise.all([getActiveHotel(), data.maintenance.repairs(), data.maintenance.jobs(), data.maintenance.parts()]);
	return <TasksScreen hotelName={hotel?.name ?? "This hotel"} tasks={[...demoTeamTasks, ...repairs]} jobs={jobs} parts={parts} areas={demoAreas} />;
}
