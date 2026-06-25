"use client";
import { useEffect, useRef, useState } from "react";

export function useVersionPoller(intervalMs = 5 * 60 * 1000) {
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const initialVersion = useRef<string | null>(null);

	useEffect(() => {
		const check = async () => {
			try {
				const res = await fetch(`/version.json?t=${Date.now()}`);
				if (!res.ok) return;
				const { version } = await res.json();
				if (initialVersion.current === null) {
					initialVersion.current = version;
				} else if (version !== initialVersion.current) {
					setUpdateAvailable(true);
				}
			} catch {
				// network error — ignore
			}
		};

		check();
		const id = setInterval(check, intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);

	return updateAvailable;
}
