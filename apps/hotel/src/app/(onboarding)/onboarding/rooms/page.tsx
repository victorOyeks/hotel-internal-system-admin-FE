import { RoomsStep } from "@/components/onboarding/step-rooms";
import { loadOnboarding } from "../load";

export const dynamic = "force-dynamic";

export default async function Page() {
	const load = await loadOnboarding();
	return (
		<RoomsStep business={load.business} draft={load.draft} user={load.user} />
	);
}
