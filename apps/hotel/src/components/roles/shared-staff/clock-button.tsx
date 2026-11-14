"use client";

import { LogInIcon, LogOutIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAction } from "@hospio/api/actions/use-action";
import { clockIn, clockOut } from "@hospio/api/actions/workforce";
import type { ClockStatus } from "@hospio/api/data/types";
import { fmtTime } from "@hospio/ui/shared/format";
import { btn } from "@hospio/ui/shared/ui";

/**
 * Clock in / out from a desk's home screen (the same clock as My shifts): late clock-ins, and every clock-in when Hotel
 * setup says so, are told to the managers.
 */
export function ClockButton({ initial }: { initial: ClockStatus }) {
	const [clock, setClock] = useState(initial);
	useEffect(() => setClock(initial), [initial]);
	const { run, pending } = useAction();
	return clock.clockedIn ? (
		<button
			type="button"
			className={btn.secondary}
			disabled={pending}
			onClick={() => void run(() => clockOut(), "Clocked out", setClock)}
			title="You're on shift; clock out when you finish"
		>
			<LogOutIcon className="mr-1 inline size-4" /> Clock out
			{clock.since ? <span className="ml-1 font-normal text-ink-3">· in since {fmtTime(clock.since)}</span> : null}
		</button>
	) : (
		<button
			type="button"
			className={btn.secondary}
			disabled={pending}
			onClick={() => void run(() => clockIn(), "Clocked in · have a good shift", setClock)}
		>
			<LogInIcon className="mr-1 inline size-4" /> Clock in
		</button>
	);
}
