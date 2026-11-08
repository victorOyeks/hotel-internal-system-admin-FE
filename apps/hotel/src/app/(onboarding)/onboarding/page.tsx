import { WelcomeChecklist } from "@/components/onboarding/welcome";
import { loadOnboarding } from "./load";

export const dynamic = "force-dynamic";

/** Welcome checklist (Figma 3163:16235): what is done, what is next. */
export default async function OnboardingPage() {
	const { user, done, next } = await loadOnboarding();
	const firstName = (user?.fullName ?? "").split(" ")[0] || "there";
	return <WelcomeChecklist firstName={firstName} done={done} next={next} />;
}
