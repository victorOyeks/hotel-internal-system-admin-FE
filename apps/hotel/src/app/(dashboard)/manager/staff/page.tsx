import { StaffScreen } from "@/components/roles/manager/staff/screen";
import { getActiveHotel, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/**
 * Manager · Staff: the list a page at a time from identity (`?q=&role=&status=&sort=&page=`, docs/pagination.md), the rota,
 * leave and shift requests. Only the rota tab reads everyone at the hotel (its grid, find cover, swap and auto-fill).
 */
export default async function StaffPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const tab = typeof sp.tab === "string" ? sp.tab : "all";
	const open = typeof sp.open === "string" ? sp.open : undefined;
	const query = listQueryFrom(sp, ["role"]);
	const [
		hotel,
		result,
		overall,
		staff,
		shifts,
		leave,
		requests,
		business,
		user,
		clockedIn,
	] = await Promise.all([
		getActiveHotel(),
		data.staff.page(query),
		data.staff.page({ size: 1 }),
		tab === "rota" ? data.staff.list() : Promise.resolve([]),
		data.staff.shifts(),
		data.staff.leave(),
		data.staff.shiftRequests(),
		data.business.mine(),
		getUser(),
		data.staff.clockedIn(),
	]);
	// A profile opened from a link (?open=) for someone who is not on this page.
	const opened =
		open &&
		!result.data.content.some((s) => s.id === open) &&
		!staff.some((s) => s.id === open)
			? await data.staff.one(open)
			: null;
	return (
		<StaffScreen
			result={result}
			overall={overall}
			opened={opened}
			staff={staff}
			shifts={shifts}
			leave={leave}
			requests={requests}
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id}
			businessName={business?.name}
			inviterName={user?.fullName}
			clockedIn={[...clockedIn.keys()]}
			clockedSince={Object.fromEntries(clockedIn)}
		/>
	);
}
