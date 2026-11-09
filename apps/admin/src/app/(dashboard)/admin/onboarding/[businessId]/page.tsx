import { notFound } from "next/navigation";
import { OnboardingWizard } from "@/components/roles/admin/onboarding/wizard";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import type { TerminalRow } from "@hospio/api/data/types";
import { adminRole } from "../../role";

export const dynamic = "force-dynamic";

/** The 10-step back-office wizard for one business (J2–J14). */
export default async function OnboardingWizardPage({
	params,
}: {
	params: Promise<{ businessId: string }>;
}) {
	const { businessId } = await params;
	const [role, business, draft, hotels, users, templates, admins] =
		await Promise.all([
			getActiveRole(),
			data.platform.business(businessId),
			data.platform.onboardingFor(businessId),
			data.platform.businessHotels(businessId),
			data.platform.businessUsers(businessId),
			data.setupTemplates.list(),
			data.platform.adminUsers(),
		]);
	if (!business) notFound();
	const terminalLists = await Promise.all(
		hotels.map((h) => data.terminals.list(h.id)),
	);
	const terminals: Record<string, TerminalRow[]> = {};
	hotels.forEach((h, i) => {
		terminals[h.id] = terminalLists[i] ?? [];
	});
	return (
		<OnboardingWizard
			role={adminRole(role)}
			business={business}
			draft={draft}
			hotels={hotels}
			users={users}
			terminals={terminals}
			templates={templates}
			admins={admins}
		/>
	);
}
