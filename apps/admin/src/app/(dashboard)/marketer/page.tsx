import { redirect } from "next/navigation";
import { MarketerDashboard } from "@/components/roles/marketer/dashboard";
import { getUser } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { NotAMarketer } from "./not-a-marketer";

export const dynamic = "force-dynamic";

export default async function MarketerHomePage() {
	const [user, me, businesses, ledger, referrals] = await Promise.all([
		getUser(),
		adminData.marketer.me(),
		adminData.marketer.businesses(),
		adminData.marketer.commissions(),
		adminData.marketer.referrals(),
	]);
	if (!user) redirect("/auth");
	if (!me) return <NotAMarketer />;
	return (
		<MarketerDashboard
			firstName={user.fullName.split(" ")[0]}
			me={me}
			businesses={businesses}
			ledger={ledger}
			referrals={referrals}
		/>
	);
}
