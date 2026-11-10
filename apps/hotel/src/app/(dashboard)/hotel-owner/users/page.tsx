import { OwnerUsers } from "@/components/roles/owner/users";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Hotel Owner · 08 Users: portal logins from identity-service, a page at a time (`?q=&status=&sort=&page=`). */
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams);
	const [result, overall, hotels, business, user] = await Promise.all([
		data.users.page(query),
		data.users.page({ size: 1 }),
		data.hotels.list(),
		data.business.mine(),
		getUser(),
	]);
	return (
		<OwnerUsers
			result={result}
			overall={overall}
			hotels={hotels}
			businessName={business?.name ?? "Hospio360"}
			ownerName={user?.fullName ?? business?.ownerName ?? "The owner"}
		/>
	);
}
