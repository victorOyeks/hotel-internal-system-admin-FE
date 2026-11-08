import { redirect } from "next/navigation";
import { MarketerDashboard } from "@/components/roles/marketer/dashboard";
import { getUser } from "@/lib/dal";
import { data } from "@/lib/data";
import { demoCommissions, demoReferrals } from "@/lib/demo/fixtures/platform-extra";
import { demoMarketer } from "./me";

export const dynamic = "force-dynamic";

export default async function MarketerHomePage() {
	const [user, me, businesses] = await Promise.all([getUser(), demoMarketer(), data.platform.businesses()]);
	if (!user) redirect("/auth");
	return <MarketerDashboard firstName={user.fullName.split(" ")[0]} me={me} businesses={businesses} ledger={demoCommissions.filter((c) => c.marketerId === me.id)} referrals={demoReferrals.filter((r) => r.marketerId === me.id)} />;
}
