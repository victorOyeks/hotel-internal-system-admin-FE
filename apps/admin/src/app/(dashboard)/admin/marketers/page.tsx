import { MarketersScreen } from "@/components/roles/admin/marketers";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { demoCommissions, demoReferrals } from "@hospio/api/demo/fixtures/platform-extra";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function MarketersPage() {
	const [role, marketers] = await Promise.all([getActiveRole(), data.platform.marketers()]);
	return <MarketersScreen role={adminRole(role)} marketers={marketers} commissions={demoCommissions} referrals={demoReferrals} />;
}
