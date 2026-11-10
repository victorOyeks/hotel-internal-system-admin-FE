import { GuestsScreen } from "@/components/roles/front-office/guests";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
	urlParam,
} from "@hospio/api/data/paging";
import type { GuestView } from "@hospio/api/data/types";

export const dynamic = "force-dynamic";

const VIEWS: GuestView[] = ["all", "in-house", "repeat", "blacklisted"];

/** Front office 5.1 · Guests: the directory paged by reservation-service (view, search and page in the URL), and the open guest's stays. */
export default async function FrontDeskGuestsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const view = urlParam(sp, "tab") as GuestView | undefined;
	const open = urlParam(sp, "open");
	const { page, q, sort } = listQueryFrom(sp);
	const [guests, opened, stays] = await Promise.all([
		data.guests.page({
			page,
			q,
			sort,
			view: view && VIEWS.includes(view) ? view : undefined,
		}),
		open ? data.guests.get(open) : Promise.resolve(null),
		open ? data.guests.stays(open) : Promise.resolve([]),
	]);
	return <GuestsScreen guests={guests} opened={opened} stays={stays} />;
}
