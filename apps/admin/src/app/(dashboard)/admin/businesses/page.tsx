import { BusinessesScreen } from "@/components/roles/admin/businesses";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
	const [role, businesses, marketers] = await Promise.all([getActiveRole(), data.platform.businesses(), data.platform.marketers()]);
	return <BusinessesScreen role={adminRole(role)} businesses={businesses} marketers={marketers} />;
}
