"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { MarketerProfileRow } from "@hospio/api/data/admin-types";
import type { PillTone } from "@hospio/ui/shared/status-pill";
import { copyText } from "@hospio/ui/shared/invite-card";
import { cn } from "@hospio/ui/utils";

export const stageTone: Record<string, PillTone> = {
	LEAD: "grey",
	CONTACTED: "info",
	ONBOARDING: "info",
	HANDED_OVER: "brand",
	LIVE: "success",
	AT_RISK: "warning",
	SUSPENDED: "danger",
	LOST: "grey",
	CHURNED: "grey",
};
export const stageLabel: Record<string, string> = {
	LEAD: "Lead",
	CONTACTED: "Contacted",
	ONBOARDING: "Onboarding",
	HANDED_OVER: "Handed over",
	LIVE: "Live",
	AT_RISK: "At risk",
	SUSPENDED: "Suspended",
	LOST: "Didn't sign up",
	CHURNED: "Churned",
};

export function monthsLeft(since: string | undefined, months: number) {
	if (!since) return months;
	const start = new Date(since);
	const now = new Date();
	const elapsed =
		(now.getFullYear() - start.getFullYear()) * 12 +
		(now.getMonth() - start.getMonth());
	return Math.max(0, months - elapsed);
}

const HOTEL_APP =
	process.env.NEXT_PUBLIC_HOTEL_APP_URL ?? "https://web-staging.hospio360.com";

/** The sign-up link that credits this marketer: the hotel app's sign-up with their referral code. */
export function referralLink(me: MarketerProfileRow) {
	const code =
		me.referralCode ?? me.fullName.toLowerCase().replace(/\s+/g, "-");
	return `${HOTEL_APP}/sign-up?ref=${encodeURIComponent(code)}`;
}

/** The link in a grey bar with a real copy button. */
export function ReferralLinkBox({
	me,
	className,
}: {
	me: MarketerProfileRow;
	className?: string;
}) {
	const [link, setLink] = useState(referralLink(me));
	const [done, setDone] = useState(false);
	useEffect(() => setLink(referralLink(me)), [me]);
	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-control bg-subtle px-3 py-[10px] text-[13px] font-medium text-ink",
				className,
			)}
		>
			<span className="min-w-0 flex-1 truncate" title={link}>
				{link}
			</span>
			<button
				type="button"
				onClick={async () => {
					if (await copyText(link, "Link copied")) {
						setDone(true);
						setTimeout(() => setDone(false), 1500);
					}
				}}
				className="text-ink-3 hover:text-ink"
				aria-label="Copy link"
			>
				{done ? (
					<CheckIcon className="size-4 text-success" />
				) : (
					<CopyIcon className="size-4" />
				)}
			</button>
		</div>
	);
}

export function whatsappShare(me: MarketerProfileRow) {
	const text = `Hi! I work with Hospio360, the hotel management system. Sign your hotel up through my link and we'll set you up: ${referralLink(me)}`;
	return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
