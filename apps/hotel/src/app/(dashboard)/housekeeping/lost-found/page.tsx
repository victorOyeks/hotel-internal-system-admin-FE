import { LostFoundScreen } from "@/components/roles/housekeeping/lost-found";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** The tab in the URL as the service's status. */
const lostFoundStatus = (tab?: string) =>
	tab === "returned"
		? "RETURNED"
		: tab === "disposed"
			? "DISPOSED"
			: tab === "all"
				? undefined
				: "FOUND";

/**
 * Lost & found (housekeeping, and the front office's copy): one page at a time (`?tab=held|returned|disposed|all&q=&page=`),
 * the hotel's real rooms and public areas to log against, and the item in `?open=` when it is off the page.
 */
export default async function LostFoundPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const query = listQueryFrom(sp, ["tab"]);
	const open = typeof sp.open === "string" ? sp.open : undefined;
	const [items, places, staff, user] = await Promise.all([
		data.housekeeping.lostFound({
			q: query.q,
			page: query.page,
			status: lostFoundStatus(query.tab as string | undefined),
		}),
		data.housekeeping.places(),
		data.staff.list(),
		getUser(),
	]);
	const opened =
		open && !items.data.content.some((r) => r.id === open)
			? await data.housekeeping.lostFoundItem(open)
			: null;
	const finders = staff
		.filter(
			(s) =>
				s.status === "ACTIVE" &&
				(s.role === "HOUSEKEEPING" ||
					s.role === "FRONT_OFFICE" ||
					s.role === "LAUNDRY" ||
					s.role === "MAINTENANCE"),
		)
		.map((s) => ({ id: s.userId ?? s.id, name: s.fullName }));
	const unique = Array.from(
		new Map(finders.map((f) => [f.id, f])).values(),
	).sort((a, b) => a.name.localeCompare(b.name));
	return (
		<LostFoundScreen
			items={items}
			opened={opened}
			me={{ id: user?.id ?? "", name: user?.fullName ?? "Housekeeping" }}
			finders={unique}
			rooms={places.rooms}
			areas={places.areas}
		/>
	);
}
