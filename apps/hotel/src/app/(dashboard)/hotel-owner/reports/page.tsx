import { OwnerReports } from "@/components/roles/owner/reports";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 07 Reports. */
export default async function Page() {
	const reports = await data.reports.list();
	return <OwnerReports reports={reports} />;
}
