import { OrganizationsScreen } from "@/components/roles/manager/organizations/organizations-screen";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Manager · Organizations: company accounts a page at a time (`?q=&status=&sort=&page=`), the hotel's overview, new organization. */
export default async function OrganizationsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams);
	const [hotel, result, overview] = await Promise.all([
		getActiveHotel(),
		data.organizations.page(query),
		data.organizations.overview(),
	]);
	return (
		<OrganizationsScreen
			hotelName={hotel?.name ?? "This hotel"}
			result={result}
			overview={overview}
		/>
	);
}
