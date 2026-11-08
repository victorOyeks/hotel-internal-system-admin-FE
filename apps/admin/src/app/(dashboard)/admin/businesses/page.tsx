import { BusinessesScreen } from "@/components/roles/admin/businesses";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
	const [role, businesses, marketers, admins] = await Promise.all([
		getActiveRole(),
		data.platform.businesses(),
		data.platform.marketers(),
		data.platform.adminUsers(),
	]);
	return (
		<BusinessesScreen
			role={adminRole(role)}
			businesses={businesses}
			marketers={marketers}
			admins={admins}
		/>
	);
}
