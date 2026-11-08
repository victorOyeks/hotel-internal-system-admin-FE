import { LostFoundScreen } from "@/components/roles/housekeeping/lost-found";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { demoPublicAreas } from "@hospio/api/demo/fixtures/tablet";

export const dynamic = "force-dynamic";

export default async function LostFoundPage() {
	const [items, rooms, user] = await Promise.all([data.housekeeping.lostFound(), data.rooms.list(), getUser()]);
	const places = [...rooms.slice(0, 40).map((r) => `Room ${r.number}`), ...demoPublicAreas];
	return <LostFoundScreen items={items} me={user?.fullName ?? "Housekeeping"} places={places} />;
}
