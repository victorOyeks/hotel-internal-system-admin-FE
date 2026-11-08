import { ScheduledJobsScreen } from "@/components/roles/maintenance/jobs";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function MaintenanceJobsPage() {
	const [jobs, parts] = await Promise.all([data.maintenance.jobs(), data.maintenance.parts()]);
	return <ScheduledJobsScreen jobs={jobs} parts={parts} />;
}
