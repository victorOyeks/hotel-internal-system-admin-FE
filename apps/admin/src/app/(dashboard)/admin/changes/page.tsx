import { ChangesScreen } from "@/components/roles/admin/changes";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { demoAdminActivity } from "@hospio/api/demo/fixtures/platform-extra";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function ChangesPage() {
	const [role, changes, businesses] = await Promise.all([getActiveRole(), data.platform.changes(), data.platform.businesses()]);
	return <ChangesScreen role={adminRole(role)} changes={changes} businesses={businesses} activity={demoAdminActivity} />;
}
