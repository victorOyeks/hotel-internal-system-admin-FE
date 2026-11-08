import { CheckIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@hospio/ui/utils";

export type PillTone = "green" | "amber" | "red" | "grey" | "blue";

const pillTones: Record<PillTone, string> = {
	green: "bg-status-ok-soft text-status-ok",
	amber: "bg-status-warn-soft text-status-warn",
	red: "bg-status-bad-soft text-status-bad",
	grey: "bg-subtle text-ink-2",
	blue: "bg-status-note-soft text-status-note",
};

/** The kit's status pill (Components 3313:3871…), as a static illustration piece. */
export function StatusPill({
	label,
	tone = "grey",
	className,
}: {
	label: string;
	tone?: PillTone;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-[5px] whitespace-nowrap rounded-pill px-2 py-[3px] text-[11px] font-semibold",
				pillTones[tone],
				className,
			)}
		>
			<span className="size-[6px] rounded-full bg-current" />
			{label}
		</span>
	);
}

/** Soft tint used behind the small icons in the hero's "Worth a look" list. */
export const softTileTones: Record<
	Exclude<PillTone, "grey" | "green">,
	string
> = {
	amber: "bg-status-warn-soft text-status-warn",
	red: "bg-status-bad-soft text-status-bad",
	blue: "bg-status-note-soft text-status-note",
};

const tileTones = {
	soft: "bg-brand-soft text-brand",
	brand: "bg-brand text-white",
	glass: "bg-white/10 text-white",
} as const;

const tileSizes = {
	sm: "size-10 [&>svg]:size-5",
	md: "size-11 [&>svg]:size-[22px]",
	lg: "size-14 [&>svg]:size-[26px]",
} as const;

/** Rounded square behind a feature icon. */
export function IconTile({
	icon: Icon,
	tone = "soft",
	size = "md",
	className,
}: {
	icon: LucideIcon;
	tone?: keyof typeof tileTones;
	size?: keyof typeof tileSizes;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"flex shrink-0 items-center justify-center rounded-control",
				tileTones[tone],
				tileSizes[size],
				className,
			)}
		>
			<Icon strokeWidth={2.25} />
		</span>
	);
}

/** A bullet with the design's green check. */
export function CheckItem({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<li
			className={cn(
				"flex items-start gap-[10px] text-[15px] leading-[1.45] text-ink",
				className,
			)}
		>
			<CheckIcon
				className="mt-[2px] size-[18px] shrink-0 text-status-ok"
				strokeWidth={3}
			/>
			<span>{children}</span>
		</li>
	);
}

/** The deep, soft maroon shadow under the product shots. */
export const shotShadow = "shadow-[0_24px_60px_rgba(77,8,31,0.1)]";
