"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type RentalsAutoRefreshProps = {
	intervalMs?: number;
};

export function RentalsAutoRefresh({ intervalMs = 1000 }: RentalsAutoRefreshProps) {
	const router = useRouter();

	useEffect(() => {
		const timer = window.setInterval(() => {
			// Avoid interrupting modal/dialog workflows (e.g. item details, forms).
			const hasOpenDialog = Boolean(
				document.querySelector('[role="dialog"][data-state="open"]'),
			);
			if (hasOpenDialog || document.hidden) return;
			router.refresh();
		}, intervalMs);

		return () => {
			window.clearInterval(timer);
		};
	}, [router, intervalMs]);

	return null;
}
