import type { PillTone } from "@hospio/ui/shared/status-pill";
import type { MarketerRow } from "@hospio/api/data/types";

export const stageTone: Record<string, PillTone> = { LEAD: "grey", CONTACTED: "info", ONBOARDING: "info", HANDED_OVER: "brand", LIVE: "success", AT_RISK: "warning", SUSPENDED: "danger", LOST: "grey" };
export const stageLabel: Record<string, string> = { LEAD: "Lead", CONTACTED: "Contacted", ONBOARDING: "Onboarding", HANDED_OVER: "Handed over", LIVE: "Live", AT_RISK: "At risk", SUSPENDED: "Suspended", LOST: "Didn't sign up" };

export function monthsLeft(since: string, months: number) {
	const start = new Date(since);
	const now = new Date();
	const elapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
	return Math.max(0, months - elapsed);
}

export function referralLink(me: MarketerRow) {
	return `hms.ng/join/${me.fullName.toLowerCase().replace(/\s+/g, "-")}`;
}
