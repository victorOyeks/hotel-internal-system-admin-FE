"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { demoDelay } from "./mode";

/**
 * A save that behaves like the real thing: a short wait, then a toast. Screens call this from
 * panels and modals so the whole flow (open → fill → save → toast → close) can be walked through
 * before the backend exists. Replace the body with the server action when the endpoint lands.
 */
export async function demoSave(message: string, opts: { ms?: number; description?: string; tone?: "success" | "info" | "warning" } = {}) {
	await demoDelay(opts.ms ?? 500);
	const show = opts.tone === "info" ? toast.info : opts.tone === "warning" ? toast.warning : toast.success;
	show(message, opts.description ? { description: opts.description } : undefined);
	return { ok: true as const };
}

/** `const { run, pending } = useDemoAction(); run("Booking saved", () => close())` */
export function useDemoAction() {
	const [pending, setPending] = useState(false);
	const run = useCallback(async (message: string, after?: () => void, opts?: Parameters<typeof demoSave>[1]) => {
		setPending(true);
		try {
			await demoSave(message, opts);
			after?.();
		} finally {
			setPending(false);
		}
	}, []);
	return { run, pending };
}
