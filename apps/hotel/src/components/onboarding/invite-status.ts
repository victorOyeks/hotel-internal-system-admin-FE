"use client";

import { useEffect, useState } from "react";
import { inviteStatusOf } from "@hospio/api/actions/identity";

/**
 * Watches an onboarding invite: checks every 10 seconds (and when the tab is focused again) until the
 * person accepts, so Step 4 and "All set" turn green on their own (DEF-028).
 */
export function useInviteAccepted(userId: string | undefined) {
	const [accepted, setAccepted] = useState(false);
	useEffect(() => {
		if (!userId) return;
		let stop = false;
		const check = async () => {
			const r = await inviteStatusOf(userId).catch(() => null);
			if (!stop && r?.ok && (r.data.status === "ACCEPTED" || r.data.signedIn))
				setAccepted(true);
		};
		void check();
		const timer = setInterval(check, 10_000);
		window.addEventListener("focus", check);
		return () => {
			stop = true;
			clearInterval(timer);
			window.removeEventListener("focus", check);
		};
	}, [userId]);
	return accepted;
}
