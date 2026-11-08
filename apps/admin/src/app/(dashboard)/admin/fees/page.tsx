import { FeesScreen } from "@/components/roles/admin/fees";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function FeesPage() {
	const [role, statements, businesses] = await Promise.all([getActiveRole(), data.platform.feeStatements(), data.platform.businesses()]);
	return <FeesScreen role={adminRole(role)} statements={statements} businesses={businesses} />;
}
