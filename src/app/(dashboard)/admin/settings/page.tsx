import { SettingsScreen } from "@/components/roles/admin/settings";
import { getActiveRole } from "@/lib/dal";
import { demoIntegrations, demoPlatformSettings } from "@/lib/demo/fixtures/platform-extra";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
	const role = await getActiveRole();
	return <SettingsScreen role={adminRole(role)} settings={demoPlatformSettings} integrations={demoIntegrations} />;
}
