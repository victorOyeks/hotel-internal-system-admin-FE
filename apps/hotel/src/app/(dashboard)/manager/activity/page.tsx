import { ActivityLogScreen } from "@/components/roles/manager/activity-log";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
	const [hotel, rows] = await Promise.all([getActiveHotel(), data.activity.list()]);
	return <ActivityLogScreen rows={rows} hotelName={hotel?.name ?? "This hotel"} />;
}
