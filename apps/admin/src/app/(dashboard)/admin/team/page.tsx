import { TeamScreen } from "@/components/roles/admin/team";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
	const [role, users] = await Promise.all([getActiveRole(), data.platform.adminUsers()]);
	return <TeamScreen role={adminRole(role)} users={users} />;
}
