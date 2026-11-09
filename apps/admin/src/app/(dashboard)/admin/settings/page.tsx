import { SettingsScreen } from "@/components/roles/admin/settings";
import { getActiveRole } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
	const [role, settings, integrations] = await Promise.all([
		getActiveRole(),
		adminData.settings.get(),
		adminData.settings.integrations(),
	]);
	return (
		<SettingsScreen
			role={adminRole(role)}
			settings={settings}
			integrations={integrations}
		/>
	);
}
