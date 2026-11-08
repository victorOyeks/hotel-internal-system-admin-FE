"use client";

import type { LucideIcon } from "lucide-react";
import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@hospio/ui/primitives/sheet";
import { cn } from "@hospio/ui/utils";

/**
 * Side panel from the rules board: 520 wide (680 for wide), full height on the right, header with an
 * icon badge, 20px bold title and one line of context; footer with info left and actions right.
 * `tone="danger"` adds the red top bar for destructive flows.
 */
export function SidePanel({
	open,
	onOpenChange,
	title,
	subtitle,
	icon: Icon,
	width = "md",
	tone = "default",
	footer,
	footerInfo,
	children,
	className,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	subtitle?: ReactNode;
	icon?: LucideIcon;
	width?: "md" | "lg";
	tone?: "default" | "danger";
	footer?: ReactNode;
	footerInfo?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className={cn(
					"w-full gap-0 border-l-0 bg-card p-0 [&>button:last-child]:hidden",
					width === "md" ? "sm:max-w-[520px]" : "sm:max-w-[680px]",
					className,
				)}
			>
				{tone === "danger" && <div className="h-1 w-full bg-danger" />}
				<header className="flex items-start gap-3 border-b border-line px-6 py-5">
					{Icon && (
						<span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone === "danger" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand")}>
							<Icon className="size-5" />
						</span>
					)}
					<div className="min-w-0 flex-1">
						<SheetTitle className="text-xl font-bold leading-tight text-ink">{title}</SheetTitle>
						{subtitle && <p className="mt-[2px] text-[13px] text-ink-3">{subtitle}</p>}
					</div>
					<button type="button" onClick={() => onOpenChange(false)} className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-subtle hover:text-ink" aria-label="Close">
						<XIcon className="size-[18px]" />
					</button>
				</header>
				<div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
				{(footer || footerInfo) && (
					<footer className="flex items-center gap-3 border-t border-line px-6 py-4">
						<div className="min-w-0 flex-1 text-xs text-ink-3">{footerInfo}</div>
						<div className="flex items-center gap-2">{footer}</div>
					</footer>
				)}
			</SheetContent>
		</Sheet>
	);
}

/** A labelled block inside a panel: "What happens", "Guest", "Payment"… */
export function PanelSection({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
	return (
		<section className={cn("flex flex-col gap-3", className)}>
			{title && <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{title}</h3>}
			{children}
		</section>
	);
}

/** The "What happens" box used before destructive or money-moving actions. */
export function WhatHappens({ items, tone = "info" }: { items: ReactNode[]; tone?: "info" | "danger" | "warning" }) {
	const cls = { info: "bg-info-soft text-info", danger: "bg-danger-soft text-danger", warning: "bg-warning-soft text-warning" }[tone];
	return (
		<div className={cn("rounded-xl px-4 py-3 text-[13px]", cls)}>
			<p className="mb-1 font-semibold">What happens</p>
			<ul className="list-disc space-y-[2px] pl-4 text-[13px] opacity-90">
				{items.map((item, i) => (
					<li key={i}>{item}</li>
				))}
			</ul>
		</div>
	);
}
