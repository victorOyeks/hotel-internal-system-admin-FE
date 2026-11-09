import { ChangesScreen } from "@/components/roles/admin/changes";
import {
	pageParam,
	param,
	type SearchParams,
} from "@/components/roles/admin/params";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function ChangesPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const sp = await searchParams;
	const page = pageParam(sp);
	const tab = param(sp, "tab") ?? "changes";
	const [role, changes, businesses, activity] = await Promise.all([
		getActiveRole(),
		adminData.changes.list({
			businessId: param(sp, "businessId"),
			page: tab === "changes" ? page : 0,
			size: 25,
		}),
		data.platform.businesses(),
		adminData.activity({
			byPlatform: true,
			page: tab === "activity" ? page : 0,
			size: 25,
		}),
	]);
	return (
		<ChangesScreen
			role={adminRole(role)}
			changes={changes}
			businesses={businesses}
			activity={activity}
		/>
	);
}
