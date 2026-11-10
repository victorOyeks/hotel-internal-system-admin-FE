import { ReportsScreen } from "@/components/roles/manager/reports";
import { OwnerReports } from "@/components/roles/owner/reports";
import { getActiveHotel, getHotels, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";

export const dynamic = "force-dynamic";

/**
 * Manager · Reports. Live: the same reports as the owner's, built from live data for the manager's hotels, with their
 * own schedules (a scheduled report the owner sends to the managers opens here). Demo: the sample catalogue.
 */
export default async function ReportsPage() {
	if (live("platform")) {
		const [hotels, reports, user] = await Promise.all([
			getHotels(),
			data.owner.reports(),
			getUser(),
		]);
		return (
			<OwnerReports
				owner={false}
				hotels={hotels.map((h) => ({ hotelId: h.id, name: h.name }))}
				schedules={reports.schedules.filter(
					(s) => s.requestedBy === user?.fullName,
				)}
				runs={reports.runs.filter(
					(r) => !r.hotelId || hotels.some((h) => h.id === r.hotelId),
				)}
			/>
		);
	}
	const [hotel, reports] = await Promise.all([
		getActiveHotel(),
		data.reports.list(),
	]);
	return (
		<ReportsScreen reports={reports} hotelName={hotel?.name ?? "This hotel"} />
	);
}
