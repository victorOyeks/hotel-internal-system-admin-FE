import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/roles/admin/dashboard";
import { getActiveRole, getUser } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "./role";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
	const [user, role, overview] = await Promise.all([
		getUser(),
		getActiveRole(),
		adminData.overview(),
	]);
	if (!user) redirect("/auth");
	return (
		<AdminDashboard
			role={adminRole(role)}
			firstName={user.fullName.split(" ")[0]}
			overview={overview}
		/>
	);
}
