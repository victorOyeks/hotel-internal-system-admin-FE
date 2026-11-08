import { BusinessStep } from "@/components/onboarding/step-business";
import { loadOnboarding } from "../load";

export const dynamic = "force-dynamic";

export default async function Page() {
	const load = await loadOnboarding();
	return (
		<BusinessStep
			business={load.business}
			draft={load.draft}
			user={load.user}
		/>
	);
}
