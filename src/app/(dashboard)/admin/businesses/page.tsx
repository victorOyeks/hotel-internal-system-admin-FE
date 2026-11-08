import { BusinessesScreen } from "@/components/roles/admin/businesses";
import { getActiveRole } from "@/lib/dal";
import { data } from "@/lib/data";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
	const [role, businesses, marketers] = await Promise.all([getActiveRole(), data.platform.businesses(), data.platform.marketers()]);
	return <BusinessesScreen role={adminRole(role)} businesses={businesses} marketers={marketers} />;
}
