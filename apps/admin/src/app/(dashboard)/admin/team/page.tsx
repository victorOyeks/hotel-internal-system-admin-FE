import { TeamScreen } from "@/components/roles/admin/team";
import { getActiveRole, getUser } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
	const [role, user, users] = await Promise.all([
		getActiveRole(),
		getUser(),
		adminData.team.list(),
	]);
	return (
		<TeamScreen
			role={adminRole(role)}
			users={users}
			inviterName={user?.fullName ?? "Hospio360"}
		/>
	);
}
