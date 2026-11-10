import {
	type OnboardingColumns,
	OnboardingScreen,
} from "@/components/roles/admin/onboarding";
import type { SearchParams } from "@/components/roles/admin/params";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { urlPage } from "@hospio/api/data/paging";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

/** Admin · Onboarding board: each column a page from tenant-service (`?progressPage=`, `?readyPage=`, `?donePage=`). */
export default async function OnboardingPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const sp = await searchParams;
	const [role, progress, ready, done, admins] = await Promise.all([
		getActiveRole(),
		data.platform.onboardingPage("IN_PROGRESS", urlPage(sp, "progressPage")),
		data.platform.onboardingPage(
			"READY_FOR_HANDOVER",
			urlPage(sp, "readyPage"),
		),
		data.platform.onboardingPage("DONE", urlPage(sp, "donePage")),
		data.platform.adminUsers(),
	]);
	const columns: OnboardingColumns = {
		IN_PROGRESS: progress,
		READY_FOR_HANDOVER: ready,
		DONE: done,
	};
	return (
		<OnboardingScreen
			role={adminRole(role)}
			columns={columns}
			admins={admins}
		/>
	);
}
