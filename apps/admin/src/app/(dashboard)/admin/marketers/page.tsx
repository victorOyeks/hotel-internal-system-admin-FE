import {
	pageParam,
	param,
	type SearchParams,
} from "@/components/roles/admin/params";
import { MarketersScreen } from "@/components/roles/admin/marketers";
import { getActiveRole, getUser } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function MarketersPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const sp = await searchParams;
	const tab = param(sp, "tab") ?? "marketers";
	const page = pageParam(sp);
	const [role, user, marketers, commissions, referrals] = await Promise.all([
		getActiveRole(),
		getUser(),
		adminData.marketers.list(),
		adminData.marketers.commissions({
			status: param(sp, "cstatus"),
			month: param(sp, "month"),
			page: tab === "commissions" ? page : 0,
			size: 25,
		}),
		adminData.marketers.referrals({
			page: tab === "referrals" ? page : 0,
			size: 100,
		}),
	]);
	return (
		<MarketersScreen
			role={adminRole(role)}
			marketers={marketers}
			commissions={commissions}
			referrals={referrals}
			inviterName={user?.fullName ?? "H.M.S"}
		/>
	);
}
