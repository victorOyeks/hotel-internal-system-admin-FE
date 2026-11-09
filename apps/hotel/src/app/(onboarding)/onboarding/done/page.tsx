import { DoneStep } from "@/components/onboarding/done";
import { loadOnboarding } from "../load";

export const dynamic = "force-dynamic";

/** All set (Figma 3165:16555). */
export default async function DonePage() {
	const { user, business, draft } = await loadOnboarding();
	return (
		<DoneStep
			draft={draft}
			business={business}
			firstName={(user?.fullName ?? "").split(" ")[0] || "there"}
		/>
	);
}
