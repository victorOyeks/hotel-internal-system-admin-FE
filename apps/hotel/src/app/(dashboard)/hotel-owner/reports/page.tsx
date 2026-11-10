import { OwnerReports } from "@/components/roles/owner/reports";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 07 Reports: built from live data, downloaded as CSV, scheduled on platform-service (docs/owner-portal.md). */
export default async function Page() {
	const [hotels, reports] = await Promise.all([
		data.owner.hotelList(),
		data.owner.reports(),
	]);
	return (
		<OwnerReports
			hotels={hotels.map((h) => ({ hotelId: h.id, name: h.name }))}
			schedules={reports.schedules}
			runs={reports.runs}
		/>
	);
}
