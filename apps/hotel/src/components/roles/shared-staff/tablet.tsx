"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { myClock } from "@hospio/api/actions/workforce";
import type { ClockStatus } from "@hospio/api/data/types";
import { fmtTime } from "@hospio/ui/shared/format";
import { cn } from "@hospio/ui/utils";

/**
 * Tablet-sized pieces for the staff apps (Figma 1180×820): big action tiles, h-12 buttons, board
 * columns and cards. Everything else comes from components/shared.
 */

export const big = {
	primary:
		"flex h-12 items-center justify-center gap-2 rounded-control bg-brand px-5 text-[15px] font-semibold text-white hover:bg-brand/90 disabled:opacity-60",
	secondary:
		"flex h-12 items-center justify-center gap-2 rounded-control border border-line bg-card px-5 text-[15px] font-semibold text-ink hover:bg-subtle disabled:opacity-60",
	danger:
		"flex h-12 items-center justify-center gap-2 rounded-control bg-danger px-5 text-[15px] font-semibold text-white hover:bg-danger/90 disabled:opacity-60",
	dangerSoft:
		"flex h-12 items-center justify-center gap-2 rounded-control border border-danger/30 bg-danger-soft px-5 text-[15px] font-semibold text-danger hover:bg-danger-soft/70",
	ghost:
		"flex h-12 items-center justify-center gap-2 rounded-control px-4 text-[15px] font-semibold text-ink-2 hover:bg-subtle hover:text-ink",
} as const;

export function BigButton({
	tone = "primary",
	pending,
	className,
	children,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
	tone?: keyof typeof big;
	pending?: boolean;
}) {
	return (
		<button
			type="button"
			className={cn(big[tone], className)}
			disabled={pending || props.disabled}
			{...props}
		>
			{pending ? <Loader2Icon className="size-5 animate-spin" /> : children}
		</button>
	);
}

/** The quick-action strip at the top of a tablet screen ("New sale", "Open tabs · 3", …). */
export function ActionTile({
	icon: Icon,
	label,
	onClick,
	href,
	tone = "default",
}: {
	icon: LucideIcon;
	label: ReactNode;
	onClick?: () => void;
	href?: string;
	tone?: "default" | "brand";
}) {
	const cls = cn(
		"flex h-16 flex-1 items-center gap-3 rounded-card border border-line px-5 text-[15px] font-semibold transition-colors",
		tone === "brand"
			? "bg-brand text-white hover:bg-brand/90"
			: "bg-card text-ink hover:bg-brand-soft/40",
	);
	const inner = (
		<>
			<span
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-[10px]",
					tone === "brand"
						? "bg-white/15 text-white"
						: "bg-brand-soft text-brand",
				)}
			>
				<Icon className="size-[18px]" />
			</span>
			{label}
		</>
	);
	return href ? (
		<a href={href} className={cls}>
			{inner}
		</a>
	) : (
		<button type="button" onClick={onClick} className={cls}>
			{inner}
		</button>
	);
}

/** "On shift · until 2pm" pill shown in the header of every staff screen. */
export function ShiftPill(_: { until?: string } = {}) {
	// The signed-in person's clock: "On shift since 9:02am" or "Not clocked in" (My shifts clocks in and out).
	const [clock, setClock] = useState<ClockStatus | null | undefined>(undefined);
	useEffect(() => {
		let alive = true;
		myClock()
			.then((c) => alive && setClock(c))
			.catch(() => alive && setClock(null));
		return () => {
			alive = false;
		};
	}, []);
	if (clock === undefined || clock === null) return null;
	return clock.clockedIn ? (
		<span className="inline-flex items-center gap-2 rounded-pill bg-success-soft px-3 py-[7px] text-[13px] font-medium text-success">
			<span className="size-2 rounded-full bg-success" /> On shift
			{clock.since ? ` since ${fmtTime(clock.since)}` : ""}
		</span>
	) : (
		<Link
			href="/dashboard/shifts"
			className="inline-flex items-center gap-2 rounded-pill bg-subtle px-3 py-[7px] text-[13px] font-medium text-ink-2"
		>
			<span className="size-2 rounded-full bg-ink-3" /> Not clocked in · My
			shifts
		</Link>
	);
}

/** A board column (New · Cooking · Ready…) with a count. */
export function BoardColumn({
	title,
	count,
	tone,
	children,
	className,
}: {
	title: string;
	count: number;
	tone?: "success" | "warning" | "info" | "danger";
	children: ReactNode;
	className?: string;
}) {
	const dot = tone
		? {
				success: "bg-success",
				warning: "bg-[#dbab00]",
				info: "bg-info",
				danger: "bg-danger",
			}[tone]
		: "bg-ink-3";
	return (
		<section
			className={cn(
				"flex min-h-[420px] min-w-0 flex-1 flex-col rounded-card border border-line bg-subtle/50",
				className,
			)}
		>
			<header className="flex items-center gap-2 px-4 pt-4 pb-3">
				<span className={cn("size-2 rounded-full", dot)} />
				<h2 className="flex-1 text-[15px] font-bold text-ink">{title}</h2>
				<span className="text-sm font-medium text-ink-3">{count}</span>
			</header>
			<div className="flex flex-col gap-3 px-3 pb-3">{children}</div>
		</section>
	);
}

/** A card on a board or in a list. Click opens details; `accent` draws the brand outline (current item). */
export function BoardCard({
	onClick,
	label,
	accent = "none",
	className,
	children,
}: {
	onClick?: () => void;
	/** What the card opens, for screen readers ("Open K-0004"). */
	label?: string;
	accent?: "none" | "brand" | "success" | "warning";
	className?: string;
	children: ReactNode;
}) {
	const border = {
		none: "border-line",
		brand: "border-brand bg-brand-soft/20",
		success: "border-success",
		warning: "border-[#dbab00]",
	}[accent];
	// A card can hold its own buttons (Start, Ready), so it is never a <button> itself: nested buttons are
	// invalid HTML, the browser splits them and the page fails to hydrate. A full-size button sits behind
	// the content instead; the content lets clicks through except on its own buttons and links.
	return (
		<div
			className={cn(
				"relative flex w-full flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors",
				border,
				onClick && "hover:border-brand/50",
				className,
			)}
		>
			{onClick && (
				<button
					type="button"
					aria-label={label ?? "Open"}
					onClick={onClick}
					className="absolute inset-0 rounded-xl"
				/>
			)}
			<div
				className={cn(
					"relative flex flex-col gap-2",
					onClick &&
						"pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto",
				)}
			>
				{children}
			</div>
		</div>
	);
}

/** The square room-number badge from the housekeeping list. */
export function RoomBadge({
	number,
	active,
}: {
	number: string;
	active?: boolean;
}) {
	return (
		<span
			className={cn(
				"flex h-12 min-w-[64px] items-center justify-center rounded-xl px-3 text-lg font-bold",
				active ? "bg-brand text-white" : "bg-subtle text-ink",
			)}
		>
			{number}
		</span>
	);
}

/** One line of "Tonight so far" totals. */
export function StatLine({
	label,
	value,
	tone,
}: {
	label: string;
	value: ReactNode;
	tone?: "warning" | "success" | "danger";
}) {
	return (
		<div className="flex items-center justify-between py-[6px] text-[15px]">
			<span className="text-ink-2">{label}</span>
			<span
				className={cn(
					"font-semibold text-ink",
					tone === "warning" && "text-warning",
					tone === "success" && "text-success",
					tone === "danger" && "text-danger",
				)}
			>
				{value}
			</span>
		</div>
	);
}

/** Stepper for quantities. */
export function Stepper({
	value,
	onChange,
	min = 0,
	max = 99,
}: {
	value: number;
	onChange: (v: number) => void;
	min?: number;
	max?: number;
}) {
	return (
		<span className="inline-flex items-center rounded-control border border-line">
			<button
				type="button"
				onClick={() => onChange(Math.max(min, value - 1))}
				className="flex size-10 items-center justify-center text-lg text-ink-2 hover:bg-subtle"
			>
				−
			</button>
			<span className="w-8 text-center text-[15px] font-semibold text-ink">
				{value}
			</span>
			<button
				type="button"
				onClick={() => onChange(Math.min(max, value + 1))}
				className="flex size-10 items-center justify-center text-lg text-ink-2 hover:bg-subtle"
			>
				+
			</button>
		</span>
	);
}

/** Minutes since an ISO time, for order cards. */
export function minutesSince(iso: string) {
	return Math.max(
		0,
		Math.round((Date.now() - new Date(iso).getTime()) / 60000),
	);
}
