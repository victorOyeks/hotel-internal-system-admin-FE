"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { startSupportSession } from "@hospio/api/actions/auth";

/**
 * Turns the support token into the session cookies (a server action, since a page cannot set
 * cookies) and follows its redirect to the dashboard.
 */
export function SupportSignIn({ token }: { token: string }) {
	const [error, setError] = useState<string | null>(null);
	const started = useRef(false);
	useEffect(() => {
		if (started.current) return;
		started.current = true;
		startSupportSession(token).then((r) => {
			if (r && !r.ok) setError(r.error);
		});
	}, [token]);
	if (error)
		return (
			<div className="flex flex-col gap-3">
				<h1 className="text-[24px] font-bold text-ink">
					This support link has expired
				</h1>
				<p className="text-sm text-ink-2">{error}</p>
			</div>
		);
	return (
		<div className="flex flex-col items-center gap-3 text-center">
			<Loader2Icon className="size-6 animate-spin text-brand" />
			<p className="text-sm font-semibold text-ink">
				Opening the hotel app as the owner…
			</p>
			<p className="text-xs text-ink-3">
				Read only · every page you open is logged
			</p>
		</div>
	);
}
