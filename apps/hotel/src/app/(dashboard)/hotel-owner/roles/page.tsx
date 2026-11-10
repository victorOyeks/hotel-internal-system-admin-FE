import { RolesScreen } from "@/components/roles/manager/roles";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/**
 * Hotel Owner · Roles & permissions (the hotel picked in the sidebar): what each role allows, and who holds which role at this hotel, a page at a time from
 * identity-service (`?q=&holds=&sort=&page=`, docs/pagination.md). The role cards count holders in the service.
 */
export default async function RolesPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const query = listQueryFrom(await searchParams, ["holds"]);
	const [hotel, result, overall] = await Promise.all([
		getActiveHotel(),
		data.roles.accessPage(query),
		data.roles.accessPage({ size: 1 }),
	]);
	return (
		<RolesScreen
			result={result}
			overall={overall}
			hotelName={hotel?.name ?? "This hotel"}
			hotelId={hotel?.id}
		/>
	);
}
