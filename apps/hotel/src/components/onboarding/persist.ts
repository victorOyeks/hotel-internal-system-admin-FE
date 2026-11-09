"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Keeping a step's entries when the owner leaves it. Saved steps live in the server draft; what was typed
 * but not yet saved is kept in this browser (per account and step) until the step is saved. Each step also
 * asks the server for a fresh copy when it opens, so the browser's Back button never shows an old page.
 */
const keyFor = (owner: string | undefined, step: string) =>
	`hospio:onboarding:${owner ?? "me"}:${step}`;

export function useStepForm<T extends Record<string, unknown>>(
	step: string,
	owner: string | undefined,
	initial: T,
) {
	const key = keyFor(owner, step);
	const [form, setForm] = useState<T>(initial);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(key);
			if (raw) setForm((f) => ({ ...f, ...(JSON.parse(raw) as Partial<T>) }));
		} catch {
			// Storage blocked: the saved draft still pre-fills the step.
		}
	}, [key]);

	const update = useCallback(
		(patch: Partial<T>) =>
			setForm((f) => {
				const next = { ...f, ...patch };
				try {
					localStorage.setItem(key, JSON.stringify(next));
				} catch {
					// ignore
				}
				return next;
			}),
		[key],
	);

	const forget = useCallback(() => {
		try {
			localStorage.removeItem(key);
		} catch {
			// ignore
		}
	}, [key]);

	return { form, update, setForm, forget };
}

/** Clears every unsaved copy for this account (after the wizard is finished). */
export function forgetAllSteps(owner: string | undefined) {
	try {
		const prefix = keyFor(owner, "");
		for (const k of Object.keys(localStorage))
			if (k.startsWith(prefix)) localStorage.removeItem(k);
	} catch {
		// ignore
	}
}

/** Re-reads the step's server data once on open (the Back button can restore an old copy of the page). */
export function useFreshOnOpen() {
	const router = useRouter();
	const done = useRef(false);
	useEffect(() => {
		if (done.current) return;
		done.current = true;
		router.refresh();
	}, [router]);
}

/**
 * "Save and finish later" in the header: the open step registers how to save itself. The handler returns
 * "saved" when the step was saved, "kept" when the entries were incomplete and only kept in this browser.
 */
export type SaveLaterResult = "saved" | "kept" | "failed";
let saver: (() => Promise<SaveLaterResult>) | null = null;

export function useSaveLater(fn: () => Promise<SaveLaterResult>) {
	const ref = useRef(fn);
	ref.current = fn;
	useEffect(() => {
		const handler = () => ref.current();
		saver = handler;
		return () => {
			if (saver === handler) saver = null;
		};
	}, []);
}

export async function saveForLater(): Promise<SaveLaterResult | "nothing"> {
	return saver ? saver() : "nothing";
}
