import type { PropsWithChildren } from "react";
import { OnboardingShell } from "@/components/onboarding/shell";

/** The owner's self-serve wizard and the handover review share this frame (no sidebar, no role needed). */
export default function OnboardingLayout({ children }: PropsWithChildren) {
	return <OnboardingShell>{children}</OnboardingShell>;
}
