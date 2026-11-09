"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { anyLive } from "@hospio/api/data/live";
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

/**
 * For an action that has no server route yet. In pure demo mode it behaves like useDemoAction; once any
 * domain is live (staging, production) it says
 * "Not connected yet" and changes nothing: no success toast, and `after` is not called, so a panel stays
 * as it was instead of pretending something was saved or sent. Same call shape as useDemoAction.
 */
export function useNotConnectedAction() {
	const [pending, setPending] = useState(false);
	const run = useCallback(async (message: string, after?: () => void, opts?: Parameters<typeof demoSave>[1]) => {
		if (anyLive()) {
			toast.info("Not connected yet · nothing was saved or sent", { description: "This action is not wired to the server yet." });
			return;
		}
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
