import "server-only";

import { redirect } from "next/navigation";
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
	// The wizard is the owner's. Someone else signed in on this browser (an invited manager who accepted
	// their invite here) goes to their own dashboard, never to the owner's phone check (DEF-029).
	if (user && !user.roles.includes("OWNER")) redirect("/dashboard");
	// A self-serve owner confirms their phone before the wizard (the browser's Back can't skip it).
	if (user && !user.verified && business?.source === "SELF_SERVE")
		redirect("/verify-phone");
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
	// Changes whenever the saved draft or the hotel list changes: step pages remount with the fresh copy.
	const raw = JSON.stringify([
		draft,
		business?.hotels?.map((h) => [h.id, h.roomCount]),
	]);
	let hash = 0;
	for (let i = 0; i < raw.length; i++)
		hash = (hash * 31 + raw.charCodeAt(i)) | 0;
	const version = hash.toString(36);
	return { user, business, row, draft, done, next, version };
}

export type OnboardingLoad = Awaited<ReturnType<typeof loadOnboarding>>;
