import { SupportScreen } from "@/components/roles/admin/support";
import { data } from "@/lib/data";
import { demoSystemAlerts } from "@/lib/demo/fixtures/platform-extra";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
	const [tickets, businesses, admins] = await Promise.all([data.platform.tickets(), data.platform.businesses(), data.platform.adminUsers()]);
	return <SupportScreen tickets={tickets} alerts={demoSystemAlerts} businesses={businesses} admins={admins} />;
}
