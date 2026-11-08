import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/roles/admin/dashboard";
import { getActiveRole, getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { demoSystemAlerts } from "@hospio/api/demo/fixtures/platform-extra";
import { adminRole } from "./role";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
	const [user, role] = await Promise.all([getUser(), getActiveRole()]);
	if (!user) redirect("/auth");
	const [businesses, onboarding, tickets, changes, marketers, fees] =
		await Promise.all([
			data.platform.businesses(),
			data.platform.onboarding(),
			data.platform.tickets(),
			data.platform.changes(),
			data.platform.marketers(),
			data.platform.feeStatements(),
		]);
	return (
		<AdminDashboard
			role={adminRole(role)}
			firstName={user.fullName.split(" ")[0]}
			businesses={businesses}
			onboarding={onboarding}
			tickets={tickets}
			changes={changes}
			marketers={marketers}
			fees={fees}
			alerts={demoSystemAlerts}
		/>
	);
}
