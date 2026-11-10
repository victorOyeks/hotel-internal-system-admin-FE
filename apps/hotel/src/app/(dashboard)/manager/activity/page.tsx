import { ActivityLogScreen } from "@/components/roles/manager/activity-log";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Manager · Activity log: one page at a time from platform-service (`?q=&department=&from=&to=&page=`). */
export default async function ActivityPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const query = listQueryFrom(sp, ["department"]);
	const open = typeof sp.open === "string" ? sp.open : undefined;
	const [hotel, rows] = await Promise.all([
		getActiveHotel(),
		data.activity.page(query),
	]);
	const opened =
		open && !rows.data.content.some((r) => r.id === open)
			? await data.activity.get(open)
			: null;
	return (
		<ActivityLogScreen
			rows={rows}
			hotelName={hotel?.name ?? "This hotel"}
			opened={opened}
		/>
	);
}
