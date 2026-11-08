import "server-only";

import { getUser } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	OWNER_ONBOARDING_STEPS,
	type OwnerOnboardingData,
	type OwnerOnboardingStep,
} from "@hospio/api/types";

/**
 * What every step page needs: the owner, the business and the saved draft (`data[stepKey]`), so a
 * step pre-fills when the owner comes back. The draft is null in demo mode and before the first save.
 */
export async function loadOnboarding() {
	const [user, business, row] = await Promise.all([
		getUser(),
		data.business.mine(),
		data.onboarding.mine(),
	]);
	const draft = (row?.data ?? {}) as OwnerOnboardingData;
	const completed = new Set<string>([
		...(row?.completedSteps ?? []),
		...(business?.onboarding?.completedSteps ?? []),
	]);
	const done = OWNER_ONBOARDING_STEPS.filter(
		(s) => completed.has(s) || !!draft[s],
	);
	const next: OwnerOnboardingStep | "done" =
		OWNER_ONBOARDING_STEPS.find((s) => !done.includes(s)) ?? "done";
	return { user, business, row, draft, done, next };
}

export type OnboardingLoad = Awaited<ReturnType<typeof loadOnboarding>>;
