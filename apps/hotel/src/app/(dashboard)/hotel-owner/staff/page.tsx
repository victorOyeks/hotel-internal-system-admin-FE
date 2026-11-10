import { OwnerStaffScreen } from "@/components/roles/owner/staff";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/**
 * Hotel Owner · 05 Staff: everyone with a role at each hotel of the business, a page at a time from identity
 * (`?q=&hotel=&tab=&sort=&page=`, docs/owner-portal.md and docs/pagination.md).
 */
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams, ["hotel", "tab"]);
	const [result, overall, hotels, business, user] = await Promise.all([
		data.owner.staffPage(query),
		data.owner.staffPage({ hotel: query.hotel as string | undefined, size: 1 }),
		data.owner.hotelList(),
		data.business.mine(),
		getUser(),
	]);
	return (
		<OwnerStaffScreen
			result={result}
			overall={overall}
			hotels={hotels.map((h) => ({ hotelId: h.id, name: h.name }))}
			businessName={business?.name ?? "Your business"}
			ownerName={user?.fullName ?? business?.ownerName ?? "The owner"}
		/>
	);
}
