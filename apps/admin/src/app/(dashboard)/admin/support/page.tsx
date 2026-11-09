import {
	pageParam,
	param,
	type SearchParams,
} from "@/components/roles/admin/params";
import { SupportScreen } from "@/components/roles/admin/support";
import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";

export const dynamic = "force-dynamic";

export default async function SupportPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const sp = await searchParams;
	const status = param(sp, "status") ?? "OPEN";
	const [user, tickets, alerts, businesses, admins] = await Promise.all([
		getUser(),
		adminData.support.tickets({
			status: status === "ALL" ? undefined : status,
			priority: param(sp, "priority"),
			businessId: param(sp, "businessId"),
			assignedTo: param(sp, "assignedTo"),
			q: param(sp, "q"),
			page: pageParam(sp),
			size: 25,
		}),
		adminData.alerts.list({ open: true }),
		data.platform.businesses(),
		adminData.team.list(),
	]);
	return (
		<SupportScreen
			tickets={tickets}
			alerts={alerts}
			businesses={businesses}
			admins={admins}
			currentUserName={user?.fullName ?? "H.M.S"}
		/>
	);
}
