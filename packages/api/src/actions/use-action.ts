"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@hospio/api/actions";

/**
 * Set while the session is a support view ("View as owner", read only): the services refuse every
 * write with 403 "forbidden", which reads better as the sentence below. The support bar flips it on mount.
 */
let readOnlySupport = false;
export function setReadOnlySupport(on: boolean) {
	readOnlySupport = on;
}
export const READ_ONLY_SUPPORT_MESSAGE = "Read-only support access cannot change anything";

function readable(error: string) {
	if (readOnlySupport && /forbidden|access is denied|not allowed|read[- ]only/i.test(error)) return READ_ONLY_SUPPORT_MESSAGE;
	return error;
}

/**
 * Runs a server action from a panel or modal: shows a toast with the result, calls `after` with the
 * data on success. Replaces useDemoAction screen by screen as each domain is wired.
 *
 *   const { run, pending } = useAction();
 *   run(() => saveRoom(input), "Room added", (room) => { patch(room); close(); });
 *
 * `message` can be a function of the result when the answer decides what to say (a price change that is
 * applied at once or is waiting for approval).
 */
export function useAction() {
	const [pending, setPending] = useState(false);
	const run = useCallback(async <T,>(action: () => Promise<ActionResult<T>>, message: string | ((data: T) => string), after?: (data: T) => void) => {
		setPending(true);
		try {
			const result = await action();
			if (!result.ok) {
				toast.error(readable(result.error), { duration: 8000 });
				return;
			}
			toast.success(typeof message === "function" ? message(result.data) : message);
			after?.(result.data);
		} catch (e) {
			toast.error(readable(e instanceof Error ? e.message : "Something went wrong"), { duration: 8000 });
		} finally {
			setPending(false);
		}
	}, []);
	return { run, pending };
}
