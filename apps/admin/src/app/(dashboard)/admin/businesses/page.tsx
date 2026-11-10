import { BusinessesScreen } from "@/components/roles/admin/businesses";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { listQueryFrom } from "@hospio/api/data/paging";
import type { SearchParams } from "@/components/roles/admin/params";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

/** Admin · Hotel businesses, paged by tenant-service: `?stage=&q=&sort=&page=` (page counts from 1). */
export default async function BusinessesPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const query = listQueryFrom(await searchParams, ["stage"]);
	const [role, result, marketers, admins] = await Promise.all([
		getActiveRole(),
		data.platform.businessesPage(query),
		data.platform.marketers(),
		data.platform.adminUsers(),
	]);
	return (
		<BusinessesScreen
			role={adminRole(role)}
			result={result}
			marketers={marketers}
			admins={admins}
		/>
	);
}
