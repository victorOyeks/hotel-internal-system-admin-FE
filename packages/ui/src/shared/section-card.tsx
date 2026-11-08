import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@hospio/ui/utils";

/** The white card every dashboard section sits in: title, one-line context, an optional link or count on the right. */
export function SectionCard({
	title,
	subtitle,
	action,
	count,
	headerRight,
	className,
	bodyClassName,
	flush = false,
	children,
}: {
	title: string;
	subtitle?: string;
	action?: { label: string; href: string };
	count?: number;
	headerRight?: ReactNode;
	className?: string;
	bodyClassName?: string;
	/** Rows run edge to edge (tables). */
	flush?: boolean;
	children: ReactNode;
}) {
	return (
		<section className={cn("flex flex-col rounded-card border border-line bg-card", flush ? "pt-[18px]" : "px-5 py-[18px]", className)}>
			<header className={cn("flex items-center gap-3", flush ? "px-5 pb-3" : "pb-2")}>
				<div className="min-w-0 flex-1">
					<h2 className="text-base font-bold text-ink">{title}</h2>
					{subtitle && <p className="text-xs text-ink-3">{subtitle}</p>}
				</div>
				{headerRight}
				{typeof count === "number" && (
					<span className="rounded-pill bg-brand-soft px-2 py-[2px] text-xs font-bold text-brand">{count}</span>
				)}
				{action && (
					<Link href={action.href} className="text-[13px] font-semibold text-brand hover:underline">
						{action.label} →
					</Link>
				)}
			</header>
			<div className={cn("flex flex-1 flex-col", bodyClassName)}>{children}</div>
		</section>
	);
}
