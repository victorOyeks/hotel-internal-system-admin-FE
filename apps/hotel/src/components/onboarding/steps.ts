import type { OwnerOnboardingStep } from "@hospio/api/types";

/** Step copy shared by the step bar, the welcome checklist and the step pages (plain module: server components import it too). */
export const STEP_META: Record<
	OwnerOnboardingStep,
	{ title: string; short: string; blurb: string; minutes: number }
> = {
	business: {
		title: "Your business",
		short: "Business",
		blurb: "Company name, address and contacts",
		minutes: 1,
	},
	hotel: {
		title: "Your first hotel",
		short: "Hotel",
		blurb: "Name, address and check-in times",
		minutes: 2,
	},
	rooms: {
		title: "Rooms & prices",
		short: "Rooms",
		blurb: "Room types, how many, and what they cost",
		minutes: 3,
	},
	manager: {
		title: "Your first manager",
		short: "Manager",
		blurb: "Invite them and give them the hotel",
		minutes: 1,
	},
};

export const stepHref = (step: OwnerOnboardingStep | "done") =>
	`/onboarding/${step}`;
