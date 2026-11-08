import type { ReactNode } from "react";
import { cn } from "@hospio/ui/utils";

export type PillTone = "success" | "warning" | "danger" | "info" | "grey" | "brand";

const tones: Record<PillTone, string> = {
	success: "bg-success-soft text-success",
	warning: "bg-warning-soft text-warning",
	danger: "bg-danger-soft text-danger",
	info: "bg-info-soft text-info",
	grey: "bg-subtle text-ink-2",
	brand: "bg-brand-soft text-brand",
};

/** Status pill from the component library: Green = done/OK · Amber = watch · Red = problem · Grey = neutral · Blue = in progress. */
export function StatusPill({
	tone = "grey",
	dot = true,
	className,
	children,
}: {
	tone?: PillTone;
	dot?: boolean;
	className?: string;
	children: ReactNode;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-[5px] rounded-pill px-2 py-[3px] text-[11px] font-semibold leading-none whitespace-nowrap",
				tones[tone],
				className,
			)}
		>
			{dot && <span className="size-[6px] rounded-full bg-current" aria-hidden />}
			{children}
		</span>
	);
}
