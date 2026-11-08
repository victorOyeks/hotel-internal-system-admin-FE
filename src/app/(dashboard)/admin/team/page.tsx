import { TeamScreen } from "@/components/roles/admin/team";
import { getActiveRole } from "@/lib/dal";
import { data } from "@/lib/data";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
	const [role, users] = await Promise.all([getActiveRole(), data.platform.adminUsers()]);
	return <TeamScreen role={adminRole(role)} users={users} />;
}
