"use client";

import { Button } from "@hospio/ui/primitives/button";
import { useEffect } from "react";

/**
 * A page loaded before a deploy keeps the old build's chunk names and server-action ids; the first
 * click after the deploy then fails with one of these. A single reload picks up the new build.
 */
function isStaleBuildError(error: Error): boolean {
	const message = error.message || "";
	return (
		error.name === "ChunkLoadError" ||
		message.includes("Loading chunk") ||
		message.includes("Failed to fetch dynamically imported module") ||
		message.includes("Importing a module script failed") ||
		message.includes("Server Action") ||
		message.includes("server action") ||
		message.includes("Failed to find Server Action")
	);
}

const RELOAD_FLAG = "hms.reloaded-for-new-build";

// eslint-disable-next-line @typescript-eslint/no-shadow
export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		if (isStaleBuildError(error)) {
			let reloaded = false;
			try {
				reloaded = sessionStorage.getItem(RELOAD_FLAG) === "1";
				if (!reloaded) sessionStorage.setItem(RELOAD_FLAG, "1");
			} catch {
				// storage unavailable: reload once anyway
			}
			if (!reloaded) {
				window.location.reload();
				return;
			}
		} else {
			try {
				sessionStorage.removeItem(RELOAD_FLAG);
			} catch {
				// ignore
			}
		}
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-md text-center">
				<div className="mx-auto h-12 w-12" />
				<h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					500 - Server Error
				</h1>
				<p className="mt-4 text-muted-foreground">
					{isStaleBuildError(error) ? "The app was just updated. Reload the page to continue." : "Oops, something went wrong on our end."}
				</p>
				<div className="mt-6">
					<Button onClick={() => (isStaleBuildError(error) ? window.location.reload() : reset())}>{isStaleBuildError(error) ? "Reload" : "Try again"}</Button>
				</div>
			</div>
		</div>
	);
}
