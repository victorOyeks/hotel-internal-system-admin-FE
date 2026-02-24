"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type RentalsAutoRefreshProps = {
	intervalMs?: number;
};

export function RentalsAutoRefresh({ intervalMs = 60_000 }: RentalsAutoRefreshProps) {
	const router = useRouter();
	const backoffRef = useRef(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const scheduleRefresh = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current);

		const delay = backoffRef.current > 0
			? Math.min(intervalMs * 2 ** backoffRef.current, 300_000)
			: intervalMs;

		timerRef.current = setTimeout(async () => {
			const hasOpenDialog = Boolean(
				document.querySelector('[role="dialog"][data-state="open"]'),
			);
			if (hasOpenDialog || document.hidden) {
				scheduleRefresh();
				return;
			}

			try {
				router.refresh();
				backoffRef.current = 0;
			} catch {
				backoffRef.current = Math.min(backoffRef.current + 1, 5);
			}

			scheduleRefresh();
		}, delay);
	}, [router, intervalMs]);

	useEffect(() => {
		scheduleRefresh();
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [scheduleRefresh]);

	return null;
}
