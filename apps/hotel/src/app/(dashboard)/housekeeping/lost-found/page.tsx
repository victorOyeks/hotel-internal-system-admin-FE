import { LostFoundScreen } from "@/components/roles/housekeeping/lost-found";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { listQueryFrom, type SearchParamsRecord } from "@hospio/api/data/paging";
import { demoPublicAreas } from "@hospio/api/demo/fixtures/tablet";

export const dynamic = "force-dynamic";

/** The tab in the URL as the service's status. */
const lostFoundStatus = (tab?: string) => (tab === "returned" ? "RETURNED" : tab === "all" ? undefined : "FOUND");

/** Housekeeping · Lost & found: one page at a time (`?tab=held|returned|all&q=&page=`). */
export default async function LostFoundPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
	const sp = await searchParams;
	const query = listQueryFrom(sp, ["tab"]);
	const [items, rooms, user] = await Promise.all([
		data.housekeeping.lostFound({ q: query.q, page: query.page, status: lostFoundStatus(query.tab as string | undefined) }),
		data.rooms.list(),
		getUser(),
	]);
	const places = [...rooms.slice(0, 40).map((r) => `Room ${r.number}`), ...demoPublicAreas];
	return <LostFoundScreen items={items} me={user?.fullName ?? "Housekeeping"} places={places} />;
}
