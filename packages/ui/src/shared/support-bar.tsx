"use client";

import { EyeIcon, LogOutIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { logout } from "@hospio/api/actions";
import { setReadOnlySupport } from "@hospio/api/actions/use-action";
import { cn } from "@hospio/ui/utils";
import { btn } from "./ui";

/**
 * The bar above the dashboard while a platform admin views the hotel app as the owner ("View as
 * owner" from the admin portal): fixed to the top, names the access, its end time and a Leave button
 * that ends the session. Mounted by the dashboard shell when the session carries `actedBy`.
 */
export function SupportBar({ endsAt }: { endsAt: number }) {
	const [pending, startTransition] = useTransition();
	// The time is written in the browser's zone after mount, so the server markup never disagrees with it.
	const [ends, setEnds] = useState<string | null>(null);
	useEffect(() => {
		setReadOnlySupport(true);
		setEnds(
			new Date(endsAt * 1000).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			}),
		);
		return () => setReadOnlySupport(false);
	}, [endsAt]);
	return (
		<div className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center justify-center gap-3 bg-warning px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
			<EyeIcon className="size-4" />
			<span>Viewing as Hospio360 support · read only · ends at {ends ?? "…"}</span>
			<button
				type="button"
				disabled={pending}
				onClick={() => startTransition(() => logout())}
				className={cn(
					btn.small,
					"flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-white hover:bg-white/30",
				)}
			>
				<LogOutIcon className="size-3" /> Leave
			</button>
		</div>
	);
}
