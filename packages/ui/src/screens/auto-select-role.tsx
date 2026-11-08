"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useRef } from "react";
import { selectRole } from "@hospio/api/actions";

/** Someone with a single role never sees the picker: the role is chosen for them and they land on the dashboard. */
export function AutoSelectRole({ role }: { role: string }) {
	const started = useRef(false);
	useEffect(() => {
		if (started.current) return;
		started.current = true;
		void selectRole(role);
	}, [role]);
	return (
		<main className="flex min-h-screen items-center justify-center bg-page">
			<p className="flex items-center gap-2 text-sm text-ink-2">
				<Loader2Icon className="size-4 animate-spin" /> Opening your dashboard…
			</p>
		</main>
	);
}
