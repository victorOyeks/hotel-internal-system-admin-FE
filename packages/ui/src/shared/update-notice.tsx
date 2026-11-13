"use client";

import { RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * After a deploy, an open page still holds the previous build's server-action ids; the new server answers
 * "Server Action … was not found". This notice catches that in three ways: it polls `/api/version` (every
 * minute and when the tab regains focus) and compares it with the build the page was loaded from, it turns
 * the raw "not found" error into the notice wherever an action error is toasted, and callers can flag it.
 */
const BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
// "An unexpected response was received from the server" is Next's answer when an action's request comes back as
// something other than the action's result: a page from before a deploy, or a sign-in redirect. Reloading fixes both.
const STALE =
	/Server Action .* was not found|Failed to find Server Action|failed-to-find-server-action|unexpected response was received from the server/i;

let flag: (() => void) | null = null;

export function isStaleDeployError(message: unknown): boolean {
	return typeof message === "string" && STALE.test(message);
}

/** Shows the "new version" notice; returns true when the message was a stale-deploy error. */
export function flagStaleDeploy(message?: unknown): boolean {
	if (message !== undefined && !isStaleDeployError(message)) return false;
	flag?.();
	return true;
}

let patched = false;
function patchToast() {
	if (patched) return;
	patched = true;
	const original = toast.error;
	// Every screen toasts action errors; a stale-deploy one becomes the notice instead of a cryptic message.
	toast.error = ((
		message: Parameters<typeof original>[0],
		data?: Parameters<typeof original>[1],
	) => {
		if (isStaleDeployError(message)) {
			flag?.();
			return "";
		}
		return original(message, data);
	}) as typeof original;
}

export function UpdateNotice() {
	const [stale, setStale] = useState(false);

	const check = useCallback(async () => {
		if (BUILD === "dev") return;
		try {
			const res = await fetch("/api/version", { cache: "no-store" });
			if (!res.ok) return;
			const { build } = (await res.json()) as { build?: string };
			if (build && build !== BUILD) setStale(true);
		} catch {
			// offline or restarting: try again on the next tick
		}
	}, []);

	useEffect(() => {
		flag = () => setStale(true);
		patchToast();
		const timer = setInterval(check, 60_000);
		const onFocus = () => {
			if (document.visibilityState === "visible") void check();
		};
		document.addEventListener("visibilitychange", onFocus);
		window.addEventListener("focus", onFocus);
		return () => {
			flag = null;
			clearInterval(timer);
			document.removeEventListener("visibilitychange", onFocus);
			window.removeEventListener("focus", onFocus);
		};
	}, [check]);

	if (!stale) return null;
	return (
		<div className="fixed inset-x-0 top-3 z-[60] mx-auto flex w-[min(640px,calc(100%-24px))] items-center gap-3 rounded-xl border border-brand/20 bg-card px-4 py-3 shadow-lg">
			<RefreshCwIcon className="size-5 shrink-0 text-brand" />
			<div className="min-w-0 flex-1 text-[13px]">
				<p className="font-semibold text-ink">Reload Hospio360 to carry on</p>
				<p className="text-ink-2">
					A new version is out, or this page has been open a long time. Steps
					you already saved are kept; anything typed on this screen since the
					last save is not.
				</p>
			</div>
			<button
				type="button"
				onClick={() => window.location.reload()}
				className="shrink-0 rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-white hover:opacity-90"
			>
				Reload
			</button>
		</div>
	);
}
