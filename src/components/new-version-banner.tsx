"use client";
import { useVersionPoller } from "@/hooks/use-version-poller";

export function NewVersionBanner() {
	const updateAvailable = useVersionPoller();

	if (!updateAvailable) return null;

	return (
		<div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-foreground px-4 py-3 text-background shadow-lg">
			<span className="text-sm">A new version is available.</span>
			<button
				type="button"
				onClick={() => window.location.reload()}
				className="rounded bg-background px-3 py-1 text-xs font-medium text-foreground hover:opacity-90"
			>
				Refresh
			</button>
		</div>
	);
}
