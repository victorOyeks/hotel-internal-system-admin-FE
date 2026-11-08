import { OnboardingScreen } from "@/components/roles/admin/onboarding";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { demoOnboardingProgress } from "@hospio/api/demo/fixtures/platform-extra";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
	const [role, rows, businesses] = await Promise.all([getActiveRole(), data.platform.onboarding(), data.platform.businesses()]);
	return <OnboardingScreen role={adminRole(role)} rows={rows} progress={demoOnboardingProgress} businesses={businesses} />;
}
