"use client";

import { CheckCheckIcon } from "lucide-react";
import { Button } from "@hospio/ui/primitives/button";
import { btn } from "@hospio/ui/shared/ui";
import { markAllNotificationsRead } from "@hospio/api/actions/messaging";
import { useAction } from "@hospio/api/actions/use-action";

/** Notifications · "Mark all read": clears the bell's count. */
export function MarkAllRead({ disabled }: { disabled: boolean }) {
	const { run, pending } = useAction();
	return (
		<Button
			variant="outline"
			className={btn.secondary}
			disabled={disabled || pending}
			onClick={() =>
				// The action revalidates the layout: its answer carries the list and the bell's count already.
				run(markAllNotificationsRead, "All notifications marked read")
			}
		>
			<CheckCheckIcon className="size-[15px]" /> Mark all read
		</Button>
	);
}
