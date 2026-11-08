import { ReportsScreen } from "@/components/roles/manager/reports";
import { getActiveHotel } from "@/lib/dal";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
	const [hotel, reports] = await Promise.all([getActiveHotel(), data.reports.list()]);
	return <ReportsScreen reports={reports} hotelName={hotel?.name ?? "This hotel"} />;
}
