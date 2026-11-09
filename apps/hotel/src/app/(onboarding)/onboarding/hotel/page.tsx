import { HotelStep } from "@/components/onboarding/step-hotel";
import { loadOnboarding } from "../load";

export const dynamic = "force-dynamic";

export default async function Page() {
	const load = await loadOnboarding();
	return (
		<HotelStep business={load.business} draft={load.draft} user={load.user} />
	);
}
