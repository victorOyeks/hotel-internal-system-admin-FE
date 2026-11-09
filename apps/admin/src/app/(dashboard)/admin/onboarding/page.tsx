import { OnboardingScreen } from "@/components/roles/admin/onboarding";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
	const [role, rows, admins] = await Promise.all([
		getActiveRole(),
		data.platform.onboarding(),
		data.platform.adminUsers(),
	]);
	return (
		<OnboardingScreen role={adminRole(role)} rows={rows} admins={admins} />
	);
}
