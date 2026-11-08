import { ManagerStep } from "@/components/onboarding/step-manager";
import { loadOnboarding } from "../load";

export const dynamic = "force-dynamic";

export default async function Page() {
	const load = await loadOnboarding();
	return (
		<ManagerStep business={load.business} draft={load.draft} user={load.user} />
	);
}
