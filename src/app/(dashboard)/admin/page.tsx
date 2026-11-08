import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/roles/admin/dashboard";
import { getActiveRole, getUser } from "@/lib/dal";
import { data } from "@/lib/data";
import { demoSystemAlerts } from "@/lib/demo/fixtures/platform-extra";
import { adminRole } from "./role";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
	const [user, role] = await Promise.all([getUser(), getActiveRole()]);
	if (!user) redirect("/auth");
	const [businesses, tickets, changes, marketers, fees] = await Promise.all([data.platform.businesses(), data.platform.tickets(), data.platform.changes(), data.platform.marketers(), data.platform.feeStatements()]);
	return <AdminDashboard role={adminRole(role)} firstName={user.fullName.split(" ")[0]} businesses={businesses} tickets={tickets} changes={changes} marketers={marketers} fees={fees} alerts={demoSystemAlerts} />;
}
