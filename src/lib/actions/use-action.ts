"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions";

/**
 * Runs a server action from a panel or modal: shows a toast with the result, calls `after` with the
 * data on success. Replaces useDemoAction screen by screen as each domain is wired.
 *
 *   const { run, pending } = useAction();
 *   run(() => saveRoom(input), "Room added", (room) => { patch(room); close(); });
 */
export function useAction() {
	const [pending, setPending] = useState(false);
	const run = useCallback(async <T,>(action: () => Promise<ActionResult<T>>, message: string, after?: (data: T) => void) => {
		setPending(true);
		try {
			const result = await action();
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			toast.success(message);
			after?.(result.data);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Something went wrong");
		} finally {
			setPending(false);
		}
	}, []);
	return { run, pending };
}
